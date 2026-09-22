type LessonSeed = {
  id: string;
  courseId: string;
  order: number;
  title: string;
  description: string;
  vocabularyIds: string[];
  grammarId: string | null;
  listeningId: string | null;
  readingId: string | null;
  questionIds: string[];
};

/** Complete every course path to six short lessons without duplicating database ids. */
export function buildLearningPathLessons(courses: Array<{ id: string; title: string }>, lessons: LessonSeed[]) {
  return courses.flatMap(course => {
    const current = lessons.filter(lesson => lesson.courseId === course.id).sort((a, b) => a.order - b.order);
    if (!current.length || current.length >= 6) return [];

    return Array.from({ length: 6 - current.length }, (_, offset) => {
      const order = current.length + offset + 1;
      const first = current[(order - 1) % current.length];
      const second = current[order % current.length];
      const vocabularyIds = [...new Set([...first.vocabularyIds.slice(0, 2), ...second.vocabularyIds.slice(-2)])];
      const questionIds = [...new Set([...first.questionIds, ...second.questionIds])].slice(0, 4);
      const checkpoint = order === 6;
      return {
        id: `${course.id}-path-${order}`,
        courseId: course.id,
        order,
        title: checkpoint ? "Chinh phục chặng học" : "Luyện tập tương tác",
        description: checkpoint
          ? `Kết hợp từ vựng, cấu trúc và bốn kỹ năng để hoàn thành chặng ${course.title}.`
          : "Ghép từ, sắp xếp câu và dùng kiến thức vừa học trong tình huống thực tế.",
        vocabularyIds,
        grammarId: second.grammarId || first.grammarId,
        listeningId: second.listeningId || first.listeningId,
        readingId: second.readingId || first.readingId,
        questionIds,
      };
    });
  });
}

