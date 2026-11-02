import type { Prisma, PrismaClient } from "@prisma/client";
import { chinesePinyinReading } from "../src/lib/chinese-pinyin-reading";
import { chineseCourses, type ChineseCourse, type ChineseCourseTopic } from "./chinese-courses";

/** Stable content IDs are independent of the human-facing course/lesson order. */
export async function buildChineseCourseLesson(course: ChineseCourse, topic: ChineseCourseTopic, order: number) {
  const prefix = `${course.id}-${topic.id}`;
  const readingText = topic.lines.map(([text]) => text).join("");
  const translation = topic.lines.map(([, text]) => text).join(" ");
  const pinyin = await chinesePinyinReading(readingText);
  const vocabulary = topic.words.map(([word, savedPinyin, meaning, exampleIndex], index) => ({
    id: `${prefix}-v${index}`, language: "zh", word, pinyin: savedPinyin, ipa: "", meaning, definition: meaning,
    partOfSpeech: "từ/cụm từ", example: topic.lines[exampleIndex][0], translation: topic.lines[exampleIndex][1],
    category: course.category, level: course.level, synonyms: [], antonyms: [], collocations: [], wordFamily: [],
  }));
  const grammar = {
    id: `${prefix}-grammar`, language: "zh", title: topic.grammar, level: course.level,
    description: topic.note, structure: [topic.formula], examples: [topic.lines[topic.practiceLine ?? 0][0], ...topic.lines.filter((_, index) => index !== (topic.practiceLine ?? 0)).map(([text]) => text)],
    notes: `${topic.note}\nĐoạn học: ${readingText}\nPinyin hỗ trợ (tự động, giữ thanh gốc): ${pinyin}\n${translation}`,
    commonMistake: `${topic.note} Pinyin tự động có thể cần hiệu đính với từ đa âm; ưu tiên nghe mẫu và kiểm tra ngữ cảnh.`,
  };
  const listening = { id: `${prefix}-listening`, language: "zh", title: topic.title, level: course.level, topic: course.category, duration: 1, transcript: readingText, pinyin, translation };
  const reading = { id: `${prefix}-reading`, language: "zh", title: topic.title, level: course.level, category: course.category, minutes: 3, body: readingText, pinyin, translation };
  // Correct option is the first author-supplied choice, then rotated with a stable offset.
  const items = [
    { skill: "vocabulary", prompt: `“${topic.words[0][0]}” (${topic.words[0][1]}) nghĩa là gì?`, choices: topic.words.slice(0, 3).map((word) => word[2]), explanation: `${topic.words[0][0]} (${topic.words[0][1]}): ${topic.words[0][2]}. Ví dụ: ${vocabulary[0].example} — ${vocabulary[0].translation}` },
    { skill: "grammar", prompt: topic.grammarQuestion[0], choices: topic.grammarQuestion.slice(1), explanation: `Đáp án: ${topic.grammarQuestion[1]}\n${topic.formula}\n${topic.note}` },
    { skill: "reading", prompt: topic.readingQuestion[0], choices: topic.readingQuestion.slice(1), explanation: `Đáp án: ${topic.readingQuestion[1]}\n${readingText}\n${translation}` },
    { skill: "listening", prompt: "Câu đầu tiên của đoạn nghe nói điều gì?", choices: topic.lines.slice(0, 3).map(([, text]) => text), explanation: `Câu đầu: ${topic.lines[0][0]} — ${topic.lines[0][1]}\nPinyin đoạn nghe: ${pinyin}` },
  ];
  const questions = items.map((item, index) => {
    const shift = (order + index) % item.choices.length;
    const options = [...item.choices.slice(shift), ...item.choices.slice(0, shift)];
    return { id: `${prefix}-q${index}`, language: "zh", skill: item.skill, level: course.level, prompt: item.prompt, options,
      correctAnswer: options.indexOf(item.choices[0]), explanation: item.explanation,
      passage: item.skill === "reading" ? readingText : null,
      audioText: item.skill === "listening" ? readingText : null };
  });
  const lesson = { id: `${prefix}-lesson`, courseId: course.id, title: topic.title, description: `${topic.grammar}. ${topic.note}`, order,
    vocabularyIds: vocabulary.map((word) => word.id), grammarId: grammar.id, listeningId: listening.id, readingId: reading.id,
    questionIds: questions.map((question) => question.id), published: true };
  const quiz = { id: `quiz-${lesson.id}`, language: "zh", title: topic.title, kind: "lesson", lessonId: lesson.id, questionIds: lesson.questionIds };
  const speaking = { id: `${prefix}-speaking`, language: "zh", title: topic.title, level: course.level, text: readingText, pinyin,
    tip: "Nghe từng câu, giảm tốc độ nếu cần rồi đọc lại. Pinyin tự động giữ thanh gốc; độ khớp nhận dạng không phải điểm phát âm hay thanh điệu." };
  const writing = { id: `${prefix}-writing`, language: "zh", title: topic.title, type: course.level === "Trung cấp" ? "Viết đoạn tiếng Trung" : "Viết câu tiếng Trung", level: course.level,
    prompt: `Viết ${course.level === "Trung cấp" ? "4–5" : "2–3"} câu chữ Hán giản thể theo chủ đề “${topic.title}”. Luyện cấu trúc: ${topic.formula}. Gợi ý từ: ${topic.words.map(([word]) => word).join("、")}.`, minWords: course.level === "Trung cấp" ? 35 : 15 };
  return { vocabulary, grammar, listening, reading, questions, lesson, quiz, speaking, writing };
}

/** No learner-table writes. A transaction per course prevents partially published new courses. */
export async function seedChineseCourses(db: PrismaClient) {
  const questionIds: Record<string, string[]> = { vocabulary: [], grammar: [], reading: [], listening: [] };
  for (const course of chineseCourses) {
    const { topics, ...metadata } = course;
    const lessons = await Promise.all(topics.map((topic, index) => buildChineseCourseLesson(course, topic, index + 1)));
    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const data = { ...metadata, language: "zh", published: true, premium: false, duration: `${topics.length} bài · 15–20 phút/bài`, instructor: "EnglishMaster",
        description: `${course.outcomes.join(". ")}. Bài ngắn có chữ Hán giản thể, nghĩa Việt, Pinyin hỗ trợ, nghe, xếp câu và đọc hiểu. Nên học sau khóa Những bước đầu tiên; không phải giáo trình HSK chính thức.` };
      await tx.course.upsert({ where: { id: data.id }, create: data, update: data });
      for (const content of lessons) {
        const vocabularyIds: string[] = [];
        for (const word of content.vocabulary) {
          // Reuse imported or admin-edited words by their unique spelling. Keep IDs, reviews and edits intact.
          const saved = await tx.vocabulary.upsert({ where: { word: word.word }, create: word, update: {}, select: { id: true, language: true } });
          if (saved.language !== "zh") throw new Error(`Từ trong khóa tiếng Trung có ngôn ngữ không phù hợp: ${word.word}`);
          vocabularyIds.push(saved.id);
        }
        await tx.grammarLesson.upsert({ where: { id: content.grammar.id }, create: content.grammar, update: content.grammar });
        await tx.listeningLesson.upsert({ where: { id: content.listening.id }, create: content.listening, update: content.listening });
        await tx.readingArticle.upsert({ where: { id: content.reading.id }, create: content.reading, update: content.reading });
        for (const question of content.questions) await tx.question.upsert({ where: { id: question.id }, create: question, update: question });
        const lesson = { ...content.lesson, vocabularyIds };
        await tx.lesson.upsert({ where: { id: lesson.id }, create: lesson, update: lesson });
        await tx.quiz.upsert({ where: { id: content.quiz.id }, create: content.quiz, update: content.quiz });
        await tx.speakingExercise.upsert({ where: { id: content.speaking.id }, create: content.speaking, update: content.speaking });
        await tx.writingExercise.upsert({ where: { id: content.writing.id }, create: content.writing, update: content.writing });
      }
    }, { maxWait: 10000, timeout: 30000 });
    for (const content of lessons) for (const question of content.questions) questionIds[question.skill].push(question.id);
  }
  // Build level-specific HSK practice from the imported vocabulary catalog.
  // This dataset currently contains levels 1–5; do not label general Chinese
  // lessons as higher HSK levels without a matching syllabus and word bank.
  for (let hskLevel = 1; hskLevel <= 5; hskLevel++) {
    const level = `HSK ${hskLevel}`;
    const words = await db.vocabulary.findMany({
      where: { language: "zh", category: { startsWith: `${level} ·` } },
      orderBy: { word: "asc" },
      select: { id: true, word: true, pinyin: true, meaning: true, example: true },
    });
    if (!words.length) continue;
    const courseId = `chinese-hsk-${hskLevel}`;
    const chunks = Array.from({ length: Math.ceil(words.length / 40) }, (_, index) => words.slice(index * 40, (index + 1) * 40));
    const course = {
      id: courseId, language: "zh", title: `${level} · Từ vựng và thực hành`, level,
      category: `Lộ trình ${level}`, description: `Ôn từ vựng đúng cấp ${level} qua câu ví dụ, bài nghe, đọc hiểu và câu hỏi trắc nghiệm. Nội dung bám theo danh mục từ đang có trong hệ thống; đây là tài liệu học tham khảo, không thay thế giáo trình hay đề thi chính thức.`,
      duration: `${chunks.length} bài · 10–15 phút/bài`, rating: 0, instructor: "EnglishMaster",
      outcomes: [`Nhận biết từ vựng ${level}`, "Nghe và đọc ví dụ ngắn", "Luyện nhớ nghĩa qua câu hỏi"],
      color: ["green", "blue", "purple", "orange", "pink"][hskLevel - 1], icon: "book",
      published: true, premium: false,
    };
    await db.course.upsert({ where: { id: courseId }, create: course, update: course });
    for (const [chunkIndex, chunk] of chunks.entries()) {
      const prefix = `${courseId}-unit-${chunkIndex + 1}`;
      const questionWords = chunk.slice(0, Math.min(12, chunk.length));
      const questionIds: string[] = [];
      for (const [index, word] of questionWords.entries()) {
        const distractors = chunk.filter((candidate) => candidate.id !== word.id && candidate.meaning !== word.meaning).slice((index * 3) % Math.max(1, chunk.length - 1), (index * 3) % Math.max(1, chunk.length - 1) + 3);
        const choices = [word.meaning, ...distractors.map((candidate) => candidate.meaning)];
        const questionId = `${prefix}-q${index + 1}`;
        const question = {
          id: questionId, language: "zh", skill: "vocabulary", level,
          prompt: `“${word.word}”${word.pinyin ? ` (${word.pinyin})` : ""} có nghĩa là gì?`,
          options: choices, correctAnswer: 0,
          explanation: `${word.word}${word.pinyin ? ` (${word.pinyin})` : ""}: ${word.meaning}.${word.example ? `\nVí dụ: ${word.example}` : ""}`,
          passage: null, audioText: word.example || word.word,
        };
        await db.question.upsert({ where: { id: questionId }, create: question, update: question });
        questionIds.push(questionId);
      }
      const examples = chunk.map((word) => word.example).filter(Boolean).slice(0, 12);
      const pinyin = await chinesePinyinReading(examples.join(""));
      const listening = { id: `${prefix}-listening`, language: "zh", title: `${level} · Nghe ví dụ ${chunkIndex + 1}`, level, topic: course.category, duration: 2, transcript: examples.join(" "), pinyin, translation: "" };
      const reading = { id: `${prefix}-reading`, language: "zh", title: `${level} · Đọc ví dụ ${chunkIndex + 1}`, level, category: course.category, minutes: 3, body: examples.join("\n"), pinyin, translation: "" };
      await db.listeningLesson.upsert({ where: { id: listening.id }, create: listening, update: listening });
      await db.readingArticle.upsert({ where: { id: reading.id }, create: reading, update: reading });
      const lesson = {
        id: `${prefix}-lesson`, courseId, title: `Bài ${chunkIndex + 1} · ${level}`,
        description: `${chunk.length} từ vựng cấp ${level}; nghe và đọc câu ví dụ, sau đó làm ${questionIds.length} câu hỏi nghĩa từ.`,
        order: chunkIndex + 1, vocabularyIds: chunk.map((word) => word.id), grammarId: null,
        listeningId: listening.id, readingId: reading.id, questionIds, published: true,
      };
      await db.lesson.upsert({ where: { id: lesson.id }, create: lesson, update: lesson });
      const quiz = { id: `quiz-${lesson.id}`, language: "zh", title: lesson.title, kind: "lesson", lessonId: lesson.id, questionIds };
      await db.quiz.upsert({ where: { id: quiz.id }, create: quiz, update: quiz });
    }
  }
  return questionIds;
}
