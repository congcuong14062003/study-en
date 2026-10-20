import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { examPapers } from "../prisma/exam-content";
import { examCatalog, readExamAttempt, saveExamAnswers, startExam, submitExam } from "../src/services/exams";

async function main() {
  const target = new URL(process.env.DATABASE_URL || "");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname))
    throw new Error("Integration test luyện đề chỉ chạy với PostgreSQL local.");
  const paper = examPapers[0];
  assert.ok(await db.examPaper.findUnique({ where: { id: paper.id } }), "Chạy pnpm db:seed:exams trước.");
  const user = await db.user.create({ data: {
    email: `exam-integration-${randomUUID()}@example.invalid`, name: "Temporary exam integration check",
  } });
  try {
    const practice = await startExam(user.id, paper.id, "practice");
    assert.equal(practice.expiresAt, null);
    assert.equal((await startExam(user.id, paper.id, "practice")).id, practice.id);
    const parallel = await Promise.all([
      startExam(user.id, paper.id, "timed"), startExam(user.id, paper.id, "timed"),
    ]);
    assert.equal(parallel[0].id, parallel[1].id, "Parallel starts must resume one timed attempt.");
    assert.equal(Date.parse(parallel[0].expiresAt!) - Date.parse(parallel[0].startedAt), paper.durationSeconds * 1000);
    assert.equal(JSON.stringify(practice).includes('"correctAnswers"'), false);
    const first = paper.questions[0];
    const second = paper.questions[1];
    await saveExamAnswers(user.id, practice.id, { [first.id]: first.correctAnswers[0] });
    assert.equal((await readExamAttempt(user.id, practice.id)).answers[first.id], first.correctAnswers[0]);
    const submitted = await submitExam(user.id, practice.id);
    assert.equal(submitted.result?.score, 1);
    assert.equal(submitted.result?.unanswered, paper.questions.length - 1);
    assert.ok(submitted.result?.results[0].explanation);
    assert.deepEqual((await submitExam(user.id, practice.id)).result, submitted.result);
    await assert.rejects(() => readExamAttempt("not-the-owner", practice.id), /Không tìm thấy/);

    const timed = parallel[0];
    await saveExamAnswers(user.id, timed.id, { [first.id]: first.correctAnswers[0] });
    const deadline = new Date(Date.now() - 1000);
    await db.examAttempt.update({ where: { id: timed.id }, data: {
      startedAt: new Date(deadline.getTime() - 30000), expiresAt: deadline,
    } });
    const expired = await saveExamAnswers(user.id, timed.id, { [second.id]: second.correctAnswers[0] });
    assert.equal(expired.autoSubmitted, true);
    assert.equal(expired.submittedAt, deadline.toISOString());
    assert.equal(expired.elapsedSeconds, 30);
    assert.equal(expired.answers[second.id], undefined);
    assert.equal(expired.result?.score, 1, "Late answers must not affect grading.");
    assert.deepEqual((await readExamAttempt(user.id, timed.id)).result, expired.result);
    const catalog = await examCatalog(user.id);
    assert.equal(catalog.papers.length, 6);
    assert.equal(catalog.attempts.length, 2);
    assert.equal(catalog.active.length, 0);
    console.log("Exam integration passed: actual PostgreSQL save/resume, concurrent start, private answers, grading, expiry, late-answer rejection, and history.");
  } finally {
    // This exact test user owns all temporary attempts; no real learner is touched.
    await db.user.delete({ where: { id: user.id } });
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Exam integration failed.");
  process.exitCode = 1;
}).finally(() => db.$disconnect());
