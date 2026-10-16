import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { exampleSentenceTranslation } from "../src/lib/vocabulary-example";
import { db } from "../src/lib/db";
import { translateVocabularyExample } from "../src/services/ai";

const word = {
  id: "test-necklace",
  word: "necklace",
  example: "She wore a gold necklace to dinner.",
  translation: "Nghĩa trong ngữ cảnh: Chuỗi hạt.",
};
const sentence = "Cô ấy đeo một chiếc vòng cổ bằng vàng khi đi ăn tối.";

// Prisma delegates expose methods through a proxy rather than own descriptors.
function stub<T extends (...args: any[]) => any>(
  t: TestContext,
  target: object,
  name: string,
  implementation: T,
) {
  const methods = target as Record<string, unknown>;
  const original = methods[name];
  const mocked = t.mock.fn(implementation);
  methods[name] = mocked;
  t.after(() => { methods[name] = original; });
  return mocked;
}

test("dictionary glosses and untranslated examples do not count as sentence translations", () => {
  const example = "She wore a gold necklace to dinner.";
  assert.equal(exampleSentenceTranslation(example, "Nghĩa trong ngữ cảnh: Chuỗi hạt."), null);
  assert.equal(exampleSentenceTranslation(example, " nghĩa trong ngữ cảnh: Chuỗi hạt. "), null);
  assert.equal(exampleSentenceTranslation(example, ""), null);
  assert.equal(exampleSentenceTranslation(example, null), null);
  assert.equal(exampleSentenceTranslation(example, example), null);
});

test("existing full sentence translations are preserved", () => {
  assert.equal(
    exampleSentenceTranslation("She wore a gold necklace to dinner.", "  Cô ấy đeo một chiếc vòng cổ bằng vàng khi đi ăn tối.  "),
    "Cô ấy đeo một chiếc vòng cổ bằng vàng khi đi ăn tối.",
  );
});

test("saved sentence translations return without AI or database writes", async (t) => {
  stub(t, db.vocabulary, "findUnique", async () => ({ ...word, translation: sentence }));
  const fetch = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected AI call"); });
  const update = stub(t, db.vocabulary, "updateMany", async () => ({ count: 1 }));
  assert.deepEqual(await translateVocabularyExample("learner", word.id), {
    example: word.example,
    translation: sentence,
  });
  assert.equal(fetch.mock.callCount(), 0);
  assert.equal(update.mock.callCount(), 0);
});

test("missing translations use the full example, share concurrent calls, and persist the result", async (t) => {
  const oldProvider = process.env.AI_PROVIDER;
  const oldKey = process.env.GROQ_API_KEY;
  process.env.AI_PROVIDER = "groq";
  process.env.GROQ_API_KEY = "test-key";
  t.after(() => {
    if (oldProvider === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = oldProvider;
    if (oldKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = oldKey;
  });
  stub(t, db.vocabulary, "findUnique", async () => word);
  stub(t, db, "$queryRaw", async () => [{ count: 1 }]);
  const update = stub(t, db.vocabulary, "updateMany", async (_args: unknown) => ({ count: 1 }));
  const fetch = t.mock.method(globalThis, "fetch", async (_url: unknown, options?: RequestInit) => {
    const request = JSON.parse(String(options?.body));
    assert.deepEqual(JSON.parse(request.input[1].content), {
      word: word.word,
      example: word.example,
    });
    return Response.json({ status: "completed", output: [
      { content: [{ type: "output_text", text: JSON.stringify({ translation: sentence }) }] },
    ] });
  });
  const results = await Promise.all([
    translateVocabularyExample("learner", word.id),
    translateVocabularyExample("another-learner", word.id),
  ]);
  assert.ok(results.every((value) => value.translation === sentence));
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(update.mock.callCount(), 1);
  assert.deepEqual(update.mock.calls[0].arguments[0], {
    where: { id: word.id, example: word.example, translation: word.translation },
    data: { translation: sentence },
  });
});
