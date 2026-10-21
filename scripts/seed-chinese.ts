import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedChinese } from "../prisma/chinese-content";
import { seedChineseVocabulary } from "../prisma/chinese-vocabulary";
const db = new PrismaClient();
seedChinese(db)
  .then(() => seedChineseVocabulary(db))
  .then(({ added, available }) => console.log(`Chinese starter synchronized; ${added}/${available} additional words inserted. Existing learner cards/progress preserved.`))
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => db.$disconnect());
