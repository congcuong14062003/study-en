import test from "node:test";
import assert from "node:assert/strict";
import { createHanziDataLoader, hanziCharacters, HANZI_DATA_SOURCE, medianPath, parseHanziStrokeData } from "../src/lib/hanzi-strokes";

// Minimal geometric fixture, not a claimed Chinese character/stroke-order sample.
const fixture = { strokes: ["M 10 20 L 30 40 Z"], medians: [[[10, 20], [30, 40]]] };
const response = () => new Response(JSON.stringify(fixture));

test("Hanzi extraction keeps writing order and repeats, ignores Latin/Pinyin/numbers/punctuation", () => {
  assert.deepEqual(hanziCharacters("你好！nǐ hǎo 123 / 妈妈"), ["你", "好", "妈", "妈"]);
  assert.deepEqual(hanziCharacters("hello, A1"), []);
  assert.deepEqual(hanziCharacters("𠮷"), ["𠮷"], "Supplementary-plane Han characters are not split into surrogate halves");
});

test("SVG stroke data accepts bounded paths/medians and constructs ordered drawing paths", () => {
  assert.deepEqual(parseHanziStrokeData(fixture), fixture);
  assert.equal(medianPath([[10, 20], [30, 40]]), "M10 20 L30 40");
  for (const value of [null, {}, { ...fixture, strokes: [] }, { ...fixture, medians: [] },
    { ...fixture, strokes: ['<script>alert(1)</script>'] },
    { ...fixture, medians: [[[0, 0], [Infinity, 10]]] },
    { ...fixture, medians: [[[0, 0], [999999, 10]]] },
    { ...fixture, strokes: new Array(65).fill("M0 0L1 1"), medians: new Array(65).fill([[0, 0], [1, 1]]) },
  ]) assert.throws(() => parseHanziStrokeData(value), /không hợp lệ/);
});

test("stroke data loads only the selected character from a fixed version, without cookies/referrer", async () => {
  const requests: { url: string; options?: RequestInit }[] = [];
  const load = createHanziDataLoader(async (url, options) => {
    requests.push({ url: String(url), options });
    return response();
  });
  assert.equal(requests.length, 0, "Creating a loader must not preload the library");
  await assert.rejects(load("../secret"), /một chữ Hán/);
  await assert.rejects(load("你好"), /một chữ Hán/);
  assert.equal(requests.length, 0);
  const [first, second] = await Promise.all([load("你"), load("你")]);
  assert.strictEqual(first, second);
  await load("你");
  assert.equal(requests.length, 1, "Concurrent and cached opens share one request");
  assert.equal(requests[0].url, `${HANZI_DATA_SOURCE}${encodeURIComponent("你")}.json`);
  assert.equal(requests[0].options?.credentials, "omit");
  assert.equal(requests[0].options?.referrerPolicy, "no-referrer");
  assert.ok(requests[0].options?.signal);
});

test("missing characters explain unavailable data and failed requests remain retryable", async () => {
  let calls = 0;
  const load = createHanziDataLoader(async () => ++calls === 1 ? new Response("", { status: 404 }) : response());
  await assert.rejects(load("你"), /Chưa có dữ liệu.*你/);
  assert.deepEqual(await load("你"), fixture);
  assert.equal(calls, 2);
  for (const result of [new Response("gateway", { status: 503 }), new Response("<html>bad response</html>"), new Response(" ".repeat(256001))]) {
    await assert.rejects(createHanziDataLoader(async () => result)("你"));
  }
});

test("stroke cache is bounded instead of retaining every word opened in a long study session", async () => {
  let calls = 0;
  const load = createHanziDataLoader(async () => { calls++; return response(); });
  for (let index = 0; index <= 100; index++) await load(String.fromCodePoint(0x4e00 + index));
  await load(String.fromCodePoint(0x4e00 + 100));
  assert.equal(calls, 101);
  await load("一");
  assert.equal(calls, 102);
});
