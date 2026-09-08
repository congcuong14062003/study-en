import { db } from "@/lib/db";
import { ApiError } from "@/lib/security";
import { lockUser, reward } from "./learning";
export function uncoveredSeconds(start: number, end: number, occupied: {
    start: number;
    end: number;
}[]) {
    const intervals = occupied.map(i => ({ start: Math.max(start, i.start), end: Math.min(end, i.end) })).filter(i => i.end > i.start).sort((a, b) => a.start - b.start);
    let cursor = start, uncovered = 0;
    for (const interval of intervals) {
        if (interval.start > cursor)
            uncovered += interval.start - cursor;
        cursor = Math.max(cursor, interval.end);
    }
    uncovered += Math.max(0, end - cursor);
    return Math.max(0, Math.floor(uncovered / 1000));
}
export async function finishStudy(userId: string, sessionId: string) {
    return db.$transaction(async (tx) => {
        await lockUser(tx, userId);
        const session = await tx.studySession.findFirst({ where: { id: sessionId, userId, kind: { in: ["lesson", "speaking", "reading", "listening"] } } });
        if (!session)
            throw new ApiError("Phiên học không tồn tại.", 404);
        if (session.endedAt)
            return { seconds: session.seconds };
        const now = new Date();
        const start = Math.max(session.startedAt.getTime(), now.getTime() - 3600000);
        const overlapping = await tx.studySession.findMany({ where: { userId, id: { not: sessionId }, kind: { in: ["lesson", "speaking", "reading", "listening"] }, seconds: { gt: 0 }, endedAt: { gt: new Date(start) }, startedAt: { lt: now } }, select: { startedAt: true, endedAt: true } });
        const seconds = uncoveredSeconds(start, now.getTime(), overlapping.map(s => ({ start: Math.max(s.startedAt.getTime(), s.endedAt!.getTime() - 3600000), end: s.endedAt!.getTime() })));
        await tx.studySession.update({ where: { id: sessionId }, data: { endedAt: now, seconds } });
        if (seconds >= 10)
            await reward(tx, userId, 0, "time", session.resourceId, seconds);
        return { seconds };
    });
}
