import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scheduleReview } from "../src/services/spaced-repetition";
import {
  cefrForScore,
  studyDate,
  effectiveStreak,
} from "../src/services/learning";
import { registerSchema } from "../src/lib/validation";
import * as content from "../prisma/content";
import {
  extraCourses,
  extraLessons,
  extraVocabulary,
} from "../prisma/expanded-content";
import { moreVocabulary } from "../prisma/vocabulary-expansion";
import { coreLexicon } from "../prisma/core-lexicon";
import { expandedGrammar } from "../prisma/grammar-expansion";
import { topicVocabulary } from "../prisma/topic-vocabulary";
import {
  immersiveListening,
  immersiveReading,
} from "../prisma/immersive-content";
import { buildLearningPathLessons } from "../prisma/path-content";
import {
  c2Courses,
  c2Grammar,
  c2Lessons,
  c2Listening,
  c2Questions,
  c2Reading,
  c2Vocabulary,
} from "../prisma/c2-content";
import { uncoveredSeconds } from "../src/services/study-time";
import {
  extractAIText,
  recommendationSchema,
  tutorReplySchema,
  writingSchema,
} from "../src/services/ai";
import { paginationMeta, readPagination } from "../src/lib/pagination";
import { cmsSchemas } from "../src/services/admin";
describe("Spaced repetition", () => {
  const now = new Date("2026-09-07T10:00:00Z");
  it("relearning an old card resets repetitions and schedules ten minutes", () => {
    const result = scheduleReview(
      { repetitions: 8, interval: 200, ease: 2.5 },
      "again",
      now,
    );
    assert.equal(result.repetitions, 0);
    assert.equal(result.interval, 0);
    assert.equal(result.dueAt.getTime() - now.getTime(), 600000);
  });
  it("easy interval is longer than hard and ease never falls below 1.3", () => {
    const initial = { repetitions: 3, interval: 10, ease: 2.5 };
    assert(
      scheduleReview(initial, "easy", now).interval >
        scheduleReview(initial, "hard", now).interval,
    );
    let state = initial;
    for (let i = 0; i < 100; i++) state = scheduleReview(state, "again", now);
    assert.equal(state.ease, 1.3);
  });
});
describe("Learning boundaries", () => {
  it("credits overlapping recording and lesson timers only once", () => {
    assert.equal(
      uncoveredSeconds(0, 120000, [
        { start: 30000, end: 60000 },
        { start: 50000, end: 90000 },
      ]),
      60,
    );
    assert.equal(uncoveredSeconds(0, 60000, [{ start: 0, end: 90000 }]), 0);
  });
  it("uses Vietnam calendar day across UTC midnight", () =>
    assert.equal(studyDate(new Date("2026-09-07T18:00:00Z")), "2026-09-08"));
  it("expires a missed streak but preserves yesterday", () => {
    assert.equal(
      effectiveStreak(12, "2026-09-05", new Date("2026-09-07T12:00:00Z")),
      0,
    );
    assert.equal(
      effectiveStreak(12, "2026-09-06", new Date("2026-09-07T12:00:00Z")),
      12,
    );
  });
  it("estimates CEFR consistently at all threshold boundaries", () => {
    assert.deepEqual([0, 28, 48, 67, 82, 95, 100].map(cefrForScore), [
      "A1",
      "A2",
      "B1",
      "B2",
      "C1",
      "C2",
      "C2",
    ]);
  });
  it("rejects mismatched passwords and bcrypt UTF-8 overflow", () => {
    assert.equal(
      registerSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        password: "Strongpass123",
        confirmPassword: "wrong",
      }).success,
      false,
    );
    const password = "á".repeat(40) + "1a";
    assert.equal(
      registerSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        password,
        confirmPassword: password,
      }).success,
      false,
    );
  });
});
describe("Pagination boundaries", () => {
  it("normalizes invalid pages and caps the requested page size", () => {
    assert.deepEqual(
      readPagination(new URLSearchParams("page=-2&pageSize=999"), 30, 100),
      { page: 1, pageSize: 100, skip: 0 },
    );
  });
  it("reports the visible result range on the final page", () => {
    assert.deepEqual(paginationMeta(45, 3, 20), {
      page: 3,
      pageSize: 20,
      total: 45,
      totalPages: 3,
      from: 41,
      to: 45,
    });
    assert.deepEqual(paginationMeta(45, 4, 20), {
      page: 4,
      pageSize: 20,
      total: 45,
      totalPages: 3,
      from: 0,
      to: 0,
    });
  });
});
describe("Admin content validation", () => {
  it("allows vocabulary to omit IPA and rejects a blank English definition", () => {
    const vocabulary = {
      word: "adaptable",
      meaning: "có khả năng thích nghi",
      definition: "Able to adjust to new conditions.",
      partOfSpeech: "adjective",
      example: "An adaptable learner progresses quickly.",
      translation: "Một người học linh hoạt tiến bộ nhanh.",
      category: "Personal qualities",
      level: "B2" as const,
      synonyms: [],
      antonyms: [],
      collocations: [],
      wordFamily: [],
    };
    assert.equal(cmsSchemas.vocabulary.parse(vocabulary).ipa, "");
    assert.equal(
      cmsSchemas.vocabulary.parse({ ...vocabulary, ipa: "" }).ipa,
      "",
    );

    const missingDefinition = cmsSchemas.vocabulary.safeParse({
      ...vocabulary,
      definition: "   ",
    });
    assert.equal(missingDefinition.success, false);
    if (!missingDefinition.success) {
      assert.equal(
        missingDefinition.error.issues[0]?.message,
        "Vui lòng nhập định nghĩa tiếng Anh.",
      );
    }
  });
});
describe("Seed curriculum integrity", () => {
  it("has requested minimum sizes and all lesson references resolve", () => {
    const courses = [...content.courses, ...extraCourses, ...c2Courses];
    const vocabulary = [
      ...content.vocabulary,
      ...extraVocabulary,
      ...moreVocabulary,
      ...coreLexicon,
      ...topicVocabulary,
      ...c2Vocabulary,
    ];
    const grammar = [...content.grammar, ...expandedGrammar, ...c2Grammar];
    const listening = [
      ...content.listening,
      ...immersiveListening,
      ...c2Listening,
    ];
    const reading = [...content.reading, ...immersiveReading, ...c2Reading];
    const questions = [...content.questions, ...c2Questions];
    const baseLessons = [...content.lessons, ...extraLessons, ...c2Lessons];
    const lessons = [
      ...baseLessons,
      ...buildLearningPathLessons(courses, baseLessons),
    ];
    assert.equal(courses.length, 16);
    assert.equal(lessons.length, 96);
    assert.equal(vocabulary.length, 1000);
    assert.equal(grammar.length, 72);
    assert.equal(listening.length, 21);
    assert.equal(reading.length, 21);
    assert.equal(c2Vocabulary.length, 300);
    assert.equal(courses.filter((course) => course.level === "C2").length, 3);
    assert(content.questions.length >= 50);
    assert(content.listening.length >= 5);
    assert(content.reading.length >= 5);
    assert.equal(
      new Set(vocabulary.map((word) => word.word.toLowerCase())).size,
      vocabulary.length,
    );
    assert.equal(
      new Set(listening.map((item) => item.id)).size,
      listening.length,
    );
    assert.equal(new Set(reading.map((item) => item.id)).size, reading.length);
    assert.equal(
      new Set(grammar.map((topic) => topic.id)).size,
      grammar.length,
    );
    assert.equal(
      new Set(grammar.map((topic) => topic.title.toLowerCase())).size,
      grammar.length,
    );
    for (const topic of grammar) {
      assert(topic.structure.length > 0);
      assert(topic.examples.length > 0);
    }
    for (const item of [...listening, ...reading]) {
      assert(item.title.trim());
      assert(item.translation.trim().length > 100);
    }
    for (const lesson of lessons) {
      assert(courses.some((c) => c.id === lesson.courseId));
      for (const id of lesson.questionIds)
        assert(questions.some((q) => q.id === id));
      for (const id of lesson.vocabularyIds)
        assert(vocabulary.some((q) => q.id === id));
    }
    for (const course of courses)
      assert.equal(
        lessons.filter((lesson) => lesson.courseId === course.id).length,
        6,
      );
  });
  it("every quiz answer indexes a unique nonempty option", () => {
    for (const q of content.questions) {
      assert(q.correctAnswer >= 0 && q.correctAnswer < q.options.length);
      assert(q.options[q.correctAnswer].trim());
      assert.equal(new Set(q.options).size, q.options.length);
      assert(q.explanation.trim());
    }
  });
});
describe("AI response contracts", () => {
  it("extracts completed Responses API text and rejects refusals", () => {
    assert.equal(
      extractAIText({
        status: "completed",
        output: [{ content: [{ type: "output_text", text: '{"ok":true}' }] }],
      }),
      '{"ok":true}',
    );
    assert.throws(
      () =>
        extractAIText({
          status: "completed",
          output: [{ content: [{ type: "refusal", refusal: "No" }] }],
        }),
      /không thể xử lý/,
    );
  });
  it("validates structured tutor, writing, and recommendation payloads", () => {
    assert(
      tutorReplySchema.safeParse({
        reply: "Welcome!",
        correction: null,
        vocabulary: [],
        followUp: "What would you like?",
      }).success,
    );
    assert(
      writingSchema.safeParse({
        score: 80,
        grammarScore: 80,
        vocabularyScore: 80,
        coherenceScore: 80,
        taskResponseScore: 80,
        naturalnessScore: 80,
        mistakes: [],
        suggestions: ["Use one more example."],
        improvedVersion: "A clearer paragraph.",
      }).success,
    );
    assert(
      recommendationSchema.safeParse({
        summary: "Tập trung luyện nghe.",
        focusSkill: "listening",
        reason: "Điểm nghe thấp nhất.",
        weeklyGoal: "Ba buổi trong tuần.",
        actions: [
          {
            skill: "listening",
            title: "Nghe chủ động",
            reason: "Củng cố ý chính.",
            minutes: 15,
          },
          {
            skill: "vocabulary",
            title: "Ôn cụm từ",
            reason: "Mở rộng vốn từ.",
            minutes: 10,
          },
          {
            skill: "speaking",
            title: "Nhắc lại",
            reason: "Tăng phản xạ.",
            minutes: 10,
          },
        ],
      }).success,
    );
  });
});
