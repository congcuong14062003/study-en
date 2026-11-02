import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedChinese } from "../prisma/chinese-content";
import { seedChineseVocabulary } from "../prisma/chinese-vocabulary";
import { chineseCourses } from "../prisma/chinese-courses";
const db = new PrismaClient();
seedChineseVocabulary(db)
  .then(async ({ added, available }) => {
    await seedChinese(db);
    console.log(`Chinese synchronized: 1 starter + ${chineseCourses.length} thematic + HSK 1–5 courses; ${added}/${available} additional vocabulary entries inserted. Existing learner cards/progress preserved.`);
  })
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => db.$disconnect());
