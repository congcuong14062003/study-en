import type { ExamAttempt, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/security";
import { lockUser } from "./learning";
import {
  examAnswersSchema, examElapsedSeconds, examHasExpired, examModeSchema,
  examPaperSchema, gradeExam, publicExamPaper, validateExamAnswers,
  type ExamCatalog, type ExamMode, type ExamResult, type ExamSummary, type PublicExamAttempt,
} from "@/lib/exams";

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
export function publicExamAttempt(attempt: ExamAttempt, now = new Date()): PublicExamAttempt {
  const paper = examPaperSchema.parse(attempt.snapshot);
  return {
    id: attempt.id, paper: publicExamPaper(paper), mode: examModeSchema.parse(attempt.mode),
    answers: examAnswersSchema.parse(attempt.answers),
    startedAt: attempt.startedAt.toISOString(), expiresAt: attempt.expiresAt?.toISOString() || null,
    submittedAt: attempt.submittedAt?.toISOString() || null, autoSubmitted: attempt.autoSubmitted,
    elapsedSeconds: attempt.submittedAt ? attempt.elapsedSeconds : examElapsedSeconds(attempt.startedAt, now, attempt.expiresAt),
    serverNow: now.toISOString(),
    result: attempt.submittedAt ? attempt.result as ExamResult | null : null,
  };
}
function summary(attempt: ExamAttempt): ExamSummary {
  const paper = examPaperSchema.parse(attempt.snapshot);
  return { id: attempt.id, paperId: attempt.paperId, title: paper.title,
    examType: paper.examType, level: paper.level, mode: examModeSchema.parse(attempt.mode),
    startedAt: attempt.startedAt.toISOString(), expiresAt: attempt.expiresAt?.toISOString() || null,
    submittedAt: attempt.submittedAt?.toISOString() || null, score: attempt.score, total: attempt.total,
    elapsedSeconds: attempt.elapsedSeconds, autoSubmitted: attempt.autoSubmitted };
}
async function ownedAttempt(tx: Prisma.TransactionClient, userId: string, id: string) {
  const attempt = await tx.examAttempt.findFirst({ where: { id, userId } });
  if (!attempt) throw new ApiError("Không tìm thấy lượt làm bài.", 404);
  return attempt;
}
async function finalise(tx: Prisma.TransactionClient, attempt: ExamAttempt, now: Date) {
  if (attempt.submittedAt) return attempt;
  const expired = examHasExpired(attempt.expiresAt, now);
  const submittedAt = expired ? attempt.expiresAt! : now;
  const result = gradeExam(examPaperSchema.parse(attempt.snapshot), examAnswersSchema.parse(attempt.answers));
  return tx.examAttempt.update({
    where: { id: attempt.id },
    data: { submittedAt, autoSubmitted: expired, score: result.score,
      elapsedSeconds: examElapsedSeconds(attempt.startedAt, submittedAt, attempt.expiresAt),
      result: json(result) },
  });
}
export async function examCatalog(userId: string): Promise<ExamCatalog> {
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const now = new Date();
    // An expired attempt is closed even if its browser was offline at the deadline.
    const expired = await tx.examAttempt.findMany({
      where: { userId, submittedAt: null, expiresAt: { lte: now } },
    });
    for (const attempt of expired) await finalise(tx, attempt, now);
    const [papers, attempts, active] = await Promise.all([
      tx.examPaper.findMany({ where: { published: true }, orderBy: [{ examType: "asc" }, { durationSeconds: "asc" }] }),
      tx.examAttempt.findMany({ where: { userId, submittedAt: { not: null } }, orderBy: { startedAt: "desc" }, take: 30 }),
      tx.examAttempt.findMany({ where: { userId, submittedAt: null }, orderBy: { startedAt: "desc" } }),
    ]);
    return {
      papers: papers.map((row) => {
        const { questions, ...paper } = examPaperSchema.parse(row);
        return { ...paper, questionCount: questions.length, skills: [...new Set(questions.map((q) => q.skill))] };
      }),
      attempts: attempts.map(summary), active: active.map(summary),
    };
  }, { timeout: 15000 });
}
export async function startExam(userId: string, paperId: string, mode: ExamMode) {
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const now = new Date();
    const row = await tx.examPaper.findFirst({ where: { id: paperId, published: true } });
    if (!row) throw new ApiError("Không tìm thấy bộ đề.", 404);
    const existing = await tx.examAttempt.findFirst({ where: { userId, paperId, mode, submittedAt: null } });
    if (existing) return publicExamAttempt(examHasExpired(existing.expiresAt, now) ? await finalise(tx, existing, now) : existing, now);
    const paper = examPaperSchema.parse(row);
    const attempt = await tx.examAttempt.create({ data: {
      userId, paperId, mode, snapshot: json(paper), total: paper.questions.length, startedAt: now,
      expiresAt: mode === "timed" ? new Date(now.getTime() + paper.durationSeconds * 1000) : null,
    } });
    return publicExamAttempt(attempt, now);
  });
}
export async function readExamAttempt(userId: string, id: string) {
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    let attempt = await ownedAttempt(tx, userId, id);
    const now = new Date();
    if (!attempt.submittedAt && examHasExpired(attempt.expiresAt, now)) attempt = await finalise(tx, attempt, now);
    return publicExamAttempt(attempt, now);
  });
}
export async function saveExamAnswers(userId: string, id: string, raw: unknown) {
  const updates = examAnswersSchema.parse(raw);
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    let attempt = await ownedAttempt(tx, userId, id);
    const now = new Date();
    if (attempt.submittedAt) return publicExamAttempt(attempt, now);
    if (examHasExpired(attempt.expiresAt, now)) return publicExamAttempt(await finalise(tx, attempt, now), now);
    const paper = examPaperSchema.parse(attempt.snapshot);
    try { validateExamAnswers(paper, updates); }
    catch (error) { throw new ApiError((error as Error).message); }
    const answers = examAnswersSchema.parse(attempt.answers);
    for (const [questionId, answer] of Object.entries(updates)) {
      if (answer.trim()) answers[questionId] = answer;
      else delete answers[questionId];
    }
    attempt = await tx.examAttempt.update({ where: { id }, data: { answers: json(answers) } });
    return publicExamAttempt(attempt, now);
  });
}
export async function submitExam(userId: string, id: string) {
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const attempt = await ownedAttempt(tx, userId, id);
    const now = new Date();
    return publicExamAttempt(await finalise(tx, attempt, now), now);
  });
}
