import "dotenv/config";
import { Prisma, PrismaClient, Role } from "@prisma/client";

const db = new PrismaClient();
const USER_COUNT = 40;
const DAYS = 30;

function dateAgo(days: number, hour = 12) {
    const date = new Date();
    date.setUTCHours(hour, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - days);
    return date;
}

function dateKey(date: Date) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}

async function main() {
    if (!process.argv.includes("--confirm-cloud"))
        throw new Error("Pass --confirm-cloud to seed the configured remote database.");
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl)
        throw new Error("DATABASE_URL is missing.");
    const databaseHost = new URL(databaseUrl).hostname;
    if (["127.0.0.1", "localhost", "::1"].includes(databaseHost))
        throw new Error("Refusing to run the cloud test seed against a local database.");

    const [courses, lessons, vocabulary, quizzes, questions, achievements, writingExercises] = await Promise.all([
        db.course.findMany({ where: { published: true }, orderBy: { id: "asc" } }),
        db.lesson.findMany({ where: { published: true }, orderBy: [{ courseId: "asc" }, { order: "asc" }] }),
        db.vocabulary.findMany({ orderBy: { id: "asc" } }),
        db.quiz.findMany({ orderBy: { id: "asc" } }),
        db.question.findMany({ orderBy: { id: "asc" } }),
        db.achievement.findMany({ orderBy: { id: "asc" } }),
        db.writingExercise.findMany({ orderBy: { id: "asc" } }),
    ]);
    if (!courses.length || !lessons.length || !vocabulary.length || !quizzes.length || !questions.length)
        throw new Error("Curriculum is empty. Run the content seed before creating test activity.");

    const questionById = new Map(questions.map(question => [question.id, question]));
    const levels = ["A1", "A2", "B1", "B2", "C1"];
    const goals = ["Giao tiếp", "Công việc", "Du lịch", "Thi chứng chỉ"];
    const names = ["An", "Bình", "Chi", "Dũng", "Giang", "Hà", "Khánh", "Lan", "Minh", "Ngọc"];

    for (let index = 1; index <= USER_COUNT; index++) {
        const suffix = String(index).padStart(3, "0");
        const userId = `seed-user-${suffix}`;
        const premium = index % 3 === 0;
        const banned = index % 19 === 0;
        const level = levels[(index - 1) % levels.length];
        const goal = goals[(index - 1) % goals.length];
        const xp = 180 + index * 137;
        const completed = Math.min(lessons.length, 1 + (index % lessons.length));
        const userData = {
            name: `${names[(index - 1) % names.length]} Test ${suffix}`,
            role: premium ? Role.PREMIUM : Role.USER,
            banned,
            emailVerified: dateAgo(45 - (index % 20)),
        };
        await db.user.upsert({
            where: { email: `seed.student.${suffix}@englishmaster.test` },
            create: {
                id: userId,
                email: `seed.student.${suffix}@englishmaster.test`,
                passwordHash: null,
                createdAt: dateAgo(60 - index),
                ...userData,
            },
            update: userData,
        });
        await db.profile.upsert({
            where: { userId },
            create: {
                id: `seed-profile-${suffix}`,
                userId,
                username: `seed_student_${suffix}`,
                bio: `Học viên thử nghiệm ${suffix} cho dữ liệu dashboard.`,
                level,
                goal,
                dailyMinutes: 10 + (index % 6) * 10,
                reminderTime: `${18 + (index % 4)}:00`,
                publicLeaderboard: !banned && index % 4 !== 0,
                onboardingComplete: true,
                placementComplete: true,
            },
            update: { level, goal, publicLeaderboard: !banned && index % 4 !== 0, onboardingComplete: true, placementComplete: true },
        });
        await db.subscription.upsert({
            where: { userId },
            create: {
                id: `seed-subscription-${suffix}`,
                userId,
                plan: premium ? "PREMIUM" : "FREE",
                status: premium ? "active" : "inactive",
                providerId: premium ? `seed-provider-${suffix}` : null,
                currentPeriodEnd: premium ? dateAgo(-30) : null,
            },
            update: { plan: premium ? "PREMIUM" : "FREE", status: premium ? "active" : "inactive", currentPeriodEnd: premium ? dateAgo(-30) : null },
        });
        await db.userProgress.upsert({
            where: { userId },
            create: {
                id: `seed-progress-${suffix}`,
                userId,
                xp,
                streak: index % 15,
                longestStreak: 7 + (index % 30),
                lastStudyDate: dateKey(dateAgo(index % 3)),
                studySeconds: (900 + index * 73) * 60,
                lessonsCompleted: completed,
                wordsLearned: Math.min(vocabulary.length, 5 + index),
                skillScores: { vocabulary: 45 + index % 50, grammar: 40 + index % 55, listening: 35 + index % 60, speaking: 30 + index % 65, reading: 42 + index % 50, writing: 38 + index % 55 },
            },
            update: { xp, streak: index % 15, lessonsCompleted: completed, wordsLearned: Math.min(vocabulary.length, 5 + index) },
        });
        await db.learningPlan.upsert({
            where: { userId },
            create: {
                id: `seed-plan-${suffix}`,
                userId,
                level,
                goal,
                weeks: [{ week: 1, topic: "Daily routines" }, { week: 2, topic: "Work and study" }, { week: 3, topic: "Travel" }, { week: 4, topic: "Communication" }],
            },
            update: { level, goal },
        });
    }

    const enrollments: Prisma.CourseEnrollmentCreateManyInput[] = [];
    const lessonProgress: Prisma.LessonProgressCreateManyInput[] = [];
    const userVocabulary: Prisma.UserVocabularyCreateManyInput[] = [];
    const vocabularyReviews: Prisma.VocabularyReviewCreateManyInput[] = [];
    const attempts: Prisma.QuizAttemptCreateManyInput[] = [];
    const answers: Prisma.AnswerCreateManyInput[] = [];
    const userAchievements: Prisma.UserAchievementCreateManyInput[] = [];
    const sessions: Prisma.StudySessionCreateManyInput[] = [];
    const dailyGoals: Prisma.DailyGoalCreateManyInput[] = [];
    const notifications: Prisma.NotificationCreateManyInput[] = [];
    const favorites: Prisma.FavoriteCreateManyInput[] = [];
    const notes: Prisma.NoteCreateManyInput[] = [];
    const payments: Prisma.PaymentCreateManyInput[] = [];
    const conversations: Prisma.AIConversationCreateManyInput[] = [];
    const messages: Prisma.AIMessageCreateManyInput[] = [];
    const writingSubmissions: Prisma.WritingSubmissionCreateManyInput[] = [];

    for (let index = 1; index <= USER_COUNT; index++) {
        const suffix = String(index).padStart(3, "0");
        const userId = `seed-user-${suffix}`;
        const premium = index % 3 === 0;

        for (let courseIndex = 0; courseIndex < Math.min(courses.length, 1 + index % 3); courseIndex++) {
            const course = courses[(courseIndex + index) % courses.length];
            enrollments.push({ id: `seed-enrollment-${suffix}-${course.id}`, userId, courseId: course.id, createdAt: dateAgo(35 - courseIndex * 5) });
        }
        for (let lessonIndex = 0; lessonIndex < Math.min(lessons.length, 2 + index % 7); lessonIndex++) {
            const lesson = lessons[lessonIndex];
            const completed = lessonIndex < 1 + index % 5;
            lessonProgress.push({ id: `seed-lesson-progress-${suffix}-${lesson.id}`, userId, lessonId: lesson.id, step: completed ? 5 : 1 + index % 4, completed, completedAt: completed ? dateAgo(lessonIndex + index % 8) : null, updatedAt: dateAgo(lessonIndex) });
        }
        for (let wordIndex = 0; wordIndex < Math.min(vocabulary.length, 8 + index % 16); wordIndex++) {
            const word = vocabulary[(wordIndex + index) % vocabulary.length];
            userVocabulary.push({ id: `seed-user-word-${suffix}-${word.id}`, userId, vocabularyId: word.id, repetitions: wordIndex % 6, interval: wordIndex % 12, ease: 2.1 + (wordIndex % 5) / 10, dueAt: dateAgo((wordIndex % 7) - 3), lastReviewedAt: dateAgo(wordIndex % 10) });
            if (wordIndex < 5)
                vocabularyReviews.push({ id: `seed-review-${suffix}-${word.id}`, userId, vocabularyId: word.id, rating: ["again", "hard", "good", "easy"][(wordIndex + index) % 4], reviewedAt: dateAgo(wordIndex) });
        }
        for (let attemptIndex = 0; attemptIndex < Math.min(3, quizzes.length); attemptIndex++) {
            const quiz = quizzes[(attemptIndex + index) % quizzes.length];
            const selectedQuestionIds = quiz.questionIds.slice(0, 5);
            const attemptId = `seed-attempt-${suffix}-${attemptIndex}`;
            let score = 0;
            for (const [answerIndex, questionId] of selectedQuestionIds.entries()) {
                const question = questionById.get(questionId);
                if (!question)
                    continue;
                const correct = (answerIndex + index + attemptIndex) % 3 !== 0;
                const selected = correct ? question.correctAnswer : (question.correctAnswer + 1) % question.options.length;
                if (correct)
                    score++;
                answers.push({ id: `seed-answer-${suffix}-${attemptIndex}-${questionId}`, attemptId, questionId, selected, correct });
            }
            attempts.push({ id: attemptId, userId, quizId: quiz.id, score, total: selectedQuestionIds.length, xp: score * 10, createdAt: dateAgo(attemptIndex * 3 + index % 12) });
        }
        for (let day = 0; day < DAYS; day++) {
            const date = dateAgo(day);
            const active = (day + index) % 5 !== 0;
            const seconds = active ? (10 + ((day * 7 + index * 3) % 45)) * 60 : 0;
            dailyGoals.push({ id: `seed-goal-${suffix}-${day}`, userId, date: dateKey(date), targetMinutes: 20 + (index % 3) * 10, seconds, xp: Math.floor(seconds / 30) });
            if (active && day < 15)
                sessions.push({ id: `seed-session-${suffix}-${day}`, userId, kind: ["lesson", "speaking", "reading", "listening"][day % 4], resourceId: lessons[day % lessons.length].id, startedAt: date, endedAt: new Date(date.getTime() + seconds * 1000), seconds, xp: Math.floor(seconds / 30) });
        }
        achievements.slice(0, Math.min(achievements.length, 1 + index % 3)).forEach(achievement => userAchievements.push({ id: `seed-user-achievement-${suffix}-${achievement.id}`, userId, achievementId: achievement.id, unlockedAt: dateAgo(index % 20) }));
        notifications.push(
            { id: `seed-notification-${suffix}-1`, userId, title: "Mục tiêu hôm nay", body: "Bạn còn một bài học ngắn để hoàn thành mục tiêu.", type: "reminder", href: "/dashboard", read: index % 2 === 0, createdAt: dateAgo(0) },
            { id: `seed-notification-${suffix}-2`, userId, title: "Chuỗi học tập", body: `Bạn đang có chuỗi ${index % 15} ngày liên tiếp.`, type: "achievement", href: "/analytics", read: index % 3 === 0, createdAt: dateAgo(2) },
            { id: `seed-notification-${suffix}-3`, userId, title: "Từ vựng cần ôn", body: "Một số từ đã đến lịch ôn tập.", type: "review", href: "/vocabulary", read: false, createdAt: dateAgo(1) },
        );
        const favoriteWord = vocabulary[index % vocabulary.length];
        favorites.push({ id: `seed-favorite-${suffix}-word`, userId, type: "word", resourceId: favoriteWord.id, title: favoriteWord.word, href: `/dictionary?q=${encodeURIComponent(favoriteWord.word)}`, createdAt: dateAgo(index % 10) });
        notes.push(
            { id: `seed-note-${suffix}-1`, userId, title: "Cụm từ cần nhớ", content: "Ghi chú thử nghiệm về các cụm từ giao tiếp thường ngày.", tags: ["giao tiếp", "ôn tập"], resourceId: lessons[0].id, createdAt: dateAgo(5), updatedAt: dateAgo(1) },
            { id: `seed-note-${suffix}-2`, userId, title: "Kế hoạch tuần", content: "Hoàn thành hai bài học và ôn flashcard mỗi ngày.", tags: ["kế hoạch"], createdAt: dateAgo(3), updatedAt: dateAgo(0) },
        );
        if (premium)
            payments.push({ id: `seed-payment-${suffix}`, userId, providerId: `seed-payment-provider-${suffix}`, amount: 149000, currency: "VND", status: "paid", createdAt: dateAgo(index % 25) });
        const conversationId = `seed-conversation-${suffix}`;
        conversations.push({ id: conversationId, userId, title: "Coffee shop practice", scenario: "coffee-shop", difficulty: levels[(index - 1) % levels.length], correction: "balanced", createdAt: dateAgo(index % 7), updatedAt: dateAgo(index % 3) });
        messages.push(
            { id: `seed-message-${suffix}-1`, conversationId, role: "user", content: "Could I have a cup of coffee, please?", createdAt: dateAgo(index % 7) },
            { id: `seed-message-${suffix}-2`, conversationId, role: "assistant", content: "Of course. What kind of coffee would you like?", metadata: { corrected: false, level: levels[(index - 1) % levels.length] }, createdAt: dateAgo(index % 7) },
        );
        if (writingExercises.length) {
            const exercise = writingExercises[index % writingExercises.length];
            writingSubmissions.push({ id: `seed-writing-${suffix}`, userId, exerciseId: exercise.id, text: "I am learning English every day because I want to communicate confidently at work and while travelling.", analysis: { score: 72 + index % 20, strengths: ["clear meaning", "good vocabulary"], improvements: ["add more detail"] }, createdAt: dateAgo(index % 14) });
        }
    }

    const batches: Array<[string, Promise<{ count: number }>]> = [
        ["enrollments", db.courseEnrollment.createMany({ data: enrollments, skipDuplicates: true })],
        ["lesson progress", db.lessonProgress.createMany({ data: lessonProgress, skipDuplicates: true })],
        ["user vocabulary", db.userVocabulary.createMany({ data: userVocabulary, skipDuplicates: true })],
        ["vocabulary reviews", db.vocabularyReview.createMany({ data: vocabularyReviews, skipDuplicates: true })],
        ["quiz attempts", db.quizAttempt.createMany({ data: attempts, skipDuplicates: true })],
        ["achievements", db.userAchievement.createMany({ data: userAchievements, skipDuplicates: true })],
        ["study sessions", db.studySession.createMany({ data: sessions, skipDuplicates: true })],
        ["daily goals", db.dailyGoal.createMany({ data: dailyGoals, skipDuplicates: true })],
        ["notifications", db.notification.createMany({ data: notifications, skipDuplicates: true })],
        ["favorites", db.favorite.createMany({ data: favorites, skipDuplicates: true })],
        ["notes", db.note.createMany({ data: notes, skipDuplicates: true })],
        ["payments", db.payment.createMany({ data: payments, skipDuplicates: true })],
        ["AI conversations", db.aIConversation.createMany({ data: conversations, skipDuplicates: true })],
        ["writing submissions", db.writingSubmission.createMany({ data: writingSubmissions, skipDuplicates: true })],
    ];
    const results = await Promise.all(batches.map(async ([name, operation]) => [name, (await operation).count] as const));
    const attemptIds = new Set((await db.quizAttempt.findMany({ where: { id: { startsWith: "seed-attempt-" } }, select: { id: true } })).map(item => item.id));
    const validAnswers = answers.filter(answer => attemptIds.has(answer.attemptId));
    const conversationIds = new Set((await db.aIConversation.findMany({ where: { id: { startsWith: "seed-conversation-" } }, select: { id: true } })).map(item => item.id));
    const validMessages = messages.filter(message => conversationIds.has(message.conversationId));
    results.push(["quiz answers", (await db.answer.createMany({ data: validAnswers, skipDuplicates: true })).count]);
    results.push(["AI messages", (await db.aIMessage.createMany({ data: validMessages, skipDuplicates: true })).count]);

    const testUsers = await db.user.count({ where: { email: { startsWith: "seed.student." } } });
    const totalRows = results.reduce((sum, [, count]) => sum + count, 0);
    console.log(`Cloud test seed complete on ${databaseHost}: ${testUsers} test users, ${totalRows} new related rows.`);
    for (const [name, count] of results)
        console.log(`- ${name}: ${count}`);
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
}).finally(() => db.$disconnect());
