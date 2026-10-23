import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { speakingCategories, speakingMetadata, speakingSamples, seedSpeakingSamples, speakingLibraryOrder } from "../prisma/speaking-samples";
import { SpeakingRecorder } from "../src/components/learning/speaking";
import { VoiceMessageInput } from "../src/components/learning/voice-message-input";

test("speaking library adds 60 English and 160 Chinese bilingual samples in ten topics", () => {
  assert.equal(speakingCategories.length, 10);
  assert.equal(speakingSamples.filter((item) => item.language === "en").length, 60);
  assert.equal(speakingSamples.filter((item) => item.language === "zh").length, 160);
  assert.equal(new Set(speakingSamples.map((item) => item.id)).size, 220);
  for (const language of ["en", "zh"]) assert.equal(new Set(speakingSamples.filter((item) => item.language === language).map((item) => item.category)).size, 10);
  for (const sample of speakingSamples) {
    assert.ok(sample.text && sample.translation && sample.category);
    assert.ok(sample.text !== sample.translation);
    assert.ok(sample.text.length <= 500);
    if (sample.language === "zh") assert.ok(sample.pinyin && /[a-z]/i.test(sample.pinyin));
  }
});
test("metadata never attaches stale translations to edited samples", () => {
  const sample = speakingSamples[0];
  assert.equal(speakingMetadata(sample).translation, sample.translation);
  assert.equal(speakingMetadata({ ...sample, text: "Updated sentence." }).translation, undefined);
  assert.equal(speakingMetadata({ id: "custom", text: "Hello." }).category, "Chủ đề khác");
  assert.equal(speakingMetadata({ id: "zh-greetings-speaking", text: "你好！" }).category, "Bạn bè và giao tiếp");
  assert.ok(speakingLibraryOrder(sample, { id: "chinese-daily-life-morning-speaking" }) < 0, "Short samples come before legacy paragraphs");
});
test("speaking seed is repeatable and only upserts speaking exercises", async () => {
  const rows = new Map<string, unknown>(); let calls = 0;
  const db = { speakingExercise: { async upsert({ where, create, update }: { where: { id: string }; create: unknown; update: unknown }) { calls++; rows.set(where.id, rows.has(where.id) ? update : create); } } };
  await seedSpeakingSamples(db as never); await seedSpeakingSamples(db as never);
  assert.equal(calls, 440); assert.equal(rows.size, 220);
  assert.equal("translation" in (rows.values().next().value as object), false);
});
test("saved sentence translation renders without AI, and voice capture never starts during render", () => {
  const sample = speakingSamples.find((item) => item.language === "zh")!;
  const html = renderToStaticMarkup(createElement(SpeakingRecorder, sample));
  assert.ok(html.includes(sample.translation));
  assert.ok(html.includes("Luyện phát âm câu này"));
  const voice = renderToStaticMarkup(createElement(VoiceMessageInput, { locale: "zh-CN", disabled: false, onUse() {} }));
  assert.match(voice, /Nói bằng micro/);
  assert.match(voice, /không chấm âm thanh/);
  assert.doesNotMatch(voice, /Điểm phát âm:/);
});
