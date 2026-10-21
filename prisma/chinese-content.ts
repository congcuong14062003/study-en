import type { PrismaClient } from "@prisma/client";
type Word = [string, string, string, string, string];
export const chineseTopics: { id: string; title: string; grammar: string; formula: string; reading: string; pinyin: string; translation: string; question: string; options: string[]; words: Word[] }[] = [
  { id: "greetings", title: "你好 · Chào hỏi và lịch sự", grammar: "Những lời chào đầu tiên", formula: "你好！ / 谢谢！ / 再见！", reading: "你好！谢谢你。再见！", pinyin: "Nǐ hǎo! Xièxie nǐ. Zàijiàn!", translation: "Xin chào! Cảm ơn bạn. Tạm biệt!", question: "Người nói nói gì trước tiên?", options: ["Xin chào", "Chúc ngủ ngon", "Tôi đói"], words: [
    ["你好", "nǐ hǎo", "xin chào", "你好！", "Xin chào!"], ["谢谢", "xièxie", "cảm ơn", "谢谢你。", "Cảm ơn bạn."], ["再见", "zàijiàn", "tạm biệt", "老师，再见！", "Thưa thầy/cô, tạm biệt!"], ["对不起", "duìbuqǐ", "xin lỗi", "对不起！", "Xin lỗi!"],
  ] },
  { id: "introductions", title: "我叫… · Giới thiệu bản thân", grammar: "Giới thiệu với 叫 và 是", formula: "我叫 + tên。 / 我是 + vai trò。", reading: "我叫小明。我是学生。", pinyin: "Wǒ jiào Xiǎomíng. Wǒ shì xuésheng.", translation: "Tôi tên là Tiểu Minh. Tôi là học sinh.", question: "Tiểu Minh là ai?", options: ["Học sinh", "Bác sĩ", "Đầu bếp"], words: [
    ["我", "wǒ", "tôi", "我是学生。", "Tôi là học sinh."], ["你", "nǐ", "bạn", "你叫什么名字？", "Bạn tên là gì?"], ["叫", "jiào", "gọi; tên là", "我叫小明。", "Tôi tên là Tiểu Minh."], ["学生", "xuésheng", "học sinh; sinh viên", "她是学生。", "Cô ấy là học sinh/sinh viên."],
  ] },
  { id: "numbers", title: "一、二、三 · Số đếm đầu tiên", grammar: "Đếm với lượng từ 个", formula: "Số + 个 + danh từ", reading: "我有一个苹果。你有两个苹果。", pinyin: "Wǒ yǒu yí ge píngguǒ. Nǐ yǒu liǎng ge píngguǒ.", translation: "Tôi có một quả táo. Bạn có hai quả táo.", question: "Người nói có bao nhiêu quả táo?", options: ["Một quả", "Hai quả", "Ba quả"], words: [
    ["一", "yī", "một", "我有一个苹果。", "Tôi có một quả táo."], ["二", "èr", "hai (số đếm)", "一、二、三。", "Một, hai, ba."], ["三", "sān", "ba", "我有三个苹果。", "Tôi có ba quả táo."], ["个", "ge", "lượng từ thông dụng", "一个人。", "Một người."],
  ] },
  { id: "family", title: "我的家 · Gia đình", grammar: "Nói về sở hữu với 的", formula: "Đại từ + 的 + danh từ", reading: "这是我的爸爸。那是我的妈妈。", pinyin: "Zhè shì wǒ de bàba. Nà shì wǒ de māma.", translation: "Đây là bố của tôi. Kia là mẹ của tôi.", question: "Người được giới thiệu đầu tiên là ai?", options: ["Bố", "Mẹ", "Chị gái"], words: [
    ["爸爸", "bàba", "bố", "这是我的爸爸。", "Đây là bố của tôi."], ["妈妈", "māma", "mẹ", "那是我的妈妈。", "Kia là mẹ của tôi."], ["哥哥", "gēge", "anh trai", "我有一个哥哥。", "Tôi có một người anh trai."], ["姐姐", "jiějie", "chị gái", "她是我的姐姐。", "Cô ấy là chị gái của tôi."],
  ] },
  { id: "food", title: "我想喝茶 · Đồ ăn, thức uống", grammar: "Diễn đạt mong muốn với 想", formula: "Chủ ngữ + 想 + động từ + tân ngữ", reading: "我想喝茶。妈妈想吃米饭。", pinyin: "Wǒ xiǎng hē chá. Māma xiǎng chī mǐfàn.", translation: "Tôi muốn uống trà. Mẹ muốn ăn cơm.", question: "Người nói muốn uống gì?", options: ["Trà", "Nước", "Cà phê"], words: [
    ["水", "shuǐ", "nước", "我喝水。", "Tôi uống nước."], ["茶", "chá", "trà", "我想喝茶。", "Tôi muốn uống trà."], ["米饭", "mǐfàn", "cơm", "我想吃米饭。", "Tôi muốn ăn cơm."], ["苹果", "píngguǒ", "quả táo", "我吃苹果。", "Tôi ăn táo."],
  ] },
  { id: "time", title: "现在几点？ · Ngày và giờ", grammar: "Nói giờ với 点", formula: "现在 + số + 点。", reading: "现在三点。今天我学习中文。", pinyin: "Xiànzài sān diǎn. Jīntiān wǒ xuéxí Zhōngwén.", translation: "Bây giờ là ba giờ. Hôm nay tôi học tiếng Trung.", question: "Bây giờ là mấy giờ?", options: ["Ba giờ", "Một giờ", "Hai giờ"], words: [
    ["今天", "jīntiān", "hôm nay", "今天我学习中文。", "Hôm nay tôi học tiếng Trung."], ["明天", "míngtiān", "ngày mai", "明天见！", "Hẹn gặp ngày mai!"], ["现在", "xiànzài", "bây giờ", "现在三点。", "Bây giờ là ba giờ."], ["点", "diǎn", "giờ; điểm", "现在两点。", "Bây giờ là hai giờ."],
  ] },
];
export async function seedChinese(db: PrismaClient) {
  const course = { id: "chinese-starter", language: "zh", title: "Tiếng Trung giản thể · Những bước đầu tiên", level: "Nhập môn", category: "Giao tiếp", description: "Sáu chủ đề nhập môn với chữ Hán giản thể, Pinyin và nghĩa tiếng Việt. Ghép từ, xếp câu, nghe, nói và đọc; không phải khóa luyện thi HSK đầy đủ.", duration: "6 bài ngắn", instructor: "EnglishMaster", outcomes: ["Chào hỏi lịch sự", "Giới thiệu bản thân", "Nhận biết số đếm, gia đình và thời gian"], color: "green", icon: "messages", published: true, premium: false };
  await db.course.upsert({ where: { id: course.id }, create: course, update: course });
  const allIds: Record<string, string[]> = { vocabulary: [], grammar: [], reading: [], listening: [] };
  for (const [index, topic] of chineseTopics.entries()) {
    const grammarExercises = [
      { prompt: "Cách chào lịch sự khi gặp một người là gì?", options: ["你好！", "再见！", "对不起！"] },
      { prompt: "Điền từ còn thiếu: 我____小明。 (Tôi tên là Tiểu Minh.)", options: ["叫", "是", "你"] },
      { prompt: "Cách nói tự nhiên cho ‘hai quả táo’ là gì?", options: ["两个苹果", "二个苹果", "两苹果"] },
      { prompt: "Điền từ sở hữu: 这是我____爸爸。", options: ["的", "个", "点"] },
      { prompt: "Chọn thứ tự từ đúng cho ‘Tôi muốn uống trà’.", options: ["我想喝茶。", "我喝想茶。", "我茶喝想。"] },
      { prompt: "Điền từ chỉ giờ: 现在三____。", options: ["点", "个", "的"] },
    ];
    const grammarExercise = grammarExercises[index];
    const prefix = `zh-${topic.id}`;
    const vocabularyIds: string[] = [];
    for (const [n, [word, pinyin, meaning, example, translation]] of topic.words.entries()) {
      const item = { id: `${prefix}-v${n}`, language: "zh", word, pinyin, ipa: "", meaning, definition: meaning, partOfSpeech: "từ/cụm từ", example, translation, category: topic.title, level: "Nhập môn", synonyms: [], antonyms: [], collocations: [], wordFamily: [] };
      await db.vocabulary.upsert({ where: { id: item.id }, create: item, update: item }); vocabularyIds.push(item.id);
    }
    const grammar = { id: `${prefix}-grammar`, language: "zh", title: topic.grammar, level: "Nhập môn", description: topic.translation, structure: [topic.formula], examples: [topic.reading.match(/[^。！？]+[。！？]/u)?.[0] || topic.reading], notes: `Pinyin đoạn học: ${topic.pinyin}`, commonMistake: topic.id === "numbers" ? "Trước lượng từ 个, số hai thường dùng 两 (liǎng), không dùng 二 (èr). 一 có thể đổi thanh khi đọc trong câu." : "Chú ý thứ tự từ và thanh điệu. Pinyin hỗ trợ đọc; chữ Hán không dùng khoảng trắng để tách từ." };
    const listening = { id: `${prefix}-listening`, language: "zh", title: topic.title, level: "Nhập môn", topic: topic.title, duration: 1, transcript: topic.reading, pinyin: topic.pinyin, translation: topic.translation };
    const reading = { id: `${prefix}-reading`, language: "zh", title: topic.title, level: "Nhập môn", category: "Cuộc sống", minutes: 2, body: topic.reading, pinyin: topic.pinyin, translation: topic.translation };
    await db.grammarLesson.upsert({ where: { id: grammar.id }, create: grammar, update: grammar });
    await db.listeningLesson.upsert({ where: { id: listening.id }, create: listening, update: listening });
    await db.readingArticle.upsert({ where: { id: reading.id }, create: reading, update: reading });
    const questionIds: string[] = [];
    for (const [n, skill] of ["vocabulary", "grammar", "reading", "listening"].entries()) {
      const options = skill === "vocabulary" ? [topic.words[0][2], topic.words[1][2], topic.words[2][2]] : skill === "grammar" ? grammarExercise.options : topic.options;
      const shift = index % options.length;
      const rotated = [...options.slice(shift), ...options.slice(0, shift)];
      const q = { id: `${prefix}-q${n}`, language: "zh", skill, level: "Nhập môn", prompt: skill === "vocabulary" ? `“${topic.words[0][0]}” (${topic.words[0][1]}) nghĩa là gì?` : skill === "grammar" ? grammarExercise.prompt : topic.question, options: rotated, correctAnswer: rotated.indexOf(options[0]), explanation: skill === "vocabulary" ? `${topic.words[0][0]} (${topic.words[0][1]}): ${topic.words[0][2]}.` : skill === "grammar" ? `${topic.grammar}: ${topic.formula}. Đáp án: ${options[0]}.` : `${topic.reading}\nPinyin: ${topic.pinyin}\n${topic.translation}`, passage: skill === "listening" || skill === "vocabulary" || skill === "grammar" ? null : topic.reading, audioText: skill === "listening" ? topic.reading : null };
      await db.question.upsert({ where: { id: q.id }, create: q, update: q }); questionIds.push(q.id); allIds[skill].push(q.id);
    }
    const lesson = { id: `${prefix}-lesson`, courseId: course.id, title: topic.title, description: `${topic.grammar}. Học qua Pinyin, nghe và ngữ cảnh ngắn.`, order: index + 1, vocabularyIds, grammarId: grammar.id, listeningId: listening.id, readingId: reading.id, questionIds, published: true };
    await db.lesson.upsert({ where: { id: lesson.id }, create: lesson, update: lesson });
    const quiz = { id: `quiz-${lesson.id}`, language: "zh", title: topic.title, kind: "lesson", lessonId: lesson.id, questionIds };
    await db.quiz.upsert({ where: { id: quiz.id }, create: quiz, update: quiz });
    const speaking = { id: `${prefix}-speaking`, language: "zh", title: topic.title, level: "Nhập môn", text: topic.reading, pinyin: topic.pinyin, tip: "Nghe chậm, đọc theo Pinyin và chú ý thanh điệu. Điểm khớp lời nhận dạng không phải điểm phát âm." };
    await db.speakingExercise.upsert({ where: { id: speaking.id }, create: speaking, update: speaking });
    const writing = { id: `${prefix}-writing`, language: "zh", title: topic.title, type: "Viết câu tiếng Trung", level: "Nhập môn", prompt: `Viết 2–3 câu bằng chữ Hán giản thể theo chủ đề “${topic.title}”. Gợi ý: ${topic.words.map((v) => v[0]).join("、")}.`, minWords: 10 };
    await db.writingExercise.upsert({ where: { id: writing.id }, create: writing, update: writing });
  }
  for (const [skill, questionIds] of Object.entries(allIds)) {
    const quiz = { id: `practice-zh-${skill}`, language: "zh", title: `Tiếng Trung · ${skill}`, kind: "practice", questionIds };
    await db.quiz.upsert({ where: { id: quiz.id }, create: quiz, update: quiz });
  }
}
