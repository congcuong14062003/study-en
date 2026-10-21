import test from "node:test";
import assert from "node:assert/strict";
import { learningLanguage, learningLanguageSchema, languageTextUnits, speechLanguage, segmentLearningText } from "../src/lib/languages";
import { tokenizeSentence, insertSentenceToken } from "../src/lib/sentence-order";
import { splitReadingWords, isReadingWord, lookupReadingWord, buildGlossary } from "../src/lib/reading-glossary";
import { compareTranscript } from "../src/services/speech";
import { chineseTopics } from "../prisma/chinese-content";

test("supported learning languages preserve English defaults", () => {
  assert.equal(learningLanguage(null), "en");
  assert.equal(learningLanguage("zh"), "zh");
  assert.ok(!learningLanguageSchema.safeParse("fr").success);
});
test("Chinese word segmentation preserves every character and supports middle insertion", () => {
  const text = "我想喝茶。";
  assert.equal(segmentLearningText(text).join(""), text);
  const bank = tokenizeSentence(text);
  assert.equal(bank.map((x) => x.value).join(""), text);
  assert.ok(bank.length > 2);
  const first = insertSentenceToken(bank, [], bank[1].id, 0);
  const second = insertSentenceToken(first.bank, first.answer, bank[0].id, 0);
  assert.deepEqual(second.answer.map((x) => x.id), [bank[0].id, bank[1].id]);
  assert.deepEqual(tokenizeSentence("I like tea.").map((x) => x.value), ["I", "like", "tea", "."]);
});
test("speech locale and text length handle Han without spaces", () => {
  assert.equal(speechLanguage("你好！"), "zh-CN");
  assert.equal(speechLanguage("Hello!"), "en-US");
  assert.equal(languageTextUnits("你好，我是学生。"), 6);
  assert.equal(languageTextUnits("I am a student."), 4);
  assert.equal(compareTranscript("我想喝茶。", "我想喝茶").recognizedAccuracy, 100);
  assert.ok(compareTranscript("我想喝茶。", "我想喝水").recognizedAccuracy < 100);
  assert.equal(compareTranscript("我想喝茶。", "hello").recognizedAccuracy, 0);
});
test("Chinese hover dictionary segments Han and preserves Pinyin", () => {
  assert.equal(splitReadingWords("你好！谢谢你。").join(""), "你好！谢谢你。");
  assert.ok(isReadingWord("谢谢"));
  assert.ok(!isReadingWord("。"));
  const entry = { id: "zh-test", word: "谢谢", pinyin: "xièxie", meaning: "cảm ơn" };
  assert.deepEqual(lookupReadingWord("谢谢", buildGlossary([entry])), entry);
});
test("starter corpus has six independent topics, 24 unique Han words and translations", () => {
  assert.equal(chineseTopics.length, 6);
  assert.equal(new Set(chineseTopics.map((x) => x.id)).size, 6);
  const words = chineseTopics.flatMap((topic) => topic.words);
  assert.equal(words.length, 24);
  assert.equal(new Set(words.map((x) => x[0])).size, 24);
  for (const topic of chineseTopics) {
    assert.ok(topic.pinyin && topic.translation && topic.question);
    assert.equal(new Set(topic.options).size, topic.options.length);
    for (const [word, pinyin, meaning, example, translation] of topic.words) {
      assert.match(word, /\p{Script=Han}/u);
      assert.ok(pinyin && meaning && translation);
      assert.match(example, /\p{Script=Han}/u);
    }
  }
});
