import type { PrismaClient } from "@prisma/client";
import { chineseCourses } from "./chinese-courses";
import { pinyin } from "pinyin-pro";

export const speakingCategories = ["Sinh hoạt hằng ngày", "Ăn uống", "Mua sắm", "Hỏi đường và đi lại", "Du lịch và khách sạn", "Bạn bè và giao tiếp", "Sức khỏe và hỗ trợ", "Học tập và công việc", "Kể chuyện và trải nghiệm", "Ý kiến và dự định"];
const english: [string, string][][] = [
  [
    ["I brush my teeth before breakfast.", "Tôi đánh răng trước bữa sáng."],
    ["What time do you usually go to bed?", "Bạn thường đi ngủ lúc mấy giờ?"],
    ["I take the bus to work every morning.", "Sáng nào tôi cũng đi xe buýt đến chỗ làm."],
    ["Could you help me clean the kitchen?", "Bạn giúp tôi dọn bếp được không?"],
    ["I like listening to music while I cook.", "Tôi thích nghe nhạc trong khi nấu ăn."],
    ["Let's go for a walk after dinner.", "Chúng ta đi dạo sau bữa tối nhé."],
  ],
  [
    ["I'd like a table for two, please.", "Vui lòng cho tôi một bàn dành cho hai người."],
    ["Could I see the menu, please?", "Cho tôi xem thực đơn được không?"],
    ["Can I have this without sugar?", "Tôi dùng món này không đường được không?"],
    ["I'm allergic to peanuts.", "Tôi bị dị ứng với lạc."],
    ["This soup is a little too salty.", "Món canh này hơi mặn quá."],
    ["Could we have the bill, please?", "Cho chúng tôi xin hóa đơn thanh toán được không?"],
  ],
  [
    ["How much does this jacket cost?", "Chiếc áo khoác này giá bao nhiêu?"],
    ["Do you have this in a larger size?", "Bạn có mẫu này cỡ lớn hơn không?"],
    ["May I try these shoes on?", "Tôi thử đôi giày này được không?"],
    ["I'm just looking, thank you.", "Tôi chỉ xem thôi, cảm ơn bạn."],
    ["Can I pay by card?", "Tôi thanh toán bằng thẻ được không?"],
    ["I'd like to return this because it doesn't fit.", "Tôi muốn trả lại món này vì nó không vừa."],
  ],
  [
    ["Excuse me, where is the nearest station?", "Xin lỗi, nhà ga gần nhất ở đâu?"],
    ["Go straight and turn left at the traffic lights.", "Đi thẳng rồi rẽ trái ở chỗ đèn giao thông."],
    ["Is the museum within walking distance?", "Bảo tàng có ở gần để đi bộ tới được không?"],
    ["Which bus goes to the city center?", "Xe buýt nào đi đến trung tâm thành phố?"],
    ["Please let me know when we get there.", "Vui lòng báo cho tôi khi chúng ta đến nơi."],
    ["I think we got off at the wrong stop.", "Tôi nghĩ chúng ta đã xuống nhầm trạm."],
  ],
  [
    ["I have a reservation under the name Nguyen.", "Tôi có đặt phòng dưới tên Nguyen."],
    ["What time is breakfast served?", "Bữa sáng được phục vụ lúc mấy giờ?"],
    ["Could you tell me the Wi-Fi password?", "Bạn cho tôi biết mật khẩu Wi-Fi được không?"],
    ["My flight has been delayed by two hours.", "Chuyến bay của tôi bị hoãn hai tiếng."],
    ["Where can I collect my luggage?", "Tôi có thể nhận hành lý ở đâu?"],
    ["I'd like to check out tomorrow morning.", "Tôi muốn trả phòng vào sáng mai."],
  ],
  [
    ["It's nice to finally meet you.", "Rất vui vì cuối cùng cũng được gặp bạn."],
    ["What do you like doing in your free time?", "Bạn thích làm gì vào thời gian rảnh?"],
    ["Would you like to join us for lunch?", "Bạn có muốn ăn trưa cùng chúng tôi không?"],
    ["I'm sorry, I didn't catch your name.", "Xin lỗi, tôi chưa nghe rõ tên bạn."],
    ["Thank you for inviting me to your party.", "Cảm ơn bạn đã mời tôi đến bữa tiệc của bạn."],
    ["Let's keep in touch after the course.", "Chúng ta giữ liên lạc sau khóa học nhé."],
  ],
  [
    ["I haven't been feeling well since yesterday.", "Từ hôm qua đến giờ tôi thấy không khỏe."],
    ["I'd like to make an appointment with a doctor.", "Tôi muốn đặt lịch khám bác sĩ."],
    ["My throat hurts when I swallow.", "Tôi bị đau họng khi nuốt."],
    ["How often should I take this medicine?", "Tôi nên uống thuốc này bao lâu một lần?"],
    ["Could you help me call an ambulance?", "Bạn giúp tôi gọi xe cứu thương được không?"],
    ["You should rest and drink plenty of water.", "Bạn nên nghỉ ngơi và uống nhiều nước."],
  ],
  [
    ["Could you explain that one more time?", "Bạn giải thích lại điều đó một lần nữa được không?"],
    ["I need more time to finish this assignment.", "Tôi cần thêm thời gian để hoàn thành bài tập này."],
    ["Let's review the main points before the meeting.", "Chúng ta xem lại các ý chính trước cuộc họp nhé."],
    ["I'll send you the report by Friday.", "Tôi sẽ gửi báo cáo cho bạn chậm nhất vào thứ Sáu."],
    ["What skills are required for this position?", "Vị trí này yêu cầu những kỹ năng gì?"],
    ["I appreciate your feedback on my presentation.", "Tôi rất trân trọng góp ý của bạn về bài thuyết trình của tôi."],
  ],
  [
    ["Last weekend, I visited my grandparents.", "Cuối tuần trước tôi đến thăm ông bà."],
    ["Have you ever traveled alone?", "Bạn đã bao giờ đi du lịch một mình chưa?"],
    ["I was cooking when the phone rang.", "Tôi đang nấu ăn thì điện thoại reo."],
    ["The most memorable part was watching the sunrise.", "Điều đáng nhớ nhất là được ngắm bình minh."],
    ["At first I was nervous, but everyone was friendly.", "Ban đầu tôi lo lắng, nhưng mọi người đều thân thiện."],
    ["If I could do it again, I'd plan more carefully.", "Nếu được làm lại, tôi sẽ lên kế hoạch cẩn thận hơn."],
  ],
  [
    ["In my opinion, practice matters more than perfection.", "Theo tôi, luyện tập quan trọng hơn sự hoàn hảo."],
    ["I agree with you, but we should consider the cost.", "Tôi đồng ý với bạn, nhưng chúng ta nên cân nhắc chi phí."],
    ["I'm planning to learn a new language this year.", "Tôi dự định học một ngôn ngữ mới trong năm nay."],
    ["Would you rather live in a city or in the countryside?", "Bạn thích sống ở thành phố hay ở nông thôn hơn?"],
    ["Although it's challenging, I think it's worth trying.", "Dù có khó khăn, tôi nghĩ điều đó đáng để thử."],
    ["My goal is to speak more confidently at work.", "Mục tiêu của tôi là nói tự tin hơn trong công việc."],
  ],
];

export const speakingSamples = [
  ...english.flatMap((lines, category) => lines.map(([text, translation], index) => ({
    id: `speaking-en-topic-${category + 1}-${index + 1}`, language: "en", category: speakingCategories[category], title: `Câu ${index + 1}`, level: category >= 8 ? "B1" : category >= 3 ? "A2" : "A1", text, translation, pinyin: null as string | null,
  }))),
  ...chineseCourses.flatMap((course, category) => course.topics.flatMap((topic) => topic.lines.map(([text, translation], index) => ({
    id: `speaking-zh-${course.id}-${topic.id}-${index + 1}`, language: "zh", category: speakingCategories[category], title: `${topic.title} · ${index + 1}`, level: course.level, text, translation, pinyin: pinyin(text, { toneType: "symbol", toneSandhi: false }).replace(/\s+([，。！？；：、,.!?;:])/gu, "$1"),
  })))),
];
const samplesById = new Map(speakingSamples.map((sample) => [sample.id, sample]));
const sampleOrder = new Map(speakingSamples.map((sample, index) => [sample.id, index]));
export function speakingLibraryOrder(a: { id: string }, b: { id: string }) {
  return (sampleOrder.get(a.id) ?? 10000) - (sampleOrder.get(b.id) ?? 10000) || a.id.localeCompare(b.id);
}
export function speakingMetadata<T extends { id: string; text: string }>(exercise: T) {
  const saved = samplesById.get(exercise.id);
  const courseIndex = chineseCourses.findIndex((course) => exercise.id.startsWith(course.id));
  const legacy = [0, 1, 4, 7, 9][Number(exercise.id.replace("speaking-", "")) - 1];
  const legacyZh: Record<string, number> = { "zh-greetings-speaking": 5, "zh-introductions-speaking": 5, "zh-family-speaking": 5, "zh-numbers-speaking": 0, "zh-time-speaking": 0, "zh-food-speaking": 1 };
  return { ...exercise, category: saved?.category || speakingCategories[courseIndex] || speakingCategories[legacy] || speakingCategories[legacyZh[exercise.id]] || "Chủ đề khác", translation: saved?.text === exercise.text ? saved.translation : undefined };
}
export async function seedSpeakingSamples(db: Pick<PrismaClient, "speakingExercise">, language?: string) {
  for (const { category: _category, translation: _translation, ...sample } of speakingSamples.filter((sample) => !language || sample.language === language)) {
    const data = { ...sample, tip: "Nghe mẫu, đọc theo từng cụm và thử lại chậm hơn nếu cần." };
    await db.speakingExercise.upsert({ where: { id: data.id }, create: data, update: data });
  }
}
