import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import { examPapers } from "../prisma/exam-content";

const db = new PrismaClient();
async function main() {
  for (const paper of examPapers) {
    const data = { ...paper, questions: paper.questions as unknown as Prisma.InputJsonValue, published: true };
    await db.examPaper.upsert({ where: { id: paper.id }, create: data, update: data });
  }
  console.log(`Đã đồng bộ ${examPapers.length} bộ đề, ${examPapers.reduce((sum, paper) => sum + paper.questions.length, 0)} câu hỏi. Bài làm đã lưu được giữ nguyên.`);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Không thể đồng bộ bộ đề.");
  process.exitCode = 1;
}).finally(() => db.$disconnect());
