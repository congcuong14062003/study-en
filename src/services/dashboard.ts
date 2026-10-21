import { ensureDailyReminder } from "./reminders";
import { db } from "@/lib/db";
import { effectiveStreak, studyDate } from "./learning";
export async function dashboardData(userId: string, language = "en") {
  await ensureDailyReminder(userId);
  const today = studyDate();
  const [
    user,
    goals,
    enrollments,
    lessonProgress,
    due,
    achievements,
    notifications,
    attempts,
    reviewCount,
    allBadges,
    plan,
  ] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        profile: true,
        progress: true,
        subscription: true,
      },
    }),
    db.dailyGoal.findMany({
      where: {
        userId,
        date: { gte: studyDate(new Date(Date.now() - 90 * 86400000)) },
      },
      orderBy: { date: "asc" },
    }),
    db.courseEnrollment.findMany({
      where: { userId, course: { language } },
      include: {
        course: {
          include: {
            lessons: {
              where: { published: true },
              orderBy: { order: "asc" },
              select: { id: true, title: true, order: true },
            },
          },
        },
      },
    }),
    db.lessonProgress.findMany({
      where: { userId, lesson: { course: { language } } },
      include: { lesson: { include: { course: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.userVocabulary.count({ where: { userId, dueAt: { lte: new Date() }, vocabulary: { language } } }),
    db.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    }),
    db.notification.count({ where: { userId, read: false } }),
    db.quizAttempt.findMany({
      where: { userId, quiz: { language } },
      include: { answers: { include: { question: { select: { skill: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.vocabularyReview.count({
      where: {
        userId,
        vocabulary: { language },
        reviewedAt: { gte: new Date(`${today}T00:00:00+07:00`) },
      },
    }),
    db.achievement.findMany(),
    db.learningPlan.findUnique({ where: { userId } }),
  ]);
  const recommended = await db.course.findMany({
    where: { published: true, language },
    include: { _count: { select: { lessons: true } } },
    take: 3,
  });
  const progress = user.progress
    ? {
        ...user.progress,
        streak: effectiveStreak(
          user.progress.streak,
          user.progress.lastStudyDate,
        ),
      }
    : null;
  const wordCount = await db.userVocabulary.count({ where: { userId, vocabulary: { language } } });
  const skillScores: Record<string, number> = {};
  for (const attempt of [...attempts].reverse()) {
    for (const skill of ["vocabulary", "grammar", "reading", "listening"]) {
      const answers = attempt.answers.filter((a) => a.question.skill === skill);
      if (answers.length) skillScores[skill] = Math.round(100 * answers.filter((a) => a.correct).length / answers.length);
    }
  }
  if (progress) { progress.wordsLearned = wordCount; progress.lessonsCompleted = lessonProgress.filter((p) => p.completed).length; progress.skillScores = skillScores; }
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = studyDate(new Date(Date.now() - (6 - i) * 86400000));
    const g = goals.find((x) => x.date === day);
    return {
      date: day,
      minutes: Math.round((g?.seconds || 0) / 60),
      xp: g?.xp || 0,
    };
  });
  return {
    user: { ...user, progress },
    today: goals.find((g) => g.date === today) || null,
    week,
    goals,
    enrollments,
    lessonProgress,
    due,
    achievements,
    notifications,
    attempts,
    reviewCount,
    allBadges,
    plan: language === "en" ? plan : null,
    recommended,
  };
}
export type DashboardData = Awaited<ReturnType<typeof dashboardData>>;
