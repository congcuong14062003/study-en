import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import * as content from "./content";
const db = new PrismaClient();
async function main() {
    for (const [index, item] of content.courses.entries()) {
        const { lessons: _, ...course } = item;
        const titles = ["English Communication A1", "English Communication A2", "Business English B1"];
        const data = { ...course, title: titles[index], color: ["blue", "purple", "orange"][index], icon: ["book", "messages", "briefcase"][index], published: true };
        await db.course.upsert({ where: { id: item.id }, create: data, update: data });
    }
    for (const v of content.vocabulary)
        await db.vocabulary.upsert({ where: { id: v.id }, create: v, update: v });
    for (const g of content.grammar)
        await db.grammarLesson.upsert({ where: { id: g.id }, create: g, update: g });
    for (const l of content.listening)
        await db.listeningLesson.upsert({ where: { id: l.id }, create: l, update: l });
    for (const r of content.reading)
        await db.readingArticle.upsert({ where: { id: r.id }, create: r, update: r });
    for (const q of content.questions)
        await db.question.upsert({ where: { id: q.id }, create: q, update: q });
    for (const lesson of content.lessons) {
        await db.lesson.upsert({ where: { id: lesson.id }, create: lesson, update: lesson });
        await db.quiz.upsert({ where: { id: `quiz-${lesson.id}` }, create: { id: `quiz-${lesson.id}`, title: lesson.title, lessonId: lesson.id, kind: "lesson", questionIds: lesson.questionIds }, update: { questionIds: lesson.questionIds } });
    }
    const placementIds = content.questions.filter((_, i) => i % 2 === 0).map(q => q.id);
    await db.quiz.upsert({ where: { id: "placement" }, create: { id: "placement", title: "Kiểm tra trình độ tiếng Anh", kind: "placement", questionIds: placementIds }, update: { questionIds: placementIds } });
    for (const skill of ["vocabulary", "grammar", "listening", "reading"]) {
        const ids = content.questions.filter(q => q.skill === skill).map(q => q.id);
        await db.quiz.upsert({ where: { id: `practice-${skill}` }, create: { id: `practice-${skill}`, title: `Luyện tập ${skill}`, questionIds: ids }, update: { questionIds: ids } });
    }
    const badges = [{ id: "first-lesson", title: "Bước chân đầu tiên", description: "Hoàn thành bài học đầu tiên", icon: "graduation" }, { id: "streak-7", title: "Một tuần bền bỉ", description: "Học liên tục 7 ngày", icon: "flame" }, { id: "streak-30", title: "Thói quen tuyệt vời", description: "Học liên tục 30 ngày", icon: "flame" }, { id: "vocabulary-30", title: "Người sưu tầm từ", description: "Học 30 từ vựng", icon: "book" }, { id: "lessons-100", title: "Không ngừng tiến bộ", description: "Hoàn thành 100 bài học", icon: "trophy" }, { id: "words-1000", title: "Vocabulary Master", description: "Học 1.000 từ vựng", icon: "book" }, { id: "speaking-star", title: "Speaking Star", description: "Hoàn thành 10 buổi luyện nói", icon: "mic" }, { id: "grammar-master", title: "Grammar Master", description: "Đạt điểm tối đa bài luyện ngữ pháp", icon: "star" }];
    for (const a of badges)
        await db.achievement.upsert({ where: { id: a.id }, create: a, update: a });
    for (const [i, type] of ["Write a sentence", "Write an email", "Write a paragraph", "Write an essay", "IELTS Writing"].entries()) {
        const prompts = ["Write three sentences about your morning routine.", "Write an email to a colleague asking to reschedule a meeting. Explain why and suggest a new time.", "Describe a place you would like to visit and explain why.", "Some people prefer working from home. Discuss the benefits and challenges and give your opinion.", "Some people believe public transport should be free. To what extent do you agree or disagree?"];
        await db.writingExercise.upsert({ where: { id: `writing-${i + 1}` }, create: { id: `writing-${i + 1}`, title: type, type, level: ["A1", "A2", "B1", "B2", "C1"][i], prompt: prompts[i], minWords: [15, 60, 100, 180, 250][i] }, update: {} });
    }
    for (const [i, text] of ["I usually wake up at seven o'clock.", "Could I have a cup of coffee, please?", "I'd like to book a room for two nights.", "We should discuss the deadline at our next meeting.", "Learning a language opens the door to new possibilities."].entries())
        await db.speakingExercise.upsert({ where: { id: `speaking-${i + 1}` }, create: { id: `speaking-${i + 1}`, title: ["Daily routines", "At the coffee shop", "At the hotel", "In a meeting", "New possibilities"][i], level: i < 2 ? "A1" : i < 4 ? "A2" : "B1", text, tip: "Nghe cả câu, chú ý trọng âm và đọc theo từng cụm. Thử lại chậm hơn nếu cần." }, update: {} });
    if (process.env.DEMO_PASSWORD) {
        const passwordHash = await hash(process.env.DEMO_PASSWORD, 12);
        for (const email of ["demo@englishmaster.vn", "admin@englishmaster.vn"]) {
            const admin = email.startsWith("admin");
            await db.user.upsert({ where: { email }, create: { email, name: admin ? "Quản trị EnglishMaster" : "Nguyễn Văn Anh", passwordHash, role: admin ? "ADMIN" : "USER", profile: { create: { level: "B1", goal: "Giao tiếp", onboardingComplete: true, placementComplete: true, publicLeaderboard: !admin } }, progress: { create: {} }, subscription: { create: {} }, learningPlan: { create: { goal: "Giao tiếp", level: "B1", weeks: [{ week: 1, topic: "Daily routines" }, { week: 2, topic: "Family & friends" }, { week: 3, topic: "Work & study" }, { week: 4, topic: "Travel & experiences" }] } } }, update: {} });
        }
        const demo = await db.user.findUniqueOrThrow({ where: { email: "demo@englishmaster.vn" } });
        const already = await db.courseEnrollment.count({ where: { userId: demo.id } });
        if (!already) {
            await db.courseEnrollment.create({ data: { userId: demo.id, courseId: "english-a2" } });
            await db.lessonProgress.create({ data: { userId: demo.id, lessonId: "a2-1", step: 2 } });
            const times = [22, 35, 18, 42, 28, 16, 14];
            for (let i = 0; i < 7; i++) {
                const date = new Date(Date.now() - (6 - i) * 86400000);
                const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(date);
                await db.dailyGoal.create({ data: { userId: demo.id, date: key, targetMinutes: 20, seconds: times[i] * 60, xp: times[i] * 2 } });
                await db.studySession.create({ data: { userId: demo.id, kind: "demo-history", resourceId: "seed", startedAt: date, endedAt: date, seconds: times[i] * 60, xp: times[i] * 2 } });
            }
            await db.userProgress.update({ where: { userId: demo.id }, data: { xp: 2450, streak: 7, longestStreak: 7, lastStudyDate: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date()), studySeconds: 175 * 60, wordsLearned: 8, skillScores: { vocabulary: 75, grammar: 60, listening: 45, speaking: 55, reading: 68, writing: 40 } } });
            for (const w of content.vocabulary.slice(0, 8))
                await db.userVocabulary.create({ data: { userId: demo.id, vocabularyId: w.id, dueAt: new Date() } });
            await db.userAchievement.create({ data: { userId: demo.id, achievementId: "streak-7" } });
            await db.notification.create({ data: { userId: demo.id, type: "reminder", title: "Một chút tiếng Anh cho hôm nay", body: "Dành 20 phút để giữ nhịp học và tiến gần hơn đến mục tiêu của bạn.", href: "/lessons/a2-1" } });
        }
    }
    console.log("Seed complete: 3 courses, 12 lessons, 36 words, 17 grammar topics, 5 listening, 5 reading, 60 questions.");
}
main().catch(e => {
    console.error(e);
    process.exitCode = 1;
}).finally(() => db.$disconnect());
