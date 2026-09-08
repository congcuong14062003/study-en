import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/security";
import { courseSchema } from "@/lib/validation";
const str = z.string().min(1).max(12000);
const strings = z.array(z.string().max(500)).max(50);
export const cmsSchemas = {
    courses: courseSchema,
    vocabulary: z.object({ word: str, ipa: str, meaning: str, definition: str, partOfSpeech: str, example: str, translation: str, category: str, level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]), synonyms: strings, antonyms: strings, collocations: strings, wordFamily: strings, audioUrl: z.url().startsWith("https://").nullable().optional() }),
    grammar: z.object({ title: str, level: str, description: str, structure: strings, examples: strings, notes: str, commonMistake: str }),
    listening: z.object({ title: str, level: str, topic: str, duration: z.number().int().min(1).max(120), transcript: str, translation: str, audioUrl: z.url().startsWith("https://").nullable().optional() }),
    reading: z.object({ title: str, level: str, category: str, minutes: z.number().int().min(1).max(120), body: str, translation: str }),
    questions: z.object({ skill: z.enum(["vocabulary", "grammar", "reading", "listening"]), level: str, prompt: str, options: z.array(z.string().min(1).max(1000)).min(2).max(6), correctAnswer: z.number().int().min(0), explanation: str, passage: z.string().nullable().optional(), audioText: z.string().nullable().optional() }).refine(v => v.correctAnswer < v.options.length, "Chỉ số đáp án phải nằm trong danh sách lựa chọn."),
    lessons: z.object({ courseId: str, title: str, description: str, order: z.number().int().min(1).max(500), vocabularyIds: strings, grammarId: z.string().nullable().optional(), listeningId: z.string().nullable().optional(), readingId: z.string().nullable().optional(), questionIds: strings, published: z.boolean() })
};
export async function adminRead(section: string) {
    switch (section) {
        case "users": return db.user.findMany({ select: { id: true, name: true, email: true, role: true, banned: true, createdAt: true, profile: { select: { level: true } }, subscription: { select: { plan: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
        case "courses": return db.course.findMany({ include: { _count: { select: { lessons: true, enrollments: true } } } });
        case "vocabulary": return db.vocabulary.findMany({ orderBy: { word: "asc" } });
        case "grammar": return db.grammarLesson.findMany();
        case "listening": return db.listeningLesson.findMany();
        case "reading": return db.readingArticle.findMany();
        case "questions": return db.question.findMany();
        case "lessons": return db.lesson.findMany({ orderBy: [{ courseId: "asc" }, { order: "asc" }] });
        case "subscriptions": return db.subscription.findMany({ include: { user: { select: { name: true, email: true } } } });
        case "reports": return db.quizAttempt.findMany({ include: { user: { select: { name: true } }, quiz: { select: { title: true } } }, take: 100, orderBy: { createdAt: "desc" } });
        default: {
            const [users, active, premium, revenue, courses, lessons, complete, daily] = await Promise.all([db.user.count(), db.userProgress.count({ where: { lastStudyDate: { gte: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10) } } }), db.subscription.count({ where: { plan: "PREMIUM", status: "active" } }), db.payment.aggregate({ _sum: { amount: true }, where: { status: "paid" } }), db.course.count(), db.lesson.count(), db.lessonProgress.count({ where: { completed: true } }), db.dailyGoal.groupBy({ by: ["date"], _count: { userId: true }, _sum: { seconds: true }, orderBy: { date: "desc" }, take: 14 })]);
            return { users, active, premium, revenue: revenue._sum.amount || 0, courses, lessons, complete, daily, aiConfigured: Boolean(process.env.OPENAI_API_KEY), emailConfigured: Boolean(process.env.SMTP_HOST), googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID) };
        }
    }
}
export async function adminWrite(section: string, id: string | undefined, raw: unknown, method: string, adminId: string) {
    if (section === "users") {
        if (!id)
            throw new ApiError("Thiếu người dùng.");
        if (id === adminId)
            throw new ApiError("Không thể thay đổi quyền hoặc xóa tài khoản quản trị đang sử dụng.");
        const target = await db.user.findUnique({ where: { id } });
        if (!target)
            throw new ApiError("Không tìm thấy người dùng.", 404);
        if (target.role === "ADMIN")
            throw new ApiError("Hãy quản lý tài khoản quản trị khác qua quy trình quản trị máy chủ.", 403);
        if (method === "DELETE")
            return db.user.delete({ where: { id }, select: { id: true } });
        const parsed = z.object({ name: z.string().min(2).max(80), banned: z.boolean(), role: z.enum(["USER", "PREMIUM"]) }).parse(raw);
        return db.$transaction(async (tx) => {
            await tx.subscription.upsert({ where: { userId: id }, create: { userId: id, plan: parsed.role === "PREMIUM" ? "PREMIUM" : "FREE", status: "active" }, update: { plan: parsed.role === "PREMIUM" ? "PREMIUM" : "FREE", status: "active", currentPeriodEnd: null } });
            return tx.user.update({ where: { id }, data: { ...parsed, sessionVersion: { increment: 1 } }, select: { id: true } });
        });
    }
    if (!(section in cmsSchemas))
        throw new ApiError("Module này chỉ cho phép xem.", 405);
    if (method === "DELETE") {
        if (!id)
            throw new ApiError("Thiếu nội dung cần xóa.");
        switch (section) {
            case "courses":
                if (await db.courseEnrollment.count({ where: { courseId: id } }))
                    throw new ApiError("Khóa học đã có học viên. Hãy chuyển về bản nháp.", 409);
                return db.course.delete({ where: { id } });
            case "vocabulary":
                if (await db.lesson.count({ where: { vocabularyIds: { has: id } } }))
                    throw new ApiError("Từ đang được dùng trong bài học.", 409);
                return db.vocabulary.delete({ where: { id } });
            case "grammar":
                if (await db.lesson.count({ where: { grammarId: id } }))
                    throw new ApiError("Nội dung đang được dùng trong bài học.", 409);
                return db.grammarLesson.delete({ where: { id } });
            case "listening":
                if (await db.lesson.count({ where: { listeningId: id } }))
                    throw new ApiError("Nội dung đang được dùng trong bài học.", 409);
                return db.listeningLesson.delete({ where: { id } });
            case "reading":
                if (await db.lesson.count({ where: { readingId: id } }))
                    throw new ApiError("Nội dung đang được dùng trong bài học.", 409);
                return db.readingArticle.delete({ where: { id } });
            case "questions":
                if (await db.quiz.count({ where: { questionIds: { has: id } } }))
                    throw new ApiError("Câu hỏi đang được dùng trong quiz.", 409);
                return db.question.delete({ where: { id } });
            case "lessons":
                if (await db.lessonProgress.count({ where: { lessonId: id } }))
                    throw new ApiError("Bài học đã có tiến độ. Hãy ẩn bài học.", 409);
                return db.lesson.delete({ where: { id } });
        }
    }
    switch (section) {
        case "courses": {
            const data = courseSchema.parse(raw);
            return id ? db.course.update({ where: { id }, data }) : db.course.create({ data });
        }
        case "vocabulary": {
            const data = cmsSchemas.vocabulary.parse(raw);
            return id ? db.vocabulary.update({ where: { id }, data }) : db.vocabulary.create({ data });
        }
        case "grammar": {
            const data = cmsSchemas.grammar.parse(raw);
            return id ? db.grammarLesson.update({ where: { id }, data }) : db.grammarLesson.create({ data });
        }
        case "listening": {
            const data = cmsSchemas.listening.parse(raw);
            return id ? db.listeningLesson.update({ where: { id }, data }) : db.listeningLesson.create({ data });
        }
        case "reading": {
            const data = cmsSchemas.reading.parse(raw);
            return id ? db.readingArticle.update({ where: { id }, data }) : db.readingArticle.create({ data });
        }
        case "questions": {
            const data = cmsSchemas.questions.parse(raw);
            return id ? db.question.update({ where: { id }, data }) : db.question.create({ data });
        }
        case "lessons": {
            const data = cmsSchemas.lessons.parse(raw);
            const [words, questions, grammar, listening, reading] = await Promise.all([db.vocabulary.count({ where: { id: { in: data.vocabularyIds } } }), db.question.count({ where: { id: { in: data.questionIds } } }), data.grammarId ? db.grammarLesson.findUnique({ where: { id: data.grammarId } }) : true, data.listeningId ? db.listeningLesson.findUnique({ where: { id: data.listeningId } }) : true, data.readingId ? db.readingArticle.findUnique({ where: { id: data.readingId } }) : true]);
            if (words !== data.vocabularyIds.length || questions !== data.questionIds.length || !grammar || !listening || !reading || data.questionIds.length === 0)
                throw new ApiError("Tham chiếu nội dung không tồn tại, trùng lặp hoặc thiếu câu hỏi.");
            return db.$transaction(async (tx) => {
                const lesson = id ? await tx.lesson.update({ where: { id }, data }) : await tx.lesson.create({ data });
                await tx.quiz.upsert({ where: { id: `quiz-${lesson.id}` }, create: { id: `quiz-${lesson.id}`, lessonId: lesson.id, title: lesson.title, kind: "lesson", questionIds: lesson.questionIds }, update: { title: lesson.title, questionIds: lesson.questionIds } });
                return lesson;
            });
        }
    }
}
