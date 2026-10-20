import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";
import { db } from "../src/lib/db";
import { examPapers } from "../prisma/exam-content";
import type { PublicExamAttempt } from "../src/lib/exams";

async function main() {
  const localHosts = ["localhost", "127.0.0.1", "[::1]"];
  const database = new URL(process.env.DATABASE_URL || "");
  const base = new URL(process.env.EXAM_TEST_BASE_URL || "http://localhost:3000");
  assert.ok(localHosts.includes(database.hostname), "HTTP integration requires a local database.");
  assert.ok(localHosts.includes(base.hostname) && base.protocol === "http:", "HTTP integration requires a local dev server.");
  const secret = process.env.NEXTAUTH_SECRET;
  assert.ok(secret, "NEXTAUTH_SECRET is required to authenticate the temporary test user.");
  // Check the server before creating test records. Never use a learner's session.
  const options = await fetch(new URL("/api/exam-attempts/test/answers", base), {
    method: "OPTIONS", signal: AbortSignal.timeout(30000),
  });
  assert.ok(options.headers.get("allow")?.split(/,\s*/).includes("PUT"), "Answer route must export PUT.");
  const paper = examPapers[0];
  assert.ok(await db.examPaper.findUnique({ where: { id: paper.id } }), "Run pnpm db:seed:exams first.");
  const user = await db.user.create({ data: {
    email: `exam-http-${randomUUID()}@example.invalid`, name: "Temporary exam HTTP check",
  } });
  try {
    const token = await encode({ secret, maxAge: 600, token: {
      sub: user.id, id: user.id, role: user.role, sessionVersion: user.sessionVersion,
      deadline: Date.now() + 600000,
    } });
    async function request(path: string, method = "GET", body?: unknown) {
      const response = await fetch(new URL(`/api${path}`, base), {
        method,
        headers: { "Content-Type": "application/json", Origin: base.origin, Cookie: `next-auth.session-token=${token}` },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(response.status, 200, `${method} ${path} must return 200, got ${response.status}.`);
      assert.ok(response.headers.get("content-type")?.includes("application/json"));
      return response.json() as Promise<PublicExamAttempt>;
    }
    const attempt = await request(`/exams/${paper.id}/start`, "POST", { mode: "practice" });
    assert.ok(attempt.id);
    const first = paper.questions[0];
    const second = paper.questions[1];
    const path = `/exam-attempts/${attempt.id}`;
    const saved = await request(`${path}/answers`, "PUT", { answers: { [first.id]: first.correctAnswers[0] } });
    assert.equal(saved.answers[first.id], first.correctAnswers[0]);
    assert.equal((await request(path)).answers[first.id], first.correctAnswers[0]);
    await request(`${path}/answers`, "PUT", { answers: { [second.id]: second.correctAnswers[0] } });
    const restored = await request(path);
    assert.equal(restored.answers[first.id], first.correctAnswers[0]);
    assert.equal(restored.answers[second.id], second.correctAnswers[0]);
    assert.equal(restored.result, null);
    const submitted = await request(`${path}/submit`, "POST", {});
    assert.equal(submitted.result?.score, 2);
    assert.equal(submitted.result?.unanswered, paper.questions.length - 2);
    assert.ok(submitted.result?.results[0].explanation);
    assert.deepEqual((await request(`${path}/submit`, "POST", {})).result, submitted.result);
    console.log("Exam HTTP integration passed: PUT exported, answers saved and restored through real HTTP, submission graded with explanations.");
  } finally {
    await db.rateLimit.deleteMany({ where: { key: { in: [`mutation:${user.id}`, `exam-mutation:${user.id}`] } } });
    await db.user.delete({ where: { id: user.id } });
  }
}
main().catch((error) => {
  // Do not print cookies, tokens, or server response bodies.
  console.error(error instanceof Error ? error.message : "Exam HTTP integration failed.");
  process.exitCode = 1;
}).finally(() => db.$disconnect());
