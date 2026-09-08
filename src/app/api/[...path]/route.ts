import { compareTranscript } from "@/services/speech";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAIConfigured } from "@/lib/ai-config";
import { currentUser, requireUser, requireAdmin } from "@/lib/auth";
import { ApiError, checkOrigin, errorResponse, readJson, rateLimit } from "@/lib/security";
import { onboardingSchema, noteSchema, profileSchema } from "@/lib/validation";
import { dashboardData } from "@/services/dashboard";
import { lessonData, publicQuiz } from "@/services/content";
import { lockUser, reviewVocabulary, submitQuiz, reward, studyDate } from "@/services/learning";
import { chat, analyzeWriting, getAIStatus, recommendLearning } from "@/services/ai";
import { adminRead, adminWrite } from "@/services/admin";
import { finishStudy } from "@/services/study-time";
type Context = {
    params: Promise<{
        path: string[];
    }>;
};
export async function GET(request: Request, { params }: Context) {
    try {
        const { path } = await params;
        const [resource, id, action] = path;
        const url = new URL(request.url);
        let data: unknown;
        switch (resource) {
            case "health":
                await db.$queryRaw `SELECT 1`;
                data = { status: "ok", database: "postgresql" };
                break;
            case "config":
                data = { ai: isAIConfigured(), email: Boolean(process.env.SMTP_HOST), google: Boolean(process.env.GOOGLE_CLIENT_ID), facebook: Boolean(process.env.FACEBOOK_CLIENT_ID) };
                break;
            case "courses": {
                const user = await currentUser();
                const courses = await db.course.findMany({ where: { published: true, ...(id ? { id } : {}), ...(url.searchParams.get("level") ? { level: url.searchParams.get("level")! } : {}) }, include: { lessons: { where: { published: true }, orderBy: { order: "asc" }, select: { id: true, title: true, description: true, order: true } }, _count: { select: { enrollments: true } } } });
                if (id) {
                    if (!courses[0])
                        throw new ApiError("Không tìm thấy khóa học.", 404);
                    data = { ...courses[0], enrolled: user ? Boolean(await db.courseEnrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: id } } })) : false };
                }
                else
                    data = courses;
                break;
            }
            case "vocabulary": {
                const user = await requireUser();
                if (action === "reviews" || id === "reviews") {
                    data = await db.userVocabulary.findMany({ where: { userId: user.id, dueAt: { lte: new Date() } }, include: { vocabulary: true }, orderBy: { dueAt: "asc" }, take: 50 });
                    break;
                }
                const words = await db.vocabulary.findMany({ where: id ? { id } : {}, orderBy: { word: "asc" } });
                const learned = await db.userVocabulary.findMany({ where: { userId: user.id } });
                data = words.map(w => ({ ...w, review: learned.find(v => v.vocabularyId === w.id) || null }));
                break;
            }
            case "grammar":
                await requireUser();
                data = id ? await db.grammarLesson.findUnique({ where: { id } }) : await db.grammarLesson.findMany({ orderBy: { id: "asc" } });
                break;
            case "listening":
                await requireUser();
                data = id ? await db.listeningLesson.findUnique({ where: { id } }) : await db.listeningLesson.findMany();
                break;
            case "reading":
                await requireUser();
                data = id ? await db.readingArticle.findUnique({ where: { id } }) : await db.readingArticle.findMany();
                break;
            case "writing": {
                const user = await requireUser();
                data = id === "submissions"
                    ? await db.writingSubmission.findMany({ where: { userId: user.id }, include: { exercise: { select: { id: true, title: true, level: true } } }, orderBy: { createdAt: "desc" }, take: 20 })
                    : await db.writingExercise.findMany();
                break;
            }
            case "speaking":
                await requireUser();
                data = await db.speakingExercise.findMany();
                break;
            case "quiz":
                data = await publicQuiz(id || "practice-vocabulary", (await requireUser()).id);
                break;
            case "dashboard":
                data = await dashboardData((await requireUser()).id);
                break;
            case "lessons":
                data = await lessonData(id, (await requireUser()).id);
                break;
            case "me":
                data = await requireUser();
                break;
            case "favorites":
                data = await db.favorite.findMany({ where: { userId: (await requireUser()).id }, orderBy: { createdAt: "desc" } });
                break;
            case "notes":
                data = await db.note.findMany({ where: { userId: (await requireUser()).id }, orderBy: { updatedAt: "desc" } });
                break;
            case "notifications":
                data = await db.notification.findMany({ where: { userId: (await requireUser()).id }, orderBy: { createdAt: "desc" }, take: 100 });
                break;
            case "ai": {
                const user = await requireUser();
                if (id === "status")
                    data = await getAIStatus(user.id);
                else
                    data = id ? await db.aIConversation.findFirst({ where: { id, userId: user.id }, include: { messages: { orderBy: { createdAt: "asc" } } } }) : await db.aIConversation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 30 });
                break;
            }
            case "leaderboard": {
                await requireUser();
                const period = url.searchParams.get("period") || "weekly";
                const days = { daily: 1, weekly: 7, monthly: 30, all: 36500 }[period as "daily"] || 7;
                const users = await db.user.findMany({ where: { banned: false, profile: { publicLeaderboard: true } }, select: { id: true, name: true, image: true, profile: { select: { level: true, country: true } }, progress: { select: { xp: true } }, dailyGoals: { where: { date: { gte: studyDate(new Date(Date.now() - (days - 1) * 86400000)) } } } }, take: 200 });
                data = users.map(u => ({ id: u.id, name: u.name, image: u.image, level: u.profile?.level, country: u.profile?.country, xp: period === "all" ? u.progress?.xp || 0 : u.dailyGoals.reduce((s, g) => s + g.xp, 0) })).sort((a, b) => b.xp - a.xp).slice(0, 50);
                break;
            }
            case "search": {
                await requireUser();
                const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
                if (q.length < 2) {
                    data = [];
                    break;
                }
                const [words, courses, lessons, grammar, reading] = await Promise.all([db.vocabulary.findMany({ where: { OR: [{ word: { contains: q, mode: "insensitive" } }, { meaning: { contains: q, mode: "insensitive" } }] }, take: 5 }), db.course.findMany({ where: { published: true, title: { contains: q, mode: "insensitive" } }, take: 4 }), db.lesson.findMany({ where: { published: true, course: { published: true }, title: { contains: q, mode: "insensitive" } }, take: 4 }), db.grammarLesson.findMany({ where: { title: { contains: q, mode: "insensitive" } }, take: 4 }), db.readingArticle.findMany({ where: { title: { contains: q, mode: "insensitive" } }, take: 4 })]);
                data = [...words.map(w => ({ id: w.id, title: w.word, subtitle: w.meaning, type: "Từ vựng", href: `/dictionary?q=${encodeURIComponent(w.word)}` })), ...courses.map(c => ({ id: c.id, title: c.title, subtitle: c.level, type: "Khóa học", href: `/courses/${c.id}` })), ...lessons.map(c => ({ id: c.id, title: c.title, subtitle: "Bài học", type: "Bài học", href: `/courses/${c.courseId}` })), ...grammar.map(c => ({ id: c.id, title: c.title, subtitle: c.level, type: "Ngữ pháp", href: `/grammar/${c.id}` })), ...reading.map(c => ({ id: c.id, title: c.title, subtitle: c.level, type: "Bài đọc", href: `/reading/${c.id}` }))];
                break;
            }
            case "admin":
                await requireAdmin();
                data = await adminRead(id || "dashboard");
                break;
            default: throw new ApiError("API không tồn tại.", 404);
        }
        if (data === null)
            throw new ApiError("Không tìm thấy nội dung.", 404);
        return Response.json(data, { headers: { "Cache-Control": "no-store" } });
    }
    catch (e) {
        return errorResponse(e);
    }
}
async function mutate(request: Request, { params }: Context) {
    try {
        checkOrigin(request);
        const user = await requireUser();
        await rateLimit(`mutation:${user.id}`, 100, 60);
        const { path } = await params;
        const [resource, id, action] = path;
        const raw = request.method === "DELETE" ? {} : await readJson(request);
        let data: unknown;
        switch (resource) {
            case "onboarding": {
                const values = onboardingSchema.parse(raw);
                data = await db.$transaction(async (tx) => {
                    await tx.profile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...values, onboardingComplete: true }, update: { ...values, onboardingComplete: true } });
                    return tx.learningPlan.upsert({ where: { userId: user.id }, create: { userId: user.id, level: values.level, goal: values.goal, weeks: [{ week: 1, topic: "Daily routines" }, { week: 2, topic: "Family & friends" }, { week: 3, topic: "Work & study" }, { week: 4, topic: values.goal === "Du lịch" ? "Travel & experiences" : "Communication & confidence" }] }, update: { level: values.level, goal: values.goal } });
                });
                break;
            }
            case "courses": {
                if (action !== "enroll")
                    throw new ApiError("Hành động không hợp lệ.");
                const course = await db.course.findFirst({ where: { id, published: true } });
                if (!course)
                    throw new ApiError("Không tìm thấy khóa học.", 404);
                if (course.premium && user.role !== "ADMIN" && !(user.subscription?.plan === "PREMIUM" && user.subscription.status === "active" && (!user.subscription.currentPeriodEnd || user.subscription.currentPeriodEnd > new Date())))
                    throw new ApiError("Khóa học dành cho thành viên Premium.", 403);
                data = await db.courseEnrollment.upsert({ where: { userId_courseId: { userId: user.id, courseId: id } }, create: { userId: user.id, courseId: id }, update: {} });
                break;
            }
            case "lessons": {
                if (action !== "progress")
                    throw new ApiError("Hành động không hợp lệ.");
                const { step } = z.object({ step: z.number().int().min(0).max(5) }).parse(raw);
                await lessonData(id, user.id);
                data = await db.$transaction(async (tx) => {
                    await lockUser(tx, user.id);
                    const current = await tx.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId: id } } });
                    if (step > (current?.step || 0) + 1)
                        throw new ApiError("Hãy hoàn thành bài học theo từng bước.");
                    return tx.lessonProgress.upsert({ where: { userId_lessonId: { userId: user.id, lessonId: id } }, create: { userId: user.id, lessonId: id, step }, update: { step: Math.max(step, current?.step || 0) } });
                });
                break;
            }
            case "vocabulary": {
                if (id !== "review")
                    throw new ApiError("Hành động không hợp lệ.");
                const { vocabularyId, rating } = z.object({ vocabularyId: z.string(), rating: z.enum(["again", "hard", "good", "easy"]) }).parse(raw);
                data = await reviewVocabulary(user.id, vocabularyId, rating);
                break;
            }
            case "quiz": {
                if (id !== "submit")
                    throw new ApiError("Hành động không hợp lệ.");
                const values = z.object({ quizId: z.string(), answers: z.array(z.object({ questionId: z.string(), selected: z.number().int() })).min(1).max(100) }).parse(raw);
                data = await submitQuiz(user.id, values.quizId, values.answers);
                break;
            }
            case "study": {
                if (id === "start") {
                    const v = z.object({ kind: z.enum(["lesson", "speaking", "reading", "listening"]), resourceId: z.string().max(100) }).parse(raw);
                    if (v.kind === "lesson")
                        await lessonData(v.resourceId, user.id);
                    data = await db.studySession.create({ data: { userId: user.id, ...v } });
                }
                else if (id === "finish") {
                    const { sessionId } = z.object({ sessionId: z.string() }).parse(raw);
                    data = await finishStudy(user.id, sessionId);
                }
                break;
            }
            case "favorites": {
                const v = z.object({ type: z.enum(["word", "grammar", "lesson", "article"]), resourceId: z.string().max(100), title: z.string().max(150), href: z.string().regex(/^\/(vocabulary|dictionary|grammar|lessons|reading|courses)(\/[^\s?#]*)?(\?[^\s]*)?$/) }).parse(raw);
                const where = { userId_type_resourceId: { userId: user.id, type: v.type, resourceId: v.resourceId } };
                const exists = await db.favorite.findUnique({ where });
                if (exists) {
                    await db.favorite.delete({ where });
                    data = { saved: false };
                }
                else {
                    await db.favorite.create({ data: { userId: user.id, ...v } });
                    data = { saved: true };
                }
                break;
            }
            case "notes": {
                if (id) {
                    const note = await db.note.findFirst({ where: { id, userId: user.id } });
                    if (!note)
                        throw new ApiError("Ghi chú không tồn tại.", 404);
                    data = request.method === "DELETE" ? await db.note.delete({ where: { id } }) : await db.note.update({ where: { id }, data: noteSchema.parse(raw) });
                }
                else
                    data = await db.note.create({ data: { userId: user.id, ...noteSchema.parse(raw) } });
                break;
            }
            case "profile":
                data = await db.$transaction(async (tx) => {
                    const { name, ...profile } = profileSchema.parse(raw);
                    await tx.profile.update({ where: { userId: user.id }, data: profile });
                    return tx.user.update({ where: { id: user.id }, data: { name }, select: { id: true, name: true } });
                });
                break;
            case "subscription": {
                if (id !== "interest")
                    throw new ApiError("Hành động không hợp lệ.");
                const v = z.object({ period: z.enum(["monthly", "yearly"]) }).parse(raw);
                data = await db.note.create({ data: { userId: user.id, title: "Quan tâm EnglishMaster Premium", content: `Tôi quan tâm gói ${v.period === "yearly" ? "hằng năm" : "hằng tháng"}. Chưa có giao dịch hay thanh toán.`, tags: ["premium", "interest"] } });
                break;
            }
            case "notifications":
                data = await db.notification.updateMany({ where: { userId: user.id, ...(id && id !== "read-all" ? { id } : {}) }, data: { read: true } });
                break;
            case "ai":
                if (request.method === "DELETE" && id && !action) {
                    const removed = await db.aIConversation.deleteMany({ where: { id, userId: user.id } });
                    if (!removed.count)
                        throw new ApiError("Không tìm thấy hội thoại.", 404);
                    data = { deleted: true };
                }
                else if (id === "chat")
                    data = await chat(user.id, raw);
                else if (id === "recommendation")
                    data = await recommendLearning(user.id);
                else
                    throw new ApiError("Hành động không hợp lệ.");
                break;
            case "writing":
                if (id !== "analyze")
                    throw new ApiError("Hành động không hợp lệ.");
                data = await analyzeWriting(user.id, raw);
                break;
            case "speaking": {
                const v = z.object({ expected: z.string().max(1000), transcript: z.string().max(1000) }).parse(raw);
                data = compareTranscript(v.expected, v.transcript);
                break;
            }
            case "admin":
                await requireAdmin();
                data = await adminWrite(id, action, raw, request.method, user.id);
                break;
            default: throw new ApiError("API không tồn tại.", 404);
        }
        return Response.json(data || { ok: true });
    }
    catch (e) {
        return errorResponse(e);
    }
}
export { mutate as POST, mutate as PATCH, mutate as DELETE };
