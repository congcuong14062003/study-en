import type { PrismaClient } from "@prisma/client";
import data from "./data/chinese-vocabulary-3000.json";

/** Insert-only: never replace curated words, translations or existing learner cards. */
export async function seedChineseVocabulary(db: PrismaClient) {
  let added = 0;
  for (let offset = 0; offset < data.length; offset += 300) {
    const batch = data.slice(offset, offset + 300).map(({ source: _source, ...word }) => word);
    const result = await db.vocabulary.createMany({ data: batch, skipDuplicates: true });
    added += result.count;
  }
  return { available: data.length, added };
}
