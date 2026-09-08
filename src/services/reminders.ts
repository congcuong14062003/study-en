import { db } from "@/lib/db";
import { studyDate } from "./learning";
export async function ensureDailyReminder(userId: string) {
    const [profile, progress] = await Promise.all([db.profile.findUnique({ where: { userId } }), db.userProgress.findUnique({ where: { userId } })]);
    if (!profile?.notificationsEnabled)
        return;
    const now = new Date(), date = studyDate(now);
    const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
    if (time < profile.reminderTime || progress?.lastStudyDate === date)
        return;
    await db.notification.upsert({ where: { id: `reminder-${userId}-${date}` }, create: { id: `reminder-${userId}-${date}`, userId, type: "reminder", title: "Đến giờ dành một chút thời gian cho tiếng Anh", body: `Mục tiêu của bạn là ${profile.dailyMinutes} phút. Bắt đầu một bài ngắn để giữ nhịp học nhé!`, href: "/dashboard" }, update: {} });
}
