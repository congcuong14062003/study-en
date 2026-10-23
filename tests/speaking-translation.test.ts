import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SpeakingRecorder } from "../src/components/learning/speaking";
import { createSpeakingTranslationLoader } from "../src/lib/speaking-translation";

test("default English speaking translation is visible directly below IPA without AI", async () => {
  const text = "I usually wake up at seven o'clock.";
  const html = renderToStaticMarkup(createElement(SpeakingRecorder, { text, language: "en" }));
  assert.ok(html.indexOf("speaking-translation") > html.indexOf("speaking-phonetics"));
  assert.match(html, /Tôi thường thức dậy lúc bảy giờ/);
  let calls = 0;
  const result = await createSpeakingTranslationLoader()(text, async () => { calls++; return null; }, async () => { calls++; return ""; });
  assert.equal(result.source, "builtin"); assert.equal(calls, 0);
});

test("Chinese saved full-text translations are preferred and refreshed without AI", async () => {
  const load = createSpeakingTranslationLoader();
  let translation = "Mỗi ngày tôi thức dậy lúc bảy giờ.";
  const find = async () => translation;
  const generate = async () => { throw new Error("Must not generate for saved content"); };
  const first = await load("我每天七点起床。", find, generate);
  assert.equal(first.source, "saved"); assert.equal(first.translation, translation);
  translation = "Tôi thức dậy vào bảy giờ mỗi ngày.";
  assert.equal((await load("我每天七点起床。", find, generate)).translation, translation);
});

test("new translations are deduplicated and cached, while failed translations can be retried", async () => {
  const load = createSpeakingTranslationLoader();
  let calls = 0;
  const generate = async () => { calls++; return "Tôi muốn uống trà. Mẹ muốn ăn cơm."; };
  const values = await Promise.all([load("我想喝茶。妈妈想吃米饭。", async () => null, generate), load("我想喝茶。妈妈想吃米饭。", async () => null, generate)]);
  assert.equal(calls, 1); assert.equal(values[0].source, "ai");
  await load("我想喝茶。妈妈想吃米饭。", async () => null, generate);
  assert.equal(calls, 1);
  await assert.rejects(load("你好！", async () => null, async () => "你好！"));
  await assert.rejects(load("你好！", async () => null, async () => { throw new Error("network"); }));
  assert.equal((await load("你好！", async () => null, async () => "Xin chào!")).translation, "Xin chào!");
});
