import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scheduleReview } from "../src/services/spaced-repetition";
import { cefrForScore, studyDate, effectiveStreak } from "../src/services/learning";
import { registerSchema } from "../src/lib/validation";
import * as content from "../prisma/content";
import { uncoveredSeconds } from "../src/services/study-time";
describe("Spaced repetition", () => {
    const now = new Date("2026-09-07T10:00:00Z");
    it("relearning an old card resets repetitions and schedules ten minutes", () => {
        const result = scheduleReview({ repetitions: 8, interval: 200, ease: 2.5 }, "again", now);
        assert.equal(result.repetitions, 0);
        assert.equal(result.interval, 0);
        assert.equal(result.dueAt.getTime() - now.getTime(), 600000);
    });
    it("easy interval is longer than hard and ease never falls below 1.3", () => {
        const initial = { repetitions: 3, interval: 10, ease: 2.5 };
        assert(scheduleReview(initial, "easy", now).interval > scheduleReview(initial, "hard", now).interval);
        let state = initial;
        for (let i = 0; i < 100; i++)
            state = scheduleReview(state, "again", now);
        assert.equal(state.ease, 1.3);
    });
});
describe("Learning boundaries", () => {
    it("credits overlapping recording and lesson timers only once", () => {
        assert.equal(uncoveredSeconds(0, 120000, [{ start: 30000, end: 60000 }, { start: 50000, end: 90000 }]), 60);
        assert.equal(uncoveredSeconds(0, 60000, [{ start: 0, end: 90000 }]), 0);
    });
    it("uses Vietnam calendar day across UTC midnight", () => assert.equal(studyDate(new Date("2026-09-07T18:00:00Z")), "2026-09-08"));
    it("expires a missed streak but preserves yesterday", () => {
        assert.equal(effectiveStreak(12, "2026-09-05", new Date("2026-09-07T12:00:00Z")), 0);
        assert.equal(effectiveStreak(12, "2026-09-06", new Date("2026-09-07T12:00:00Z")), 12);
    });
    it("estimates CEFR consistently at all threshold boundaries", () => {
        assert.deepEqual([0, 28, 48, 67, 82, 95, 100].map(cefrForScore), ["A1", "A2", "B1", "B2", "C1", "C2", "C2"]);
    });
    it("rejects mismatched passwords and bcrypt UTF-8 overflow", () => {
        assert.equal(registerSchema.safeParse({ name: "Test", email: "test@example.com", password: "Strongpass123", confirmPassword: "wrong" }).success, false);
        const password = "á".repeat(40) + "1a";
        assert.equal(registerSchema.safeParse({ name: "Test", email: "test@example.com", password, confirmPassword: password }).success, false);
    });
});
describe("Seed curriculum integrity", () => {
    it("has requested minimum sizes and all lesson references resolve", () => {
        assert(content.courses.length >= 3);
        assert(content.vocabulary.length >= 30);
        assert(content.grammar.length >= 10);
        assert(content.questions.length >= 50);
        assert(content.listening.length >= 5);
        assert(content.reading.length >= 5);
        for (const lesson of content.lessons) {
            assert(content.courses.some(c => c.id === lesson.courseId));
            for (const id of lesson.questionIds)
                assert(content.questions.some(q => q.id === id));
            for (const id of lesson.vocabularyIds)
                assert(content.vocabulary.some(q => q.id === id));
        }
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
