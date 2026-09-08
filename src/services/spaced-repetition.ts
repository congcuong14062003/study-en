export type ReviewRating = "again" | "hard" | "good" | "easy";
export interface ReviewState {
    repetitions: number;
    interval: number;
    ease: number;
}
export function scheduleReview(state: ReviewState, rating: ReviewRating, now = new Date()) {
    const quality = { again: 0, hard: 3, good: 4, easy: 5 }[rating];
    const ease = Math.max(1.3, state.ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    const repetitions = rating === "again" ? 0 : state.repetitions + 1;
    let interval = rating === "again" ? 0 : state.repetitions === 0 ? 1 : state.repetitions === 1 ? 6 : Math.round(state.interval * ease);
    if (rating === "hard")
        interval = Math.max(1, Math.round((state.interval || 1) * 1.2));
    if (rating === "easy")
        interval = Math.max(4, Math.round(interval * 1.3));
    const dueAt = new Date(now.getTime() + (rating === "again" ? 10 * 60 * 1000 : interval * 86400000));
    return { repetitions, interval, ease, dueAt, lastReviewedAt: now };
}
