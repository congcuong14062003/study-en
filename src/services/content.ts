import { db } from "@/lib/db";
import { ApiError } from "@/lib/security";
import { requireCourseAccess } from "./course-access";
export async function publicQuiz(id: string, userId?: string) {
    const quiz = await db.quiz.findUnique({ where: { id }, include: { lesson: { include: { course: true } } } });
    if (!quiz)
        throw new ApiError("Không tìm thấy bài kiểm tra.", 404);
    if (quiz.lesson && (!quiz.lesson.published || !quiz.lesson.course.published))
        throw new ApiError("Bài học chưa được xuất bản.", 404);
    if (quiz.lesson) {
        if (!userId)
            throw new ApiError("Cần đăng nhập.", 401);
        await requireCourseAccess(userId, quiz.lesson.courseId);
    }
    const questions = await db.question.findMany({ where: { id: { in: quiz.questionIds } }, select: { id: true, prompt: true, skill: true, level: true, options: true, passage: true, audioText: true } });
    return { id: quiz.id, title: quiz.title, kind: quiz.kind, questions: quiz.questionIds.map(id => questions.find(q => q.id === id)!).filter(Boolean) };
}
export type PublicQuiz = Awaited<ReturnType<typeof publicQuiz>>;
export async function lessonData(id: string, userId: string) {
    const lesson = await db.lesson.findFirst({ where: { id, published: true, course: { published: true } }, include: { course: { include: { lessons: { where: { published: true }, orderBy: { order: "asc" }, select: { id: true, title: true, order: true } } } } } });
    if (!lesson)
        throw new ApiError("Không tìm thấy bài học.", 404);
    await requireCourseAccess(userId, lesson.courseId);
    const [words, grammar, listening, reading, progress] = await Promise.all([db.vocabulary.findMany({ where: { id: { in: lesson.vocabularyIds } } }), lesson.grammarId ? db.grammarLesson.findUnique({ where: { id: lesson.grammarId } }) : null, lesson.listeningId ? db.listeningLesson.findUnique({ where: { id: lesson.listeningId } }) : null, lesson.readingId ? db.readingArticle.findUnique({ where: { id: lesson.readingId } }) : null, db.lessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId: id } } })]);
    return { lesson, words, grammar, listening, reading, progress, quiz: await publicQuiz(`quiz-${id}`, userId) };
}
export type LessonData = Awaited<ReturnType<typeof lessonData>>;
