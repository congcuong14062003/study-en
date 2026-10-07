import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function wordsIn(file: string) {
  const sql = readFileSync(join(process.cwd(), "prisma", file), "utf8");
  const words = [...sql.matchAll(/^\s*\('[^']+', '((?:[^']|'')+)'/gm)]
    .map((match) => match[1].replaceAll("''", "'").toLowerCase());
  return { sql, words };
}

test("additional import contains 3,000 new words and is safe to repeat", () => {
  const base = wordsIn("vocabulary-seed.sql");
  const firstImport = wordsIn("seed-vocabulary-5000.sql");
  const additional = wordsIn("seed-vocabulary-additional-3000.sql");
  const previousWords = new Set([...base.words, ...firstImport.words]);

  assert.equal(additional.words.length, 3000);
  assert.equal(new Set(additional.words).size, 3000);
  assert.ok(additional.words.every((word) => !previousWords.has(word)));
  assert.match(additional.sql, /BEGIN;[\s\S]*ON CONFLICT \("word"\) DO NOTHING;[\s\S]*COMMIT;/);
});
