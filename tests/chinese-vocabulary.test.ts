import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import data from "../prisma/data/chinese-vocabulary-3000.json";
import { chineseTopics } from "../prisma/chinese-content";
import { seedChineseVocabulary } from "../prisma/chinese-vocabulary";
import { speak } from "../src/components/learning/audio-player";
import { normalizeChineseReading } from "../src/lib/chinese-pinyin";

test("3,000 additional Chinese words have Vietnamese meanings, Pinyin and token-matched examples", () => {
  assert.equal(data.length, 3000);
  assert.equal(new Set(data.map((word) => word.word)).size, 3000);
  assert.equal(new Set(data.map((word) => word.id)).size, 3000);
  const starter = new Set(chineseTopics.flatMap((topic) => topic.words.map((word) => word[0])));
  for (const word of data) {
    assert.ok(!starter.has(word.word));
    assert.equal(word.language, "zh");
    assert.match(word.word, /^\p{Script=Han}+$/u);
    assert.ok(word.pinyin && word.meaning && word.definition);
    assert.equal(normalizeChineseReading(word.pinyin), normalizeChineseReading(word.source.dictionaryPinyin));
    assert.ok(word.example.includes(word.word));
    assert.ok(word.source.sentenceId && word.source.sentencePinyin);
    assert.equal(word.translation, "", "Do not pass off English text or a dictionary gloss as a Vietnamese sentence translation");
    assert.match(word.category, /^HSK [1-6] · 3\.0 \(2021\)$/);
  }
  const manifest = JSON.parse(readFileSync("public/data/chinese-vocabulary-attribution.json", "utf8"));
  assert.equal(manifest.count, 3000);
  assert.equal(manifest.license, "CC BY-SA 4.0");
  assert.equal(manifest.sha256, createHash("sha256").update(readFileSync("prisma/data/chinese-vocabulary-3000.json")).digest("hex"));
  assert.ok(manifest.sources.every((source: { revision: string; url: string }) => /^[a-f0-9]{40}$/.test(source.revision) && source.url.startsWith("https://github.com/")));
});

test("Pinyin joins do not mix polyphonic tones or confuse ü with u", () => {
  assert.equal(normalizeChineseReading("xué sheng"), normalizeChineseReading("xue2 sheng5"));
  assert.equal(normalizeChineseReading("nǚ"), normalizeChineseReading("nu:3"));
  assert.notEqual(normalizeChineseReading("hǎo"), normalizeChineseReading("hao4"));
  assert.notEqual(normalizeChineseReading("nǚ"), normalizeChineseReading("nu3"));
});

test("Chinese import is repeat-safe and never overwrites a saved/admin-edited word", async () => {
  const stored = new Map<string, Record<string, unknown>>([[data[0].word, { meaning: "Custom edited meaning" }]]);
  const fake = { vocabulary: { async createMany({ data: batch, skipDuplicates }: { data: Record<string, unknown>[]; skipDuplicates: boolean }) {
    assert.equal(skipDuplicates, true);
    assert.ok(batch.length <= 300);
    let count = 0;
    for (const row of batch) {
      assert.equal(row.source, undefined);
      if (!stored.has(String(row.word))) { stored.set(String(row.word), row); count++; }
    }
    return { count };
  } } } as unknown as PrismaClient;
  assert.deepEqual(await seedChineseVocabulary(fake), { available: 3000, added: 2999 });
  assert.deepEqual(await seedChineseVocabulary(fake), { available: 3000, added: 0 });
  assert.equal(stored.get(data[0].word)?.meaning, "Custom edited meaning");
});

test("example speech reads the whole sentence in English/Chinese and respects slow speed", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalUtterance = Object.getOwnPropertyDescriptor(globalThis, "SpeechSynthesisUtterance");
  const spoken: { text: string; lang: string; rate: number; voice: { lang: string } }[] = [];
  let cancellations = 0;
  try {
    Object.defineProperty(globalThis, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(public text: string) {} } });
    Object.defineProperty(globalThis, "window", { configurable: true, value: { speechSynthesis: {
      cancel() { cancellations++; }, speak(utterance: typeof spoken[number]) { spoken.push(utterance); },
      getVoices() { return [
        { lang: "en-US", name: "English Ava", voiceURI: "en", localService: true },
        { lang: "zh-CN", name: "Chinese Xiaoxiao", voiceURI: "zh", localService: true },
      ]; },
    } } });
    speak("I would like a cup of tea.");
    speak("我想喝一杯茶。", undefined, 0.75);
    assert.equal(spoken[0].text, "I would like a cup of tea.");
    assert.equal(spoken[0].lang, "en-US");
    assert.equal(spoken[0].voice.lang, "en-US");
    assert.equal(spoken[1].text, "我想喝一杯茶。");
    assert.equal(spoken[1].lang, "zh-CN");
    assert.equal(spoken[1].voice.lang, "zh-CN");
    assert.equal(spoken[1].rate, 0.75);
    assert.equal(cancellations, 2);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else Reflect.deleteProperty(globalThis, "window");
    if (originalUtterance) Object.defineProperty(globalThis, "SpeechSynthesisUtterance", originalUtterance); else Reflect.deleteProperty(globalThis, "SpeechSynthesisUtterance");
  }
});
