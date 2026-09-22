// Additional production-style learning tracks and vocabulary.
// Kept separate from the core demo content so the seed remains easy to audit.

type ModuleSeed = {
  title: string;
  description: string;
  vocabularyIds: string[];
  grammarId: string;
  listeningId: string;
  readingId: string;
  questionIds: string[];
};

type TrackSeed = {
  id: string;
  title: string;
  level: string;
  category: string;
  description: string;
  duration: string;
  rating: number;
  instructor: string;
  outcomes: string[];
  color: string;
  icon: string;
  premium?: boolean;
  modules: ModuleSeed[];
};

const module = (
  title: string,
  description: string,
  vocabularyIds: string[],
  grammarId: string,
  listeningId: string,
  readingId: string,
  questionIds: string[],
): ModuleSeed => ({ title, description, vocabularyIds, grammarId, listeningId, readingId, questionIds });

const tracks: TrackSeed[] = [
  {
    id: "pronunciation-a1", title: "Phát âm chuẩn từ đầu A1", level: "A1", category: "Phát âm", duration: "3 tuần", rating: 4.9, color: "purple", icon: "mic",
    instructor: "Cô Linh · Pronunciation Coach", premium: false,
    description: "Làm chủ những âm cơ bản, trọng âm từ và nhịp câu để nói rõ ràng hơn ngay từ ngày đầu.",
    outcomes: ["Nhận biết và tạo đúng các âm cơ bản", "Đặt trọng âm đúng trong từ quen thuộc", "Đọc câu ngắn có nhịp tự nhiên"],
    modules: [
      module("Âm và khẩu hình đầu tiên", "Luyện khẩu hình, nghe và phân biệt những cặp âm thường gây nhầm.", ["vx01", "vx02", "vx03", "vx04"], "g01", "l01", "r01", ["q03", "q04", "q09"]),
      module("Trọng âm trong từ", "Nghe, đánh dấu và phát âm trọng âm của từ hai và ba âm tiết.", ["vx05", "vx06", "vx07", "vx08"], "g02", "l01", "r01", ["q01", "q05", "q10"]),
      module("Nối âm trong câu ngắn", "Tạo dòng âm liền mạch trong lời chào và hội thoại hằng ngày.", ["vx09", "vx10", "vx11", "vx12"], "g03", "l01", "r01", ["q02", "q06", "q08"]),
      module("Nói rõ và tự nhiên", "Tổng hợp âm, trọng âm và ngữ điệu trong một đoạn giới thiệu ngắn.", ["vx13", "vx14", "vx15", "vx16"], "g04", "l01", "r01", ["q04", "q07", "q10"]),
    ],
  },
  {
    id: "daily-conversation-a2", title: "Giao tiếp đời thường A2", level: "A2", category: "Giao tiếp", duration: "4 tuần", rating: 4.8, color: "blue", icon: "messages",
    instructor: "Thầy Minh · Communication Coach", premium: false,
    description: "Phản xạ tự nhiên trong các tình huống ăn uống, mua sắm, hẹn gặp và trò chuyện cùng bạn bè.",
    outcomes: ["Bắt đầu và duy trì hội thoại ngắn", "Đưa ra lời mời và phản hồi lịch sự", "Xử lý các tình huống dịch vụ phổ biến"],
    modules: [
      module("Small talk mỗi ngày", "Mở đầu cuộc trò chuyện, hỏi thăm và tìm chủ đề chung.", ["vx01", "vx04", "vx14", "vx16"], "g05", "l02", "r02", ["q11", "q14", "q18"]),
      module("Tại quán ăn", "Gọi món, hỏi thành phần và xử lý một yêu cầu đặc biệt.", ["vx17", "vx18", "vx19", "vx20"], "g05", "l02", "r02", ["q12", "q15", "q20"]),
      module("Mua sắm thông minh", "Hỏi kích cỡ, so sánh sản phẩm và yêu cầu đổi trả.", ["vx21", "vx22", "vx23", "vx24"], "g08", "l02", "r02", ["q12", "q15", "q17"]),
      module("Hẹn gặp và thay đổi kế hoạch", "Sắp xếp thời gian, xác nhận và đề xuất phương án khác.", ["vx05", "vx07", "vx15", "vx24"], "g07", "l02", "r02", ["q16", "q18", "q19"]),
    ],
  },
  {
    id: "travel-a2", title: "Tiếng Anh du lịch A2", level: "A2", category: "Du lịch", duration: "4 tuần", rating: 4.9, color: "orange", icon: "plane",
    instructor: "EnglishMaster Travel Lab", premium: false,
    description: "Tự tin từ lúc đặt phòng, ra sân bay đến khi hỏi đường và khám phá một thành phố mới.",
    outcomes: ["Làm thủ tục tại sân bay và khách sạn", "Hỏi đường và hiểu chỉ dẫn", "Giải quyết thay đổi đơn giản trong chuyến đi"],
    modules: [
      module("Chuẩn bị hành trình", "Đặt vé, đọc lịch trình và chuẩn bị giấy tờ cần thiết.", ["vx25", "vx26", "vx27", "vx28"], "g07", "l02", "r02", ["q13", "q17", "q19"]),
      module("Sân bay và chuyến bay", "Làm thủ tục, tìm cổng và hỏi về hành lý.", ["vx29", "vx30", "vx31", "vx32"], "g09", "l02", "r02", ["q13", "q14", "q19"]),
      module("Khách sạn và lưu trú", "Nhận phòng, mô tả vấn đề và yêu cầu hỗ trợ.", ["vx25", "vx28", "vx31", "vx32"], "g06", "l02", "r02", ["q11", "q16", "q20"]),
      module("Khám phá thành phố", "Hỏi đường, dùng phương tiện công cộng và xin gợi ý địa điểm.", ["vx26", "vx27", "vx29", "vx30"], "g08", "l02", "r02", ["q15", "q17", "q18"]),
    ],
  },
  {
    id: "workplace-b1", title: "Giao tiếp công sở B1", level: "B1", category: "Công việc", duration: "5 tuần", rating: 4.9, color: "purple", icon: "briefcase",
    instructor: "Ms. Hannah · Business English", premium: false,
    description: "Viết email, tham gia cuộc họp và phối hợp công việc bằng ngôn ngữ chuyên nghiệp, rõ ràng.",
    outcomes: ["Viết email ngắn đúng giọng điệu", "Cập nhật tiến độ trong cuộc họp", "Đưa ra và phản hồi góp ý"],
    modules: [
      module("Email rõ ràng, chuyên nghiệp", "Viết tiêu đề, yêu cầu và lời kết phù hợp với bối cảnh.", ["vx33", "vx34", "vx35", "vx36"], "g10", "l03", "r04", ["q21", "q23", "q28"]),
      module("Cuộc họp hiệu quả", "Nêu mục tiêu, làm rõ ý và chốt bước tiếp theo.", ["vx37", "vx38", "vx39", "vx40"], "g12", "l03", "r04", ["q22", "q25", "q29"]),
      module("Phản hồi xây dựng", "Ghi nhận điểm tốt và đề xuất cải thiện một cách tôn trọng.", ["vx33", "vx36", "vx39", "vx40"], "g11", "l03", "r03", ["q21", "q24", "q27"]),
      module("Thuyết phục và đồng thuận", "Trình bày lý do, xử lý khác biệt và đi đến quyết định.", ["vx34", "vx35", "vx37", "vx38"], "g13", "l03", "r04", ["q24", "q26", "q30"]),
    ],
  },
  {
    id: "technology-b1", title: "English for Technology B1", level: "B1", category: "Công nghệ", duration: "4 tuần", rating: 4.8, color: "blue", icon: "laptop",
    instructor: "EnglishMaster Tech Lab", premium: false,
    description: "Từ vựng và mẫu câu thiết yếu để mô tả sản phẩm, báo lỗi và làm việc trong nhóm công nghệ.",
    outcomes: ["Mô tả tính năng và luồng sử dụng", "Báo lỗi có đủ ngữ cảnh", "Trao đổi ưu tiên với đồng đội"],
    modules: [
      module("Sản phẩm và người dùng", "Mô tả nhu cầu, tính năng và trải nghiệm sử dụng.", ["vx41", "vx42", "vx43", "vx44"], "g12", "l03", "r04", ["q21", "q22", "q26"]),
      module("Báo lỗi rõ ràng", "Mô tả bước tái hiện, kết quả mong đợi và ảnh hưởng.", ["vx45", "vx46", "vx47", "vx48"], "g13", "l03", "r04", ["q23", "q25", "q28"]),
      module("Lập kế hoạch sprint", "Trao đổi phạm vi, ước lượng và ưu tiên công việc.", ["vx41", "vx44", "vx47", "vx48"], "g11", "l03", "r04", ["q24", "q29", "q30"]),
      module("Demo sản phẩm", "Giới thiệu vấn đề, giải pháp và giá trị trong một demo ngắn.", ["vx42", "vx43", "vx45", "vx46"], "g10", "l03", "r03", ["q22", "q26", "q27"]),
    ],
  },
  {
    id: "speaking-confidence-b1", title: "Speaking Confidence B1", level: "B1", category: "Luyện nói", duration: "4 tuần", rating: 4.9, color: "orange", icon: "mic",
    instructor: "Cô Linh · Speaking Coach", premium: true,
    description: "Xây phản xạ, kể chuyện mạch lạc và nói tự tin hơn qua thử thách ngắn mỗi ngày.",
    outcomes: ["Nói liền mạch trong 2–3 phút", "Kể một câu chuyện có trình tự", "Tự sửa lỗi phổ biến khi nói"],
    modules: [
      module("Phản xạ không dịch", "Dùng cụm từ quen thuộc để trả lời nhanh và tự nhiên.", ["vx01", "vx07", "vx13", "vx16"], "g10", "l03", "r03", ["q21", "q23", "q28"]),
      module("Kể một câu chuyện", "Sắp xếp bối cảnh, sự kiện và kết quả theo trình tự rõ ràng.", ["vx05", "vx09", "vx14", "vx15"], "g06", "l03", "r03", ["q24", "q27", "q30"]),
      module("Nêu quan điểm", "Đưa ra ý kiến, lý do và ví dụ mà không bị ngắt quãng.", ["vx37", "vx38", "vx39", "vx40"], "g11", "l03", "r04", ["q22", "q26", "q29"]),
      module("Thử thách nói 3 phút", "Kết hợp phản xạ, phát âm và cấu trúc để hoàn thành bài nói.", ["vx33", "vx35", "vx41", "vx43"], "g12", "l03", "r04", ["q23", "q25", "q30"]),
    ],
  },
  {
    id: "ielts-foundation-b2", title: "IELTS Foundation B2", level: "B2", category: "Luyện thi", duration: "8 tuần", rating: 4.9, color: "purple", icon: "trophy",
    instructor: "EnglishMaster IELTS Team", premium: true,
    description: "Nắm chiến lược nền tảng cho bốn kỹ năng và xây vốn từ học thuật dùng đúng ngữ cảnh.",
    outcomes: ["Nhận diện dạng bài phổ biến", "Phát triển câu trả lời có dẫn chứng", "Dùng từ học thuật chính xác hơn"],
    modules: [
      module("Đọc để tìm bằng chứng", "Skim, scan và xác định quan hệ giữa luận điểm với dẫn chứng.", ["vx49", "vx50", "vx51", "vx52"], "g14", "l04", "r04", ["q31", "q36", "q37"]),
      module("Nghe và ghi chú", "Theo dõi từ khóa, cách diễn đạt lại và chuyển ý trong bài nghe.", ["vx53", "vx54", "vx55", "vx56"], "g15", "l04", "r04", ["q32", "q39", "q40"]),
      module("Viết đoạn lập luận", "Viết câu chủ đề, giải thích và ví dụ có liên kết.", ["vx49", "vx52", "vx55", "vx56"], "g14", "l04", "r05", ["q33", "q36", "q38"]),
      module("Speaking: phát triển ý", "Mở rộng câu trả lời với lý do, ví dụ và so sánh.", ["vx50", "vx51", "vx53", "vx54"], "g15", "l04", "r05", ["q34", "q39", "q40"]),
    ],
  },
  {
    id: "presentations-b2", title: "Presentations that Connect B2", level: "B2", category: "Thuyết trình", duration: "4 tuần", rating: 4.8, color: "orange", icon: "presentation",
    instructor: "Mr. Alex · Presentation Coach", premium: true,
    description: "Thiết kế thông điệp, dẫn dắt người nghe và xử lý câu hỏi bằng tiếng Anh thuyết phục.",
    outcomes: ["Mở và kết bài ấn tượng", "Dẫn dắt qua dữ liệu rõ ràng", "Trả lời câu hỏi khó bình tĩnh"],
    modules: [
      module("Thông điệp cốt lõi", "Xác định điều người nghe cần nhớ sau bài nói.", ["vx33", "vx37", "vx49", "vx52"], "g14", "l04", "r04", ["q31", "q33", "q36"]),
      module("Kể chuyện bằng dữ liệu", "Giải thích xu hướng và làm nổi bật ý nghĩa của con số.", ["vx50", "vx51", "vx53", "vx55"], "g15", "l04", "r04", ["q32", "q37", "q38"]),
      module("Chuyển ý mượt mà", "Dùng signposting để người nghe luôn theo kịp cấu trúc.", ["vx34", "vx38", "vx54", "vx56"], "g14", "l04", "r05", ["q33", "q36", "q40"]),
      module("Q&A tự tin", "Làm rõ câu hỏi, trả lời có cấu trúc và xử lý khi chưa có dữ liệu.", ["vx35", "vx39", "vx40", "vx52"], "g15", "l04", "r05", ["q34", "q39", "q40"]),
    ],
  },
  {
    id: "academic-c1", title: "Academic English C1", level: "C1", category: "Học thuật", duration: "8 tuần", rating: 4.9, color: "blue", icon: "book",
    instructor: "Dr. Mai · Academic English", premium: true,
    description: "Đọc phản biện, tổng hợp nguồn và trình bày lập luận học thuật với ngôn ngữ chính xác.",
    outcomes: ["Đánh giá độ tin cậy của bằng chứng", "Tổng hợp nhiều quan điểm", "Viết lập luận có sắc thái"],
    modules: [
      module("Đọc phản biện", "Nhận diện giả định, giới hạn và mức độ chắc chắn của kết luận.", ["vx57", "vx58", "vx59", "vx60"], "g16", "l05", "r05", ["q41", "q46", "q47"]),
      module("Tổng hợp nhiều nguồn", "Kết nối điểm tương đồng, khác biệt và khoảng trống nghiên cứu.", ["vx61", "vx62", "vx63", "vx64"], "g16", "l05", "r05", ["q42", "q48", "q49"]),
      module("Lập luận có sắc thái", "Dùng hedging và boosters phù hợp với sức mạnh của bằng chứng.", ["vx57", "vx60", "vx61", "vx64"], "g17", "l05", "r05", ["q43", "q46", "q50"]),
      module("Seminar học thuật", "Đặt câu hỏi, phản biện và xây dựng trên ý kiến của người khác.", ["vx58", "vx59", "vx62", "vx63"], "g17", "l05", "r05", ["q44", "q47", "q49"]),
    ],
  },
  {
    id: "advanced-fluency-c1", title: "Advanced Fluency C1", level: "C1", category: "Giao tiếp nâng cao", duration: "6 tuần", rating: 4.9, color: "purple", icon: "sparkles",
    instructor: "EnglishMaster Advanced Team", premium: true,
    description: "Diễn đạt sắc thái, ứng biến trong thảo luận và sử dụng tiếng Anh linh hoạt ở môi trường quốc tế.",
    outcomes: ["Diễn đạt đồng tình và phản biện tinh tế", "Điều chỉnh giọng điệu theo bối cảnh", "Nói trôi chảy về chủ đề phức tạp"],
    modules: [
      module("Sắc thái và hàm ý", "Hiểu điều được ngụ ý và chọn cách nói phù hợp với quan hệ xã hội.", ["vx57", "vx58", "vx61", "vx62"], "g16", "l05", "r05", ["q41", "q45", "q48"]),
      module("Tranh luận chuyên sâu", "Nhượng bộ hợp lý, phản biện và bảo vệ luận điểm.", ["vx59", "vx60", "vx63", "vx64"], "g17", "l05", "r05", ["q42", "q46", "q49"]),
      module("Ứng biến trong hội thoại", "Giữ mạch nói khi thiếu từ và chuyển hướng tự nhiên.", ["vx33", "vx38", "vx53", "vx54"], "g16", "l05", "r05", ["q43", "q47", "q50"]),
      module("Bài nói cuối khóa", "Chuẩn bị và trình bày một quan điểm phức tạp trước người nghe.", ["vx55", "vx56", "vx61", "vx64"], "g17", "l05", "r05", ["q44", "q48", "q50"]),
    ],
  },
];

export const extraCourses = tracks.map(({ modules, ...course }) => ({ ...course, lessons: modules.length }));

export const extraLessons = tracks.flatMap(track => track.modules.map((item, index) => ({
  id: `${track.id}-${index + 1}`,
  courseId: track.id,
  order: index + 1,
  ...item,
})));

type WordTuple = [word: string, ipa: string, meaning: string, partOfSpeech: string, definition: string, example: string, translation: string, category: string, level: string, collocation: string];

const words: WordTuple[] = [
  ["introduce", "/ˌɪntrəˈduːs/", "giới thiệu", "verb", "To tell someone another person's name or give initial information.", "Let me introduce you to my study partner.", "Để tôi giới thiệu bạn với người bạn học của tôi.", "Daily Life", "A1", "introduce yourself"],
  ["repeat", "/rɪˈpiːt/", "lặp lại", "verb", "To say or do something again.", "Could you repeat that sentence, please?", "Bạn có thể lặp lại câu đó được không?", "Learning", "A1", "repeat a sentence"],
  ["listen", "/ˈlɪsən/", "lắng nghe", "verb", "To give attention to a sound or speaker.", "Listen carefully to the final sound.", "Hãy nghe kỹ âm cuối.", "Learning", "A1", "listen carefully"],
  ["friendly", "/ˈfrendli/", "thân thiện", "adjective", "Kind, pleasant, and easy to talk to.", "Our new teacher is very friendly.", "Giáo viên mới của chúng tôi rất thân thiện.", "Daily Life", "A1", "a friendly smile"],
  ["practice", "/ˈpræktɪs/", "luyện tập", "verb", "To do an activity regularly in order to improve.", "I practice speaking for ten minutes each day.", "Tôi luyện nói mười phút mỗi ngày.", "Learning", "A1", "practice speaking"],
  ["syllable", "/ˈsɪləbəl/", "âm tiết", "noun", "A unit of pronunciation containing one vowel sound.", "The word hotel has two syllables.", "Từ hotel có hai âm tiết.", "Pronunciation", "A2", "stressed syllable"],
  ["stress", "/stres/", "trọng âm", "noun", "Extra force given to a syllable or word when speaking.", "The stress falls on the second syllable.", "Trọng âm rơi vào âm tiết thứ hai.", "Pronunciation", "A2", "word stress"],
  ["clearly", "/ˈklɪrli/", "một cách rõ ràng", "adverb", "In a way that is easy to hear or understand.", "Please speak slowly and clearly.", "Vui lòng nói chậm và rõ ràng.", "Communication", "A1", "speak clearly"],
  ["conversation", "/ˌkɑːnvərˈseɪʃən/", "cuộc trò chuyện", "noun", "An informal talk between two or more people.", "We had a short conversation after class.", "Chúng tôi trò chuyện ngắn sau giờ học.", "Communication", "A2", "start a conversation"],
  ["question", "/ˈkwestʃən/", "câu hỏi", "noun", "A sentence used to ask for information.", "That is an interesting question.", "Đó là một câu hỏi thú vị.", "Communication", "A1", "ask a question"],
  ["answer", "/ˈænsər/", "trả lời", "verb", "To respond to a question or request.", "Can you answer in a complete sentence?", "Bạn có thể trả lời bằng một câu hoàn chỉnh không?", "Communication", "A1", "answer a question"],
  ["pronounce", "/prəˈnaʊns/", "phát âm", "verb", "To make the sound of a word or letter.", "How do you pronounce this name?", "Bạn phát âm tên này như thế nào?", "Pronunciation", "A2", "pronounce correctly"],
  ["confident", "/ˈkɑːnfɪdənt/", "tự tin", "adjective", "Feeling sure about your ability or decision.", "She feels confident when speaking English.", "Cô ấy cảm thấy tự tin khi nói tiếng Anh.", "Learning", "A2", "feel confident"],
  ["invite", "/ɪnˈvaɪt/", "mời", "verb", "To ask someone to come to an event or join an activity.", "I invited Lan to join our study group.", "Tôi đã mời Lan tham gia nhóm học.", "Daily Life", "A2", "invite someone to"],
  ["available", "/əˈveɪləbəl/", "rảnh; có sẵn", "adjective", "Free to meet or ready to be used.", "Are you available on Friday afternoon?", "Bạn có rảnh vào chiều thứ Sáu không?", "Daily Life", "A2", "be available"],
  ["suggest", "/səˈdʒest/", "gợi ý", "verb", "To mention an idea for someone to consider.", "I suggest meeting near the station.", "Tôi gợi ý gặp nhau gần nhà ga.", "Communication", "A2", "suggest a plan"],
  ["menu", "/ˈmenjuː/", "thực đơn", "noun", "A list of food and drinks available in a restaurant.", "Could we see the menu, please?", "Cho chúng tôi xem thực đơn được không?", "Food", "A1", "read the menu"],
  ["order", "/ˈɔːrdər/", "gọi món", "verb", "To ask for food or goods to be brought to you.", "I would like to order the vegetable soup.", "Tôi muốn gọi món súp rau.", "Food", "A2", "order a meal"],
  ["delicious", "/dɪˈlɪʃəs/", "ngon", "adjective", "Having a very pleasant taste or smell.", "The noodle soup was delicious.", "Món phở rất ngon.", "Food", "A1", "taste delicious"],
  ["allergy", "/ˈælərdʒi/", "dị ứng", "noun", "A medical condition that causes a bad reaction to certain substances.", "Please tell the server about your food allergy.", "Hãy báo cho nhân viên phục vụ về dị ứng thực phẩm của bạn.", "Health", "A2", "food allergy"],
  ["size", "/saɪz/", "kích cỡ", "noun", "How large or small something is.", "Do you have this shirt in a larger size?", "Bạn có chiếc áo này cỡ lớn hơn không?", "Shopping", "A1", "the right size"],
  ["discount", "/ˈdɪskaʊnt/", "giảm giá", "noun", "A reduction in the usual price.", "Students receive a ten percent discount.", "Học sinh được giảm giá mười phần trăm.", "Shopping", "A2", "get a discount"],
  ["exchange", "/ɪksˈtʃeɪndʒ/", "đổi hàng", "verb", "To return something and receive another item in its place.", "Can I exchange these shoes for another pair?", "Tôi có thể đổi đôi giày này lấy đôi khác không?", "Shopping", "A2", "exchange an item"],
  ["cashier", "/kæˈʃɪr/", "thu ngân", "noun", "A person who receives payments in a shop.", "The cashier gave me my receipt.", "Thu ngân đã đưa biên lai cho tôi.", "Shopping", "A2", "ask the cashier"],
  ["reservation", "/ˌrezərˈveɪʃən/", "đặt chỗ", "noun", "An arrangement to keep a seat, room, or ticket for someone.", "I made a hotel reservation online.", "Tôi đã đặt phòng khách sạn trực tuyến.", "Travel", "A2", "make a reservation"],
  ["route", "/ruːt/", "tuyến đường", "noun", "A particular way from one place to another.", "This is the fastest route to the airport.", "Đây là tuyến đường nhanh nhất đến sân bay.", "Travel", "A2", "plan a route"],
  ["platform", "/ˈplætfɔːrm/", "sân ga", "noun", "The raised area where passengers wait for a train.", "The train leaves from platform six.", "Tàu khởi hành từ sân ga số sáu.", "Travel", "A2", "train platform"],
  ["delay", "/dɪˈleɪ/", "sự trì hoãn", "noun", "A situation in which something happens later than planned.", "The flight has a forty-minute delay.", "Chuyến bay bị trễ bốn mươi phút.", "Travel", "A2", "a long delay"],
  ["passport", "/ˈpæspɔːrt/", "hộ chiếu", "noun", "An official document used when traveling between countries.", "Keep your passport in a safe place.", "Hãy giữ hộ chiếu ở nơi an toàn.", "Travel", "A2", "valid passport"],
  ["boarding", "/ˈbɔːrdɪŋ/", "việc lên máy bay", "noun", "The process of getting onto a plane, train, or ship.", "Boarding starts at eight thirty.", "Việc lên máy bay bắt đầu lúc tám giờ ba mươi.", "Travel", "A2", "boarding pass"],
  ["aisle", "/aɪl/", "lối đi", "noun", "A passage between rows of seats.", "I prefer an aisle seat on long flights.", "Tôi thích ghế gần lối đi trên chuyến bay dài.", "Travel", "B1", "aisle seat"],
  ["customs", "/ˈkʌstəmz/", "hải quan", "noun", "The place where luggage is checked when entering a country.", "We went through customs quickly.", "Chúng tôi đã qua hải quan nhanh chóng.", "Travel", "B1", "go through customs"],
  ["attachment", "/əˈtætʃmənt/", "tệp đính kèm", "noun", "A computer file sent with an email.", "The report is included as an attachment.", "Báo cáo được gửi dưới dạng tệp đính kèm.", "Work", "B1", "email attachment"],
  ["confirm", "/kənˈfɜːrm/", "xác nhận", "verb", "To state that information or an arrangement is correct.", "Please confirm the meeting time by email.", "Vui lòng xác nhận giờ họp qua email.", "Work", "B1", "confirm a booking"],
  ["request", "/rɪˈkwest/", "yêu cầu", "noun", "A polite or formal act of asking for something.", "We received your request this morning.", "Chúng tôi đã nhận được yêu cầu của bạn sáng nay.", "Work", "B1", "make a request"],
  ["clarify", "/ˈklærəfaɪ/", "làm rõ", "verb", "To make an idea or statement easier to understand.", "Could you clarify the final requirement?", "Bạn có thể làm rõ yêu cầu cuối cùng không?", "Work", "B1", "clarify a point"],
  ["agenda", "/əˈdʒendə/", "chương trình họp", "noun", "A list of topics to discuss at a meeting.", "The budget is the first item on the agenda.", "Ngân sách là mục đầu tiên trong chương trình họp.", "Work", "B1", "meeting agenda"],
  ["contribute", "/kənˈtrɪbjuːt/", "đóng góp", "verb", "To give ideas, time, or effort to a shared activity.", "Everyone contributed an idea to the discussion.", "Mọi người đều đóng góp một ý tưởng vào cuộc thảo luận.", "Work", "B1", "contribute to"],
  ["priority", "/praɪˈɔːrəti/", "ưu tiên", "noun", "Something considered more important than other things.", "Customer safety is our highest priority.", "An toàn của khách hàng là ưu tiên cao nhất của chúng tôi.", "Work", "B1", "top priority"],
  ["approve", "/əˈpruːv/", "phê duyệt", "verb", "To officially accept or agree to something.", "The manager approved the revised plan.", "Quản lý đã phê duyệt kế hoạch sửa đổi.", "Work", "B1", "approve a plan"],
  ["feature", "/ˈfiːtʃər/", "tính năng", "noun", "An important or useful part of a product.", "The search feature saves users time.", "Tính năng tìm kiếm giúp người dùng tiết kiệm thời gian.", "Technology", "B1", "key feature"],
  ["device", "/dɪˈvaɪs/", "thiết bị", "noun", "A piece of electronic equipment made for a particular purpose.", "The app works on every mobile device.", "Ứng dụng hoạt động trên mọi thiết bị di động.", "Technology", "A2", "mobile device"],
  ["privacy", "/ˈpraɪvəsi/", "quyền riêng tư", "noun", "The right to keep personal information from being shared.", "Users can change their privacy settings.", "Người dùng có thể thay đổi cài đặt quyền riêng tư.", "Technology", "B1", "protect privacy"],
  ["update", "/ˈʌpdeɪt/", "bản cập nhật", "noun", "A newer version containing improvements or corrections.", "The latest update fixes the login issue.", "Bản cập nhật mới nhất sửa lỗi đăng nhập.", "Technology", "B1", "software update"],
  ["issue", "/ˈɪʃuː/", "vấn đề", "noun", "A problem that needs attention or a decision.", "The team is investigating a payment issue.", "Nhóm đang điều tra một vấn đề thanh toán.", "Technology", "B1", "report an issue"],
  ["reproduce", "/ˌriːprəˈduːs/", "tái hiện", "verb", "To make a problem happen again in the same conditions.", "We could not reproduce the error on Android.", "Chúng tôi không thể tái hiện lỗi trên Android.", "Technology", "B2", "reproduce a bug"],
  ["expected", "/ɪkˈspektɪd/", "được mong đợi", "adjective", "Believed or intended to happen.", "Describe the expected result in the ticket.", "Hãy mô tả kết quả mong đợi trong phiếu lỗi.", "Technology", "B1", "expected result"],
  ["impact", "/ˈɪmpækt/", "tác động", "noun", "A strong effect that something has on a situation or person.", "The outage had a major impact on customers.", "Sự cố ngừng dịch vụ tác động lớn đến khách hàng.", "Technology", "B1", "major impact"],
  ["analyze", "/ˈænəlaɪz/", "phân tích", "verb", "To examine something carefully in order to understand it.", "We analyzed the results before writing the report.", "Chúng tôi phân tích kết quả trước khi viết báo cáo.", "Academic", "B2", "analyze data"],
  ["significant", "/sɪɡˈnɪfɪkənt/", "đáng kể; quan trọng", "adjective", "Large or important enough to be noticed.", "The study found a significant improvement.", "Nghiên cứu ghi nhận một sự cải thiện đáng kể.", "Academic", "B2", "significant difference"],
  ["trend", "/trend/", "xu hướng", "noun", "A general direction in which a situation is changing.", "The chart shows a gradual upward trend.", "Biểu đồ cho thấy một xu hướng tăng dần.", "Academic", "B2", "upward trend"],
  ["interpret", "/ɪnˈtɜːrprət/", "diễn giải", "verb", "To explain the meaning of information or results.", "The results should be interpreted with care.", "Kết quả nên được diễn giải một cách thận trọng.", "Academic", "B2", "interpret results"],
  ["relevant", "/ˈreləvənt/", "có liên quan", "adjective", "Directly connected with the subject being considered.", "Include only evidence relevant to your argument.", "Chỉ đưa vào bằng chứng liên quan đến lập luận của bạn.", "Academic", "B2", "relevant evidence"],
  ["assumption", "/əˈsʌmpʃən/", "giả định", "noun", "Something accepted as true without complete proof.", "The argument depends on a weak assumption.", "Lập luận phụ thuộc vào một giả định yếu.", "Academic", "B2", "underlying assumption"],
  ["contrast", "/ˈkɑːntræst/", "sự tương phản", "noun", "A clear difference between two things.", "The essay draws a contrast between the two approaches.", "Bài luận chỉ ra sự tương phản giữa hai cách tiếp cận.", "Academic", "B2", "in contrast"],
  ["indicate", "/ˈɪndɪkeɪt/", "cho thấy", "verb", "To show that something exists or is likely.", "The figures indicate a change in behavior.", "Các số liệu cho thấy một thay đổi trong hành vi.", "Academic", "B2", "results indicate"],
  ["evaluate", "/ɪˈvæljueɪt/", "đánh giá", "verb", "To judge the quality, importance, or value of something.", "Researchers evaluated three possible explanations.", "Các nhà nghiên cứu đánh giá ba cách giải thích khả dĩ.", "Academic", "C1", "evaluate critically"],
  ["methodology", "/ˌmeθəˈdɑːlədʒi/", "phương pháp nghiên cứu", "noun", "A system of methods used in a study or activity.", "The paper explains its methodology in detail.", "Bài báo giải thích chi tiết phương pháp nghiên cứu.", "Academic", "C1", "research methodology"],
  ["limitation", "/ˌlɪmɪˈteɪʃən/", "hạn chế", "noun", "A fact or condition that restricts what can be concluded.", "The small sample is an important limitation.", "Mẫu nhỏ là một hạn chế quan trọng.", "Academic", "C1", "study limitation"],
  ["valid", "/ˈvælɪd/", "có giá trị; hợp lý", "adjective", "Based on sound reasoning or acceptable evidence.", "The criticism is valid but incomplete.", "Lời phê bình hợp lý nhưng chưa đầy đủ.", "Academic", "C1", "valid argument"],
  ["synthesize", "/ˈsɪnθəsaɪz/", "tổng hợp", "verb", "To combine ideas or information into a coherent whole.", "The review synthesizes findings from twenty studies.", "Bài tổng quan tổng hợp phát hiện từ hai mươi nghiên cứu.", "Academic", "C1", "synthesize evidence"],
  ["framework", "/ˈfreɪmwɜːrk/", "khung phân tích", "noun", "A set of ideas used to organize and understand a subject.", "The framework helps us compare the policies.", "Khung phân tích giúp chúng ta so sánh các chính sách.", "Academic", "C1", "conceptual framework"],
  ["implication", "/ˌɪmplɪˈkeɪʃən/", "hệ quả; hàm ý", "noun", "A possible effect or meaning of a finding or action.", "The findings have implications for public policy.", "Các phát hiện có hàm ý đối với chính sách công.", "Academic", "C1", "practical implication"],
  ["coherent", "/koʊˈhɪrənt/", "mạch lạc", "adjective", "Logical, consistent, and easy to understand.", "Her conclusion is concise and coherent.", "Kết luận của cô ấy súc tích và mạch lạc.", "Academic", "C1", "coherent argument"],
];

export const extraVocabulary = words.map(([
  word, ipa, meaning, partOfSpeech, definition, example, translation, category, level, collocation,
], index) => ({
  id: `vx${String(index + 1).padStart(2, "0")}`,
  word,
  ipa,
  meaning,
  definition,
  partOfSpeech,
  example,
  translation,
  category,
  level,
  synonyms: [],
  antonyms: [],
  collocations: [collocation],
  wordFamily: [],
}));
