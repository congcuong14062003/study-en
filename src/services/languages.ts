import { db } from "@/lib/db";
import { learningLanguageSchema } from "@/lib/languages";
import { lockUser } from "./learning";
import { ApiError } from "@/lib/security";

export async function selectLearningLanguage(userId: string, raw: unknown) {
  const language = learningLanguageSchema.parse(raw);
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, include: { subscription: true } });
    const sub = user.subscription;
    const premium = user.role === "ADMIN" || (sub?.plan === "PREMIUM" && sub.status === "active" && (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date()));
    const available = { language, published: true, ...(premium ? {} : { premium: false }) };
    const first = await tx.course.findFirst({ where: available, orderBy: { createdAt: "asc" }, select: { id: true } });
    if (!first) throw new ApiError("Ngôn ngữ này chưa có khóa học được xuất bản. Vui lòng quay lại sau.", 409);
    await tx.profile.upsert({ where: { userId }, create: { userId, targetLanguage: language }, update: { targetLanguage: language } });
    const enrolled = await tx.courseEnrollment.findFirst({ where: { userId, course: available }, orderBy: { createdAt: "desc" }, select: { courseId: true } });
    if (!enrolled) await tx.courseEnrollment.create({ data: { userId, courseId: first.id } });
    const current = await tx.lessonProgress.findFirst({
      where: { userId, completed: false, lesson: { published: true, course: { ...available, enrollments: { some: { userId } } } } },
      orderBy: { updatedAt: "desc" }, select: { lessonId: true },
    });
    const next = current ? null : await tx.lesson.findFirst({
      where: { published: true, courseId: enrolled?.courseId || first.id, progress: { none: { userId, completed: true } } },
      orderBy: { order: "asc" }, select: { id: true },
    });
    return { language, resumeHref: current ? `/lessons/${current.lessonId}` : next ? `/lessons/${next.id}` : "/study-plan" };
  });
}
