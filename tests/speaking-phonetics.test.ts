import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { builtinEnglishPhonetics, createEnglishPhoneticsLoader, englishIpaSchema, phoneticsInputSchema } from "../src/lib/speaking-phonetics";
import { SpeakingRecorder } from "../src/components/learning/speaking";
import { SpeakingPhonetics } from "../src/components/learning/speaking-phonetics";
import { chinesePinyinReading } from "../src/lib/chinese-pinyin-reading";

test("five original speaking exercises have American IPA without requiring AI", async () => {
  const load = createEnglishPhoneticsLoader();
  let calls = 0;
  for (const text of ["I usually wake up at seven o'clock.", "Could I have a cup of coffee, please?", "I'd like to book a room for two nights.", "We should discuss the deadline at our next meeting.", "Learning a language opens the door to new possibilities."]) {
    const value = await load(text, async () => { calls++; throw new Error("Must not call AI"); });
    assert.equal(value.source, "builtin");
    assert.equal(value.locale, "en-US");
    assert.ok(englishIpaSchema.safeParse(value).success);
  }
  assert.equal(calls, 0);
  assert.deepEqual(builtinEnglishPhonetics("  I’D  like to book a room for two nights. "), builtinEnglishPhonetics("I'd like to book a room for two nights."));
});

test("new English sentence requests are deduplicated, cached and bounded", async () => {
  let clock = 0, calls = 0;
  const load = createEnglishPhoneticsLoader(() => clock, 2);
  const generate = async () => { calls++; return { ipa: "/həˈloʊ/" }; };
  const [first, second] = await Promise.all([load("Hello.", generate), load("hello.", generate)]);
  assert.deepEqual(first, second);
  assert.equal(first.source, "ai");
  assert.equal(calls, 1);
  await load("Hello.", generate);
  assert.equal(calls, 1);
  clock += 8 * 86400000;
  await load("Hello.", generate);
  assert.equal(calls, 2, "Expired results regenerate");
  await load("Hi.", generate); await load("Goodbye.", generate);
  await load("Hello.", generate);
  assert.equal(calls, 5, "Oldest result is evicted at the cache bound");
});

test("invalid sources and failed/invalid AI output do not become cached readings", async () => {
  for (const text of ["", "你好", "a".repeat(1001)]) assert.equal(phoneticsInputSchema.safeParse({ text }).success, false);
  for (const ipa of ["", "This is an explanation", "/<script>/", "/你好/", "/hello/ /world/"]) assert.equal(englishIpaSchema.safeParse({ ipa }).success, false);
  const load = createEnglishPhoneticsLoader();
  await assert.rejects(load("Hello.", async () => { throw new Error("Network unavailable"); }), /Network/);
  await assert.rejects(load("Hello.", async () => ({ ipa: "Not IPA" })));
  assert.equal((await load("Hello.", async () => ({ ipa: "/həˈloʊ/" }))).ipa, "/həˈloʊ/");
});

test("speaking card places visible Pinyin/IPA directly after the target sentence in either language", async () => {
  const chinese = renderToStaticMarkup(createElement(SpeakingRecorder, { text: "我想喝茶。", language: "zh", pinyin: "Wǒ xiǎng hē chá." }));
  assert.ok(chinese.indexOf("speaking-sentence") < chinese.indexOf("speaking-phonetics"));
  assert.match(chinese, /Pinyin · Bính âm/);
  assert.match(chinese, /Wǒ xiǎng hē chá\./);
  assert.match(chinese, /lang="zh-Latn"/);
  const english = renderToStaticMarkup(createElement(SpeakingRecorder, { text: "I usually wake up at seven o'clock.", language: "en" }));
  assert.match(english, /IPA · Tiếng Anh giọng Mỹ/);
  assert.match(english, /lang="en-fonipa"/);
  assert.match(english, /ˈsɛvən/);
  const fallback = renderToStaticMarkup(createElement(SpeakingPhonetics, { text: "我每天学习中文。", language: "zh" }));
  assert.match(fallback, /Đang tải Pinyin/);
  assert.ok(await chinesePinyinReading("我每天学习中文。"));
});
