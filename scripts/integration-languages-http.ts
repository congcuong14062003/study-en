import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";
import { db } from "../src/lib/db";

async function main() {
  const local = ["localhost", "127.0.0.1", "[::1]"];
  const base = new URL(process.env.LANGUAGES_TEST_BASE_URL || "http://localhost:3000");
  assert.ok(local.includes(base.hostname) && base.protocol === "http:");
  assert.ok(local.includes(new URL(process.env.DATABASE_URL || "").hostname), "Only localhost DB allowed");
  const secret = process.env.NEXTAUTH_SECRET;
  assert.ok(secret);
  const users: string[] = [];
  try {
    const course = await db.course.findFirstOrThrow({ where: { language: "en", published: true, premium: false, lessons: { some: { published: true } } }, include: { lessons: { where: { published: true }, orderBy: { order: "asc" }, take: 1 } } });
    const englishLesson = course.lessons[0];
    const englishWord = await db.vocabulary.findFirstOrThrow({ where: { language: "en" } });
    const learner = await db.user.create({ data: {
      email: `language-test-${randomUUID()}@example.invalid`, name: "Temporary language test",
      profile: { create: { onboardingComplete: true, level: "B1" } }, progress: { create: {} }, subscription: { create: {} },
      enrollments: { create: { courseId: course.id } },
    } });
    users.push(learner.id);
    const jwt = await encode({ secret, maxAge: 600, token: { sub: learner.id, id: learner.id, role: "USER", sessionVersion: 0, deadline: Date.now() + 600000 } });
    const cookie = `next-auth.session-token=${jwt}`;
    async function request(path: string, method = "GET", body?: unknown, expected = 200, authenticated = true) {
      const response = await fetch(new URL(`/api/${path}`, base), { method, headers: { Origin: base.origin, ...(authenticated ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, expected, `${method} ${path} expected ${expected}, got ${response.status}`);
      return response.json();
    }
    await request("learning-language", "POST", { language: "zh" }, 401, false);
    await request("learning-language", "POST", { language: "fr" }, 400);
    assert.equal((await request("me")).profile.targetLanguage, "en");
    await request(`lessons/${englishLesson.id}/progress`, "POST", { step: 1 });
    await request("vocabulary/start", "POST", { vocabularyId: englishWord.id });
    const selection = await request("learning-language", "POST", { language: "zh" });
    assert.equal(selection.language, "zh");
    assert.ok(selection.resumeHref.startsWith("/lessons/zh-"));
    const me = await request("me");
    assert.equal(me.profile.targetLanguage, "zh");
    assert.equal(me.profile.language, "vi");
    assert.equal(me.profile.level, "B1");
    const dashboardPage = await fetch(new URL("/dashboard", base), { headers: { Cookie: cookie }, redirect: "manual" });
    assert.equal(dashboardPage.status, 200, "Chinese dashboard must not force an English placement test");
    for (const path of ["courses", "grammar", "listening", "reading", "speaking", "writing", "vocabulary"]) {
      const rows = await request(path);
      assert.ok(rows.length > 0, `${path} has starter content`);
      assert.ok(rows.every((row: { language: string }) => row.language === "zh"), `${path} must not mix languages`);
    }
    const glossary = await request("vocabulary?glossary=1");
    assert.ok(glossary.every((word: { pinyin: string }) => word.pinyin));
    const starter = await request("vocabulary/starter-pack", "POST", {});
    assert.ok(starter.added >= 24 && starter.added <= 30);
    const due = await request("vocabulary/reviews");
    assert.equal(due.length, starter.added);
    assert.ok(due.every((row: { vocabulary: { language: string } }) => row.vocabulary.language === "zh"));
    assert.ok(due.every((row: { vocabulary: { level: string } }) => row.vocabulary.level === "Nhập môn"), "Starter pack prioritizes beginner words, not alphabetical level names");
    const library = await request("vocabulary?paginated=1&pageSize=15");
    assert.ok(library.facets.totalWords >= 3024);
    const zhLesson = selection.resumeHref.split("/").pop();
    await request(`lessons/${zhLesson}/progress`, "POST", { step: 1 });
    await request(`lessons/${zhLesson}/progress`, "POST", { step: 3 }, 400);
    const lesson = await request(`lessons/${zhLesson}`);
    assert.equal(lesson.progress.step, 1);
    assert.ok(lesson.words.every((row: { language: string }) => row.language === "zh"));
    assert.ok(lesson.listening.pinyin && lesson.reading.pinyin);
    for (const question of lesson.quiz.questions) assert.equal(question.correctAnswer, undefined, "No answer key in active quiz");
    await request(`lessons/${zhLesson}/answer`, "POST", { questionId: "foreign-question", selected: 0 }, 404);
    const old = await request("learning-language", "POST", { language: "en" });
    assert.equal(old.resumeHref, `/lessons/${englishLesson.id}`);
    assert.equal((await request(`lessons/${englishLesson.id}`)).progress.step, 1);
    assert.ok((await request("vocabulary/reviews")).every((row: { vocabulary: { language: string } }) => row.vocabulary.language === "en"));
    const back = await request("learning-language", "POST", { language: "zh" });
    assert.equal(back.resumeHref, selection.resumeHref);
    assert.equal((await request(`lessons/${zhLesson}`)).progress.step, 1);
    const dashboard = await request("dashboard");
    assert.equal(dashboard.user.progress.wordsLearned, starter.added);
    assert.ok(dashboard.enrollments.every((row: { course: { language: string } }) => row.course.language === "zh"));
    assert.equal(dashboard.plan, null, "English learning plan is not a Chinese plan");
    for (let step = 2; step <= 5; step++) await request(`lessons/${zhLesson}/progress`, "POST", { step });
    const questions = await db.question.findMany({ where: { id: { in: lesson.quiz.questions.map((q: { id: string }) => q.id) } } });
    const answers = questions.map((q) => ({ questionId: q.id, selected: q.correctAnswer }));
    const result = await request("quiz/submit", "POST", { quizId: lesson.quiz.id, answers });
    assert.equal(result.percent, 100);
    assert.equal(result.level, "Nhập môn");
    assert.equal((await request("me")).profile.level, "B1", "Chinese quiz must not overwrite English CEFR");
    assert.equal((await request("dashboard")).user.progress.lessonsCompleted, 1);
    const next = await request("learning-language", "POST", { language: "zh" });
    assert.notEqual(next.resumeHref, selection.resumeHref, "Completed lesson advances to next node");
    const conversation = await db.aIConversation.create({ data: { userId: learner.id, language: "en", title: "Test", scenario: "Coffee Shop", difficulty: "Beginner", correction: "all" } });
    assert.ok(!(await request("ai")).some((c: { id: string }) => c.id === conversation.id));
    await request(`ai/${conversation.id}`, "GET", undefined, 404);
    await request("learning-language", "POST", { language: "en" });
    assert.ok((await request("ai")).some((c: { id: string }) => c.id === conversation.id));
    assert.equal((await request("dashboard")).user.progress.wordsLearned, 1);
    assert.equal((await request("dashboard")).user.progress.lessonsCompleted, 0);
    console.log("Language HTTP checks passed: scoped libraries/cards/AI, progress resume/completion, language switching, English CEFR preservation, validation and authentication.");
  } finally {
    for (const id of users) {
      await db.user.deleteMany({ where: { id } });
      await db.rateLimit.deleteMany({ where: { key: { in: [`mutation:${id}`, `ai:writing:${id}`, `ai:chat:${id}`] } } });
    }
    await db.$disconnect();
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Language integration failed"); process.exitCode = 1; });
