import test from "node:test";
import assert from "node:assert/strict";
import type { PrismaClient } from "@prisma/client";
import { chineseCourses } from "../prisma/chinese-courses";
import { buildChineseCourseLesson, seedChineseCourses } from "../prisma/chinese-course-seed";
import { tokenizeSentence } from "../src/lib/sentence-order";

test("ten Chinese courses contain forty distinct, complete bilingual lessons with usable examples", async () => {
  assert.equal(chineseCourses.length, 10);
  assert.equal(new Set(chineseCourses.map((course) => course.id)).size, 10);
  assert.equal(chineseCourses.flatMap((course) => course.topics).length, 40);
  const ids = new Set<string>();
  const readings = new Set<string>();
  const answers = new Set<number>();
  for (const course of chineseCourses) {
    assert.equal(course.topics.length, 4);
    assert.ok(course.outcomes.length >= 3);
    for (const [index, topic] of course.topics.entries()) {
      const content = await buildChineseCourseLesson(course, topic, index + 1);
      assert.ok(!ids.has(content.lesson.id)); ids.add(content.lesson.id);
      assert.equal(content.lesson.order, index + 1);
      assert.equal(content.lesson.courseId, course.id);
      assert.ok(!readings.has(content.reading.body)); readings.add(content.reading.body);
      assert.equal(topic.lines.length, 4);
      assert.ok(topic.lines.every(([zh, vi]) => /\p{Script=Han}/u.test(zh) && /[a-zA-ZÀ-ỹ]/u.test(vi) && !/\p{Script=Han}/u.test(vi)));
      assert.ok(content.reading.pinyin && content.listening.pinyin && content.speaking.pinyin);
      assert.ok(!/\p{Script=Han}/u.test(content.reading.pinyin));
      assert.equal(content.reading.translation, topic.lines.map(([, vi]) => vi).join(" "));
      assert.equal(content.vocabulary.length, 4);
      assert.equal(new Set(content.vocabulary.map((word) => word.word)).size, 4);
      for (const word of content.vocabulary) {
        assert.equal(word.language, "zh");
        assert.ok(word.example.includes(word.word), `${topic.id}: example must contain ${word.word}`);
        assert.ok(word.pinyin && word.meaning && word.translation);
      }
      assert.equal(content.grammar.examples[0], topic.lines[topic.practiceLine ?? 0][0]);
      assert.ok(tokenizeSentence(content.grammar.examples[0]).length > 2, "Sentence builder needs a meaningful sentence");
      assert.deepEqual(content.lesson.questionIds, content.questions.map((question) => question.id));
      assert.deepEqual(content.quiz.questionIds, content.lesson.questionIds);
      for (const question of content.questions) {
        assert.equal(question.language, "zh");
        assert.equal(question.options.length, 3);
        assert.equal(new Set(question.options).size, 3);
        assert.ok(question.correctAnswer >= 0 && question.correctAnswer < 3);
        assert.ok(question.explanation.trim()); answers.add(question.correctAnswer);
        if (question.skill === "grammar") assert.equal(question.options[question.correctAnswer], topic.grammarQuestion[1]);
        if (question.skill === "reading") {
          assert.equal(question.options[question.correctAnswer], topic.readingQuestion[1]);
          assert.equal(question.passage, content.reading.body);
        }
        if (question.skill === "listening") {
          assert.equal(question.options[question.correctAnswer], topic.lines[0][1]);
          assert.equal(question.audioText, content.listening.transcript);
        }
      }
    }
  }
  assert.deepEqual([...answers].sort(), [0, 1, 2]);
});

test("course seeding reuses vocabulary IDs, preserves edits, is repeat-safe and never writes learner data", async () => {
  const models = ["course", "vocabulary", "grammarLesson", "listeningLesson", "readingArticle", "question", "lesson", "quiz", "speakingExercise", "writingExercise"];
  const tables = Object.fromEntries(models.map((model) => [model, new Map<string, Record<string, unknown>>() ]));
  tables.vocabulary.set("imported-existing-word", { id: "imported-existing-word", language: "zh", word: "起床", meaning: "Nghĩa do quản trị viên hiệu đính", example: "我每天起床。" });
  const tx = Object.fromEntries(models.map((model) => [model, { async upsert({ where, create, update }: {
    where: { id?: string; word?: string }; create: Record<string, unknown>; update: Record<string, unknown>;
  }) {
    const saved = where.word ? [...tables[model].values()].find((row) => row.word === where.word) : tables[model].get(where.id!);
    const value = saved ? { ...saved, ...update } : { ...create };
    tables[model].set(String(value.id), value);
    return value;
  } }]));
  const fake = { async $transaction(callback: (client: unknown) => Promise<unknown>) { return callback(tx); } } as unknown as PrismaClient;
  const first = await seedChineseCourses(fake);
  assert.equal(tables.course.size, 10);
  assert.equal(tables.lesson.size, 40);
  assert.equal(tables.question.size, 160);
  assert.equal(tables.quiz.size, 40);
  assert.equal(tables.speakingExercise.size, 40);
  assert.equal(tables.writingExercise.size, 40);
  assert.ok([...tables.course.values()].every((row) => row.language === "zh" && row.published === true && row.premium === false));
  assert.equal(tables.vocabulary.get("imported-existing-word")?.meaning, "Nghĩa do quản trị viên hiệu đính");
  assert.ok((tables.lesson.get("chinese-daily-life-morning-lesson")?.vocabularyIds as string[]).includes("imported-existing-word"));
  for (const lesson of tables.lesson.values()) {
    for (const id of lesson.vocabularyIds as string[]) assert.ok(tables.vocabulary.has(id));
    for (const id of lesson.questionIds as string[]) assert.ok(tables.question.has(id));
    assert.ok(tables.grammarLesson.has(String(lesson.grammarId)));
    assert.ok(tables.listeningLesson.has(String(lesson.listeningId)));
    assert.ok(tables.readingArticle.has(String(lesson.readingId)));
  }
  const snapshot = JSON.stringify(models.map((model) => [...tables[model].entries()]));
  assert.deepEqual(await seedChineseCourses(fake), first);
  assert.equal(JSON.stringify(models.map((model) => [...tables[model].entries()])), snapshot);
  for (const skill of ["vocabulary", "grammar", "reading", "listening"]) assert.equal(first[skill].length, 40);
});
