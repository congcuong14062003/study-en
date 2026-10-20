import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { ExamAttempt } from "@prisma/client";
import { examPapers } from "../prisma/exam-content";
import {
  examPaperSchema, examHasExpired, examElapsedSeconds, gradeExam,
  publicExamPaper, validateExamAnswers, shouldAcceptExamUpdate, type ExamAnswers,
} from "../src/lib/exams";
import { db } from "../src/lib/db";
import { readExamAttempt, saveExamAnswers, startExam, submitExam, publicExamAttempt } from "../src/services/exams";

test("six original papers cover both exams at three levels with valid answer keys", () => {
  assert.equal(examPapers.length, 6);
  assert.equal(new Set(examPapers.map((paper) => paper.id)).size, 6);
  for (const type of ["TOEIC", "IELTS"]) for (const level of ["foundation", "intermediate", "advanced"])
    assert.ok(examPapers.some((paper) => paper.examType === type && paper.level === level));
  for (const paper of examPapers) {
    assert.equal(examPaperSchema.safeParse(paper).success, true);
    assert.equal(paper.questions.length, 12);
    for (const q of paper.questions) {
      if (q.kind === "choice") assert.equal(new Set(q.options).size, q.options.length);
      else for (const answer of q.correctAnswers) {
        assert.ok(answer.split(/\s+/).length <= q.maxWords);
        assert.ok(q.passage?.toLowerCase().includes(answer.toLowerCase()));
      }
    }
    const answers = Object.fromEntries(paper.questions.map((q) => [q.id, q.correctAnswers[0]]));
    assert.equal(gradeExam(paper, answers).percent, 100);
    assert.equal(gradeExam(paper, {}).unanswered, paper.questions.length);
  }
});

test("grading distinguishes wrong, correct, and blank answers and respects short-answer word limits", () => {
  const paper = examPapers.find((p) => p.examType === "IELTS")!;
  const questions = paper.questions;
  const answers: ExamAnswers = {
    [questions[0].id]: questions[0].correctAnswers[0],
    [questions[1].id]: "3",
    [questions[8].id]: " RAISED   BEDS. ",
    [questions[9].id]: "the rainwater",
  };
  const result = gradeExam(paper, answers);
  assert.equal(result.score, 2);
  assert.equal(result.incorrect, 2);
  assert.equal(result.unanswered, 8);
  assert.ok(result.results[8].correct);
  assert.ok(!result.results[9].correct);
  assert.throws(() => validateExamAnswers(paper, { foreign: "1" }));
  assert.throws(() => validateExamAnswers(paper, { [questions[0].id]: "9" }));
  assert.throws(() => validateExamAnswers(paper, { [questions[0].id]: "01" }));
});

test("deadlines expire at the exact boundary, cap elapsed time, and never apply to practice", () => {
  const started = new Date("2026-10-16T00:00:00Z");
  const end = new Date(started.getTime() + 60000);
  assert.equal(examHasExpired(end, new Date(end.getTime() - 1)), false);
  assert.equal(examHasExpired(end, end), true);
  assert.equal(examHasExpired(null, new Date(end.getTime() + 86400000)), false);
  assert.equal(examElapsedSeconds(started, new Date(end.getTime() + 900000), end), 60);
  assert.equal(examElapsedSeconds(started, new Date(end.getTime() + 900000), null), 960);
});

test("public papers strip answer keys and explanations", () => {
  for (const paper of examPapers) {
    const data = JSON.stringify(publicExamPaper(paper));
    assert.ok(!data.includes('"correctAnswers"'));
    assert.ok(!data.includes('"explanation"'));
  }
});

function stub<T extends (...args: any[]) => any>(t: TestContext, object: object, name: string, implementation: T) {
  const methods = object as Record<string, unknown>;
  const original = methods[name];
  const mocked = t.mock.fn(implementation);
  methods[name] = mocked;
  t.after(() => { methods[name] = original; });
  return mocked;
}
function fixture(t: TestContext, expired = false) {
  const paper = structuredClone(examPapers[0]);
  const startedAt = new Date(Date.now() - 90000);
  let attempt: ExamAttempt = {
    id: "exam-test", userId: "learner-a", paperId: paper.id, mode: "timed",
    snapshot: JSON.parse(JSON.stringify(paper)), answers: { [paper.questions[0].id]: paper.questions[0].correctAnswers[0] },
    startedAt, expiresAt: new Date(Date.now() + (expired ? -10000 : 900000)), submittedAt: null,
    autoSubmitted: false, elapsedSeconds: 0, score: null, total: paper.questions.length,
    result: null, updatedAt: new Date(),
  };
  let writes = 0;
  const tx = {
    $queryRaw: async () => [{ id: "learner-a" }],
    examAttempt: {
      findFirst: async ({ where }: { where: { id?: string; userId: string; mode?: string; submittedAt?: null } }) =>
        where.userId === attempt.userId && (!where.mode || where.mode === attempt.mode) &&
        !(where.submittedAt === null && attempt.submittedAt) ? attempt : null,
      create: async ({ data }: { data: Partial<ExamAttempt> }) => {
        attempt = { ...attempt, answers: {}, submittedAt: null, score: null, result: null, autoSubmitted: false, ...data };
        return attempt;
      },
      update: async ({ data }: { data: Partial<ExamAttempt> }) => { writes++; attempt = { ...attempt, ...data }; return attempt; },
    },
    examPaper: { findFirst: async () => ({ ...paper, published: true }) },
  };
  stub(t, db, "$transaction", async (run: (client: unknown) => Promise<unknown>) => run(tx));
  return { paper, current: () => attempt, writes: () => writes };
}

test("server rejects late answer changes and grades only saved answers on expiration", async (t) => {
  const state = fixture(t, true);
  const answer = state.paper.questions[1];
  const result = await saveExamAnswers("learner-a", "exam-test", { [answer.id]: answer.correctAnswers[0] });
  assert.equal(result.autoSubmitted, true);
  assert.equal(result.result?.score, 1);
  assert.equal(result.answers[answer.id], undefined);
  assert.equal(result.submittedAt, state.current().expiresAt!.toISOString());
  assert.equal(result.elapsedSeconds, 80);
  const again = await submitExam("learner-a", "exam-test");
  assert.deepEqual(again.result, result.result);
  assert.equal(state.writes(), 1);
});

test("read restores the same timer and closes expired attempts after a disconnected browser returns", async (t) => {
  const state = fixture(t, true);
  const data = await readExamAttempt("learner-a", "exam-test");
  assert.ok(data.submittedAt);
  assert.ok(data.result?.results.every((row) => row.explanation));
  assert.equal(data.expiresAt, state.current().expiresAt!.toISOString());
});

test("active attempts never expose results and users cannot access another user's attempt", async (t) => {
  const state = fixture(t);
  const data = await readExamAttempt("learner-a", "exam-test");
  assert.equal(data.result, null);
  assert.equal(JSON.stringify(data).includes('"correctAnswers"'), false);
  await assert.rejects(() => readExamAttempt("learner-b", "exam-test"), /Không tìm thấy/);
  await assert.rejects(() => saveExamAnswers("learner-b", "exam-test", {}), /Không tìm thấy/);
  await assert.rejects(() => submitExam("learner-b", "exam-test"), /Không tìm thấy/);
  assert.equal(state.writes(), 0);
});

test("resuming a current timed attempt preserves the original deadline", async (t) => {
  const state = fixture(t);
  const deadline = state.current().expiresAt!.toISOString();
  const data = await startExam("learner-a", state.paper.id, "timed");
  assert.equal(data.id, "exam-test");
  assert.equal(data.expiresAt, deadline);
  assert.equal(state.writes(), 0);
  assert.equal(publicExamAttempt(state.current()).result, null);
});

test("practice mode has no deadline and accepts saved answers before an idempotent manual submission", async (t) => {
  const state = fixture(t);
  state.current().mode = "practice";
  state.current().expiresAt = null;
  const question = state.paper.questions[1];
  const saved = await saveExamAnswers("learner-a", "exam-test", { [question.id]: question.correctAnswers[0] });
  assert.equal(saved.submittedAt, null);
  const result = await submitExam("learner-a", "exam-test");
  assert.equal(result.autoSubmitted, false);
  assert.equal(result.result?.score, 2);
  assert.equal(result.expiresAt, null);
  await submitExam("learner-a", "exam-test");
  assert.equal(state.writes(), 2);
});

test("new practice and timed attempts derive their deadlines from the server's paper duration", async (t) => {
  const state = fixture(t);
  const practice = await startExam("learner-a", state.paper.id, "practice");
  assert.equal(practice.expiresAt, null);
  assert.deepEqual(practice.answers, {});
  const timed = await startExam("learner-a", state.paper.id, "timed");
  assert.equal(Date.parse(timed.expiresAt!) - Date.parse(timed.startedAt), state.paper.durationSeconds * 1000);
});

test("invalid questions never save, and grading uses the attempt's immutable question snapshot", async (t) => {
  const state = fixture(t);
  await assert.rejects(() => saveExamAnswers("learner-a", "exam-test", { foreign: "0" }), /không thuộc/);
  assert.equal(state.writes(), 0);
  state.paper.questions[0].correctAnswers = ["0"];
  const submitted = await submitExam("learner-a", "exam-test");
  assert.equal(submitted.result?.score, 1);
  assert.equal(submitted.result?.results[0].correctAnswers[0], "1");
});

test("late browser sync responses cannot reopen a submitted attempt or rewind the timer", (t) => {
  const state = fixture(t);
  const current = publicExamAttempt(state.current(), new Date("2026-10-16T09:00:10Z"));
  const earlier = { ...current, serverNow: "2026-10-16T09:00:00Z" };
  const closed = { ...current, submittedAt: current.serverNow };
  assert.equal(shouldAcceptExamUpdate(current, earlier), false);
  assert.equal(shouldAcceptExamUpdate(closed, current), false);
  assert.equal(shouldAcceptExamUpdate(current, closed), true);
  assert.equal(shouldAcceptExamUpdate(current, { ...current, id: "another-attempt" }), false);
});
