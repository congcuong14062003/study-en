import test from "node:test";
import assert from "node:assert/strict";
import { chinesePinyinReading } from "../src/lib/chinese-pinyin-reading";

test("word Pinyin preserves the saved pronunciation rather than guessing polyphonic characters", async () => {
  assert.equal(await chinesePinyinReading("行", " háng "), "háng");
  assert.equal(await chinesePinyinReading("你好", "nǐ hǎo"), "nǐ hǎo");
  assert.equal(await chinesePinyinReading("English 123"), "");
});

test("example Pinyin converts the whole sentence locally, preserving base tones and punctuation", async () => {
  assert.equal(await chinesePinyinReading("你好！"), "nǐ hǎo！");
  assert.equal(await chinesePinyinReading("我有一个苹果。"), "wǒ yǒu yī gè píng guǒ。");
  assert.equal(await chinesePinyinReading("银行在学校旁边。"), "yín háng zài xué xiào páng biān。");
  assert.equal(await chinesePinyinReading("我喜欢音乐。"), "wǒ xǐ huan yīn yuè。");
});
