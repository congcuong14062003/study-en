import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedChinese } from "../prisma/chinese-content";
import { seedChineseVocabulary } from "../prisma/chinese-vocabulary";
import { chineseCourses } from "../prisma/chinese-courses";
const db = new PrismaClient();
seedChinese(db)
  .then(() => seedChineseVocabulary(db))
  .then(({ added, available }) => console.log(`Chinese synchronized: ${1 + chineseCourses.length} courses, ${6 + chineseCourses.reduce((sum, course) => sum + course.topics.length, 0)} lessons; ${added}/${available} additional vocabulary entries inserted. Existing learner cards/progress preserved.`))
  .catch((e) => { console.error(e.message); process.exitCode = 1; })
  .finally(() => db.$disconnect());
