import { writeFileSync } from "node:fs";
import * as content from "../prisma/content";
import { extraVocabulary } from "../prisma/expanded-content";
import { moreVocabulary } from "../prisma/vocabulary-expansion";
import { coreLexicon } from "../prisma/core-lexicon";
import { topicVocabulary } from "../prisma/topic-vocabulary";
import { c2Vocabulary } from "../prisma/c2-content";

type VocabularyRow = {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  definition: string;
  partOfSpeech: string;
  example: string;
  translation: string;
  category: string;
  level: string;
  audioUrl?: string | null;
  synonyms?: string[];
  antonyms?: string[];
  collocations?: string[];
  wordFamily?: string[];
};

const rows = [
  ...content.vocabulary,
  ...extraVocabulary,
  ...moreVocabulary,
  ...coreLexicon,
  ...topicVocabulary,
  ...c2Vocabulary,
] as VocabularyRow[];

const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;
const sqlArray = (values: string[] = []) => `ARRAY[${values.map(sqlString).join(", ")}]::text[]`;
const sqlNullableString = (value?: string | null) => value == null ? "NULL" : sqlString(value);

const columns = [
  "id", "word", "ipa", "meaning", "definition", "partOfSpeech", "example",
  "translation", "category", "level", "audioUrl", "synonyms", "antonyms",
  "collocations", "wordFamily",
];

const values = rows.map(row => `(${[
  sqlString(row.id),
  sqlString(row.word),
  sqlString(row.ipa ?? ""),
  sqlString(row.meaning),
  sqlString(row.definition),
  sqlString(row.partOfSpeech),
  sqlString(row.example),
  sqlString(row.translation),
  sqlString(row.category),
  sqlString(row.level),
  sqlNullableString(row.audioUrl),
  sqlArray(row.synonyms),
  sqlArray(row.antonyms),
  sqlArray(row.collocations),
  sqlArray(row.wordFamily),
].join(", ")})`);

const updateColumns = columns
  .filter(column => column !== "id" && column !== "word")
  .map(column => `  "${column}" = EXCLUDED."${column}"`)
  .join(",\n");

const output = `-- EnglishMaster vocabulary export (${rows.length} rows)
-- Generated from the Prisma seed vocabulary packs.
BEGIN;

INSERT INTO "Vocabulary" ("${columns.join('", "')}")
VALUES
${values.join(",\n")}
ON CONFLICT ("word") DO UPDATE SET
${updateColumns};

COMMIT;
`;

writeFileSync("prisma/vocabulary-seed.sql", output, "utf8");
console.log(`Wrote ${rows.length} vocabulary rows to prisma/vocabulary-seed.sql`);