import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildGlossary,
  isReadingWord,
  lookupReadingWord,
  readingWordContext,
  splitReadingWords,
} from "../src/lib/reading-glossary";

describe("reading word glossary", () => {
  const glossary = buildGlossary([
    { id: "report", word: "report", meaning: "báo cáo" },
    { id: "copy", word: "copy", meaning: "sao chép" },
  ]);

  it("preserves punctuation and spaces while separating words", () => {
    assert.deepEqual(splitReadingWords("Luke, copy these reports!"), [
      "Luke", ", ", "copy", " ", "these", " ", "reports", "!",
    ]);
    assert.equal(isReadingWord("don't"), true);
    assert.equal(isReadingWord(", "), false);
  });

  it("uses vocabulary, common words and simple inflections", () => {
    assert.equal(lookupReadingWord("copy", glossary)?.meaning, "sao chép");
    assert.equal(lookupReadingWord("reports", glossary)?.meaning, "báo cáo");
    assert.equal(lookupReadingWord("copied", glossary)?.meaning, "sao chép");
    assert.equal(lookupReadingWord("these", glossary)?.meaning, "những cái này");
    assert.equal(lookupReadingWord("unlisted", glossary), null);
  });

  it("keeps the hovered word in a short translation context", () => {
    const text = `First sentence. ${"ordinary ".repeat(30)}The evidence is tenuous here.`;
    const start = text.indexOf("tenuous");
    const context = readingWordContext(text, start, "tenuous".length);
    assert.match(context, /tenuous/);
    assert.ok(context.length <= 208);
  });
});
