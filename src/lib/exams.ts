import { z } from "zod";

export const examModeSchema = z.enum(["practice", "timed"]);
export const examLevelSchema = z.enum(["foundation", "intermediate", "advanced"]);
const baseQuestion = z.object({
  id: z.string().min(1).max(100),
  part: z.string().min(1).max(100),
  skill: z.enum(["listening", "reading", "grammar"]),
  prompt: z.string().min(1).max(4000),
  passage: z.string().max(30000).optional(),
  audioText: z.string().max(10000).optional(),
  explanation: z.string().min(1).max(5000),
});
export const examQuestionSchema = z.discriminatedUnion("kind", [
  baseQuestion.extend({
    kind: z.literal("choice"),
    options: z.array(z.string().min(1).max(1500)).min(2).max(6),
    correctAnswers: z.array(z.string()).length(1),
  }),
  baseQuestion.extend({
    kind: z.literal("short-answer"),
    maxWords: z.number().int().min(1).max(10),
    correctAnswers: z.array(z.string().trim().min(1).max(200)).min(1).max(10),
  }),
]).superRefine((question, ctx) => {
  if (question.kind === "choice") {
    const answer = question.correctAnswers[0];
    if (!/^\d$/.test(answer) || Number(answer) >= question.options.length)
      ctx.addIssue({ code: "custom", message: "Đáp án không nằm trong lựa chọn." });
  }
});
export const examPaperSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(250),
  examType: z.enum(["TOEIC", "IELTS"]),
  level: examLevelSchema,
  description: z.string().min(1).max(1500),
  durationSeconds: z.number().int().min(30).max(14400),
  questions: z.array(examQuestionSchema).min(1).max(250),
}).superRefine((paper, ctx) => {
  if (new Set(paper.questions.map((q) => q.id)).size !== paper.questions.length)
    ctx.addIssue({ code: "custom", message: "Mã câu hỏi bị trùng trong đề." });
});
export const examAnswersSchema = z.record(z.string().max(100), z.string().max(200))
  .refine((answers) => Object.keys(answers).length <= 250, "Quá nhiều đáp án.");

export type ExamQuestion = z.infer<typeof examQuestionSchema>;
export type ExamPaper = z.infer<typeof examPaperSchema>;
export type ExamMode = z.infer<typeof examModeSchema>;
export type ExamAnswers = Record<string, string>;
export type PublicExamQuestion = Omit<Extract<ExamQuestion, { kind: "choice" }>, "correctAnswers" | "explanation">
  | Omit<Extract<ExamQuestion, { kind: "short-answer" }>, "correctAnswers" | "explanation">;
export type ExamResult = ReturnType<typeof gradeExam>;
export type PublicExamAttempt = {
  id: string;
  paper: Omit<ExamPaper, "questions"> & { questions: PublicExamQuestion[] };
  mode: ExamMode;
  answers: ExamAnswers;
  startedAt: string;
  expiresAt: string | null;
  submittedAt: string | null;
  autoSubmitted: boolean;
  elapsedSeconds: number;
  serverNow: string;
  result: ExamResult | null;
};
export type ExamSummary = {
  id: string;
  paperId: string;
  title: string;
  examType: string;
  level: string;
  mode: ExamMode;
  startedAt: string;
  submittedAt: string | null;
  expiresAt: string | null;
  score: number | null;
  total: number;
  elapsedSeconds: number;
  autoSubmitted: boolean;
};
export type ExamCatalog = {
  papers: (Omit<ExamPaper, "questions"> & { questionCount: number; skills: string[] })[];
  attempts: ExamSummary[];
  active: ExamSummary[];
};
export const examLevelLabels: Record<string, string> = {
  foundation: "Cơ bản", intermediate: "Trung cấp", advanced: "Nâng cao",
};

export function normalizeExamAnswer(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US")
    .replace(/[’‘]/g, "'").replace(/\s+/g, " ").replace(/[.!?,;:]+$/g, "").trim();
}
export function publicExamPaper(paper: ExamPaper): PublicExamAttempt["paper"] {
  return {
    ...paper,
    questions: paper.questions.map(({ correctAnswers: _, explanation: __, ...question }) => question),
  };
}
export function examHasExpired(expiresAt: Date | string | null, now: Date) {
  return expiresAt !== null && new Date(expiresAt).getTime() <= now.getTime();
}
export function examElapsedSeconds(startedAt: Date | string, end: Date, expiresAt: Date | string | null) {
  const endAt = Math.min(end.getTime(), expiresAt ? new Date(expiresAt).getTime() : Infinity);
  return Math.max(0, Math.floor((endAt - new Date(startedAt).getTime()) / 1000));
}
export function formatExamTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(whole / 60) % 60).padStart(2, "0");
  const rest = String(whole % 60).padStart(2, "0");
  return whole >= 3600 ? `${String(Math.floor(whole / 3600)).padStart(2, "0")}:${minutes}:${rest}` : `${minutes}:${rest}`;
}
export function shouldAcceptExamUpdate(current: PublicExamAttempt, incoming: PublicExamAttempt) {
  if (current.id !== incoming.id || (current.submittedAt && !incoming.submittedAt)) return false;
  return Boolean(incoming.submittedAt) || Date.parse(incoming.serverNow) >= Date.parse(current.serverNow);
}
export function validateExamAnswers(paper: ExamPaper, updates: ExamAnswers) {
  for (const [id, answer] of Object.entries(updates)) {
    const question = paper.questions.find((q) => q.id === id);
    if (!question) throw new Error("Câu hỏi không thuộc bộ đề.");
    if (question.kind === "choice" && answer !== "" &&
      (!/^\d$/.test(answer) || Number(answer) >= question.options.length))
      throw new Error("Lựa chọn không hợp lệ.");
  }
}
export function gradeExam(paper: ExamPaper, answers: ExamAnswers) {
  const results = paper.questions.map((question) => {
    const selected = answers[question.id] ?? "";
    const normalized = normalizeExamAnswer(selected);
    const withinWordLimit = question.kind !== "short-answer" || normalized.split(/\s+/).length <= question.maxWords;
    const correct = Boolean(normalized) && withinWordLimit && question.correctAnswers.some(
      (answer) => normalizeExamAnswer(answer) === normalized,
    );
    return { ...question, selected, correct, unanswered: !normalized };
  });
  const score = results.filter((r) => r.correct).length;
  const unanswered = results.filter((r) => r.unanswered).length;
  const sections = [...new Set(results.map((r) => r.part))].map((part) => {
    const items = results.filter((r) => r.part === part);
    return { part, score: items.filter((r) => r.correct).length, total: items.length };
  });
  return { score, total: results.length, percent: Math.round(score / results.length * 100),
    incorrect: results.length - score - unanswered, unanswered, sections, results };
}
