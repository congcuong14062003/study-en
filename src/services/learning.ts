import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/security";
import { scheduleReview, type ReviewRating } from "./spaced-repetition";
import { requireCourseAccess } from "./course-access";
export function studyDate(date = new Date()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function effectiveStreak(streak: number, last: string | null, now = new Date()) {
    const today = studyDate(now);
    const yesterday = studyDate(new Date(now.getTime() - 86400000));
    return last === today || last === yesterday ? streak : 0;
}
export function cefrForScore(percent: number) {
    return percent >= 95 ? "C2" : percent >= 82 ? "C1" : percent >= 67 ? "B2" : percent >= 48 ? "B1" : percent >= 28 ? "A2" : "A1";
}
export async function lockUser(tx: Prisma.TransactionClient, userId: string) {
    await tx.$queryRaw `SELECT "id" FROM "User" WHERE "id"=${userId} FOR UPDATE`;
}
export async function reward(tx: Prisma.TransactionClient, userId: string, xp: number, kind: string, resourceId: string, seconds = 0) {
    const progress = await tx.userProgress.upsert({ where: { userId }, create: { userId }, update: {} });
    const today = studyDate();
    const yesterday = studyDate(new Date(Date.now() - 86400000));
    const streak = progress.lastStudyDate === today ? progress.streak : progress.lastStudyDate === yesterday ? progress.streak + 1 : 1;
    const updated = await tx.userProgress.update({ where: { userId }, data: { xp: { increment: xp }, studySeconds: { increment: seconds }, streak, longestStreak: Math.max(streak, progress.longestStreak), lastStudyDate: today } });
    const profile = await tx.profile.findUnique({ where: { userId } });
    await tx.dailyGoal.upsert({ where: { userId_date: { userId, date: today } }, create: { userId, date: today, targetMinutes: profile?.dailyMinutes || 20, seconds, xp }, update: { seconds: { increment: seconds }, xp: { increment: xp } } });
    if (kind !== "time")
        await tx.studySession.create({ data: { userId, kind, resourceId, xp, seconds, endedAt: new Date() } });
    const badges = [...(updated.lessonsCompleted >= 1 ? ["first-lesson"] : []), ...(streak >= 7 ? ["streak-7"] : []), ...(streak >= 30 ? ["streak-30"] : []), ...(updated.wordsLearned >= 30 ? ["vocabulary-30"] : []), ...(updated.wordsLearned >= 1000 ? ["words-1000"] : []), ...(updated.lessonsCompleted >= 100 ? ["lessons-100"] : [])];
    for (const achievementId of badges) {
        const owned = await tx.userAchievement.findUnique({ where: { userId_achievementId: { userId, achievementId } } });
        if (!owned) {
            await tx.userAchievement.create({ data: { userId, achievementId } });
            const badge = await tx.achievement.findUnique({ where: { id: achievementId } });
            await tx.notification.create({ data: { userId, type: "achievement", title: `Thành tích mới: ${badge?.title}`, body: "Bạn vừa mở khóa một cột mốc mới. Tiếp tục phát huy nhé!", href: "/achievements" } });
        }
    }
    return updated;
}
export async function reviewVocabulary(userId: string, id: string, rating: ReviewRating) {
    return db.$transaction(async (tx) => {
        await lockUser(tx, userId);
        const word = await tx.vocabulary.findUnique({ where: { id } });
        if (!word)
            throw new ApiError("Không tìm thấy từ vựng.", 404);
        const current = await tx.userVocabulary.findUnique({ where: { userId_vocabularyId: { userId, vocabularyId: id } } });
        if (current && current.dueAt > new Date())
            throw new ApiError("Bạn đã ôn từ này. Hãy quay lại khi đến lịch ôn.", 409);
        const state = scheduleReview(current || { repetitions: 0, interval: 0, ease: 2.5 }, rating);
        await tx.userVocabulary.upsert({ where: { userId_vocabularyId: { userId, vocabularyId: id } }, create: { userId, vocabularyId: id, ...state }, update: state });
        await tx.vocabularyReview.create({ data: { userId, vocabularyId: id, rating } });
        if (!current)
            await tx.userProgress.update({ where: { userId }, data: { wordsLearned: { increment: 1 } } });
        await reward(tx, userId, 5, "vocabulary", id);
        return { state, xp: 5 };
    });
}
export async function submitQuiz(userId: string, quizId: string, answers: {
    questionId: string;
    selected: number;
}[]) {
    return db.$transaction(async (tx) => {
        await lockUser(tx, userId);
        const quiz = await tx.quiz.findUnique({ where: { id: quizId }, include: { lesson: { include: { course: true } } } });
        if (!quiz)
            throw new ApiError("Bài kiểm tra không tồn tại.", 404);
        if (quiz.lesson && (!quiz.lesson.published || !quiz.lesson.course.published))
            throw new ApiError("Bài học chưa được xuất bản.", 404);
        if (quiz.lesson) {
            await requireCourseAccess(userId, quiz.lesson.courseId, tx);
            const enrolled = await tx.courseEnrollment.findUnique({ where: { userId_courseId: { userId, courseId: quiz.lesson.courseId } } });
            if (!enrolled)
                throw new ApiError("Hãy đăng ký khóa học trước khi nộp bài.", 403);
            const lp = await tx.lessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId: quiz.lesson.id } } });
            if (!lp || lp.step < 5)
                throw new ApiError("Hãy hoàn thành các phần trước khi làm bài kiểm tra.", 409);
        }
        if (new Set(answers.map(a => a.questionId)).size !== quiz.questionIds.length || answers.length !== quiz.questionIds.length || answers.some(a => !quiz.questionIds.includes(a.questionId)))
            throw new ApiError("Vui lòng trả lời đủ các câu hỏi trong bài.");
        const questions = await tx.question.findMany({ where: { id: { in: quiz.questionIds } } });
        if (!questions.length || questions.length !== quiz.questionIds.length)
            throw new ApiError("Bài kiểm tra thiếu câu hỏi. Vui lòng liên hệ quản trị viên.", 409);
        const results = questions.map(q => {
            const selected = answers.find(a => a.questionId === q.id)!.selected;
            if (selected < 0 || selected >= q.options.length)
                throw new ApiError("Đáp án không hợp lệ.");
            return { questionId: q.id, prompt: q.prompt, selected, correct: selected === q.correctAnswer, correctAnswer: q.correctAnswer, explanation: q.explanation, skill: q.skill, options: q.options };
        });
        const score = results.filter(r => r.correct).length, total = questions.length;
        const percent = Math.round(score / total * 100);
        const previous = await tx.quizAttempt.findFirst({ where: { userId, quizId } });
        let xp = previous ? 0 : score === total ? 30 : 20;
        if (quiz.lesson && percent < 60)
            xp = 0;
        const attempt = await tx.quizAttempt.create({ data: { userId, quizId, score, total, xp, answers: { create: results.map(({ questionId, selected, correct }) => ({ questionId, selected, correct })) } } });
        if (quiz.lesson && percent >= 60) {
            const existing = await tx.lessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId: quiz.lesson.id } } });
            if (!existing?.completed) {
                await tx.lessonProgress.upsert({ where: { userId_lessonId: { userId, lessonId: quiz.lesson.id } }, create: { userId, lessonId: quiz.lesson.id, step: 6, completed: true, completedAt: new Date() }, update: { step: 6, completed: true, completedAt: new Date() } });
                await tx.userProgress.update({ where: { userId }, data: { lessonsCompleted: { increment: 1 } } });
                if (previous)
                    xp = 20;
                await tx.quizAttempt.update({ where: { id: attempt.id }, data: { xp } });
            }
        }
        const skillScores: Record<string, number> = {};
        for (const skill of ["vocabulary", "grammar", "reading", "listening"]) {
            const r = results.filter(x => x.skill === skill);
            if (r.length)
                skillScores[skill] = Math.round(r.filter(x => x.correct).length / r.length * 100);
        }
        const progress = await tx.userProgress.findUnique({ where: { userId } });
        await tx.userProgress.update({ where: { userId }, data: { skillScores: { ...(progress?.skillScores as Record<string, number> || {}), ...skillScores } } });
        if (quiz.kind === "placement") {
            const level = cefrForScore(percent);
            await tx.profile.update({ where: { userId }, data: { level, placementComplete: true } });
            await tx.learningPlan.updateMany({ where: { userId }, data: { level } });
        }
        await reward(tx, userId, xp, "quiz", quiz.id);
        return { attemptId: attempt.id, score, total, percent, xp, results, skillScores, level: cefrForScore(percent), passed: percent >= 60 };
    }, { timeout: 15000 });
}
