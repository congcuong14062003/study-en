import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";
import { db } from "../src/lib/db";
import { chineseCourses } from "../prisma/chinese-courses";

async function main() {
  const local = ["localhost", "127.0.0.1", "[::1]"];
  const base = new URL(process.env.LANGUAGES_TEST_BASE_URL || "http://localhost:3000");
  assert.ok(local.includes(base.hostname) && base.protocol === "http:", "Local HTTP test server required");
  assert.ok(local.includes(new URL(process.env.DATABASE_URL || "").hostname), "Only localhost DB allowed");
  assert.ok(process.env.NEXTAUTH_SECRET);
  let userId: string | undefined;
  try {
    const user = await db.user.create({ data: { email: `chinese-courses-test-${randomUUID()}@example.invalid`, name: "Temporary Chinese courses test",
      profile: { create: { onboardingComplete: true, placementComplete: true, targetLanguage: "zh", level: "B1" } }, progress: { create: {} }, subscription: { create: {} } } });
    userId = user.id;
    const token = await encode({ secret: process.env.NEXTAUTH_SECRET, maxAge: 600, token: { sub: user.id, id: user.id, role: "USER", sessionVersion: 0, deadline: Date.now() + 600000 } });
    const headers = { Cookie: `next-auth.session-token=${token}`, Origin: base.origin, "Content-Type": "application/json" };
    async function request(path: string, method = "GET", body?: unknown, expected = 200) {
      const response = await fetch(new URL(`/api/${path}`, base), { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, expected, `${method} ${path}: expected ${expected}, got ${response.status}`);
      return response.json();
    }
    const catalog = await request("courses");
    assert.ok(catalog.length >= 11);
    assert.ok(catalog.every((row: { language: string }) => row.language === "zh"));
    let firstLessonId = "";
    for (const course of chineseCourses) {
      const entry = catalog.find((row: { id: string }) => row.id === course.id);
      assert.ok(entry && !entry.premium);
      assert.equal(entry.lessons.length, 4);
      const id = `${course.id}-${course.topics[0].id}-lesson`;
      await request(`lessons/${id}`, "GET", undefined, 403);
      await request(`courses/${course.id}/enroll`, "POST", {});
      const lesson = await request(`lessons/${id}`);
      assert.equal(lesson.lesson.course.id, course.id);
      assert.equal(lesson.words.length, 4);
      assert.ok(lesson.words.every((word: { language: string; pinyin: string }) => word.language === "zh" && word.pinyin));
      assert.ok(lesson.grammar.examples.length >= 4 && lesson.listening.pinyin && lesson.reading.translation);
      assert.equal(lesson.quiz.questions.length, 4);
      assert.ok(lesson.quiz.questions.every((question: { correctAnswer?: number; explanation?: string }) => question.correctAnswer === undefined && question.explanation === undefined));
      if (!firstLessonId) firstLessonId = id;
    }
    await request(`courses/${chineseCourses[0].id}/enroll`, "POST", {});
    assert.equal(await db.courseEnrollment.count({ where: { userId } }), 10, "Re-enrollment must not duplicate records");
    await request(`lessons/${firstLessonId}/progress`, "POST", { step: 1 });
    await request(`lessons/${firstLessonId}/progress`, "POST", { step: 2 });
    assert.equal((await request("learning-language", "POST", { language: "zh" })).resumeHref, `/lessons/${firstLessonId}`);
    assert.equal((await request(`lessons/${firstLessonId}`)).progress.step, 2);
    for (const step of [3, 4, 5]) await request(`lessons/${firstLessonId}/progress`, "POST", { step });
    const lesson = await request(`lessons/${firstLessonId}`);
    const answerKeys = await db.question.findMany({ where: { id: { in: lesson.lesson.questionIds } } });
    const result = await request("quiz/submit", "POST", { quizId: lesson.quiz.id, answers: answerKeys.map((question) => ({ questionId: question.id, selected: question.correctAnswer })) });
    assert.equal(result.percent, 100);
    assert.equal((await request(`lessons/${firstLessonId}`)).progress.completed, true);
    const me = await request("me");
    assert.equal(me.profile.level, "B1", "Chinese lessons must not overwrite English CEFR");
    assert.equal(me.subscription.plan, "FREE");
    const dashboard = await request("dashboard");
    assert.equal(dashboard.user.progress.lessonsCompleted, 1);
    assert.equal(await db.lessonProgress.count({ where: { userId } }), 1);
    for (const path of ["/courses", `/courses/${chineseCourses[0].id}`, `/lessons/${firstLessonId}`]) {
      const page = await fetch(new URL(path, base), { headers, redirect: "manual" });
      assert.equal(page.status, 200, `Page ${path} must render`);
      await page.arrayBuffer();
    }
    console.log("Chinese course HTTP checks passed: 10 Free courses / 40 lessons, access control, content references, answer-key protection, enrollment, resume, grading and English CEFR preservation.");
  } finally {
    if (userId) {
      await db.user.deleteMany({ where: { id: userId } });
      await db.rateLimit.deleteMany({ where: { key: `mutation:${userId}` } });
    }
    await db.$disconnect();
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Chinese course integration failed"); process.exitCode = 1; });
