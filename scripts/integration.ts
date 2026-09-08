import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
class BrowserSession {
    cookies = new Map<string, string>();
    async request(path: string, method = "GET", body?: unknown, origin = base) {
        const response = await fetch(`${base}${path}`, {
            method,
            headers: {
                Origin: origin,
                Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
                ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            redirect: "manual",
        });
        for (const cookie of response.headers.getSetCookie()) {
            const pair = cookie.split(";")[0];
            const at = pair.indexOf("=");
            this.cookies.set(pair.slice(0, at), pair.slice(at + 1));
        }
        return response;
    }
    async json(path: string, method = "GET", body?: unknown) {
        const r = await this.request(path, method, body);
        const data = await r.json();
        assert(r.ok, `${method} ${path}: ${r.status} ${JSON.stringify(data)}`);
        return data;
    }
    async login(email: string, password: string) {
        const csrf = await this.json("/api/auth/csrf");
        const response = await fetch(`${base}/api/auth/callback/credentials`, {
            method: "POST",
            headers: {
                Origin: base,
                Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                csrfToken: csrf.csrfToken,
                email,
                password,
                json: "true",
                callbackUrl: `${base}/dashboard`,
            }),
            redirect: "manual",
        });
        for (const cookie of response.headers.getSetCookie()) {
            const pair = cookie.split(";")[0], at = pair.indexOf("=");
            this.cookies.set(pair.slice(0, at), pair.slice(at + 1));
        }
        const session = await this.json("/api/auth/session");
        assert(session.user?.id, "Credential login must establish session");
        return session.user.id as string;
    }
}
async function main() {
    const anon = new BrowserSession();
    assert.equal((await anon.request("/api/dashboard")).status, 401);
    assert.equal((await anon.request("/api/admin/users")).status, 401);
    const suffix = randomUUID().slice(0, 8), email = `integration-${suffix}@example.test`, password = "Integration!123";
    let userId = "";
    let foreignId = "";
    const createdContent: string[] = [];
    try {
        const created = await anon.json("/api/auth/register", "POST", {
            name: "Integration Learner",
            email,
            password,
            confirmPassword: password,
        });
        userId = created.user.id;
        assert.equal((await anon.request("/api/auth/register", "POST", {
            name: "Bad",
            email: `invalid-${suffix}@example.test`,
            password: "weak",
            confirmPassword: "weak",
        })).status, 400);
        const learner = new BrowserSession();
        assert.equal(await learner.login(email, password), userId);
        assert.equal((await learner.request("/api/admin/users")).status, 403);
        assert.equal((await learner.request("/api/onboarding", "POST", {}, "https://evil.example")).status, 403);
        await learner.json("/api/onboarding", "POST", {
            goal: "Giao tiếp",
            level: "A1",
            dailyMinutes: 20,
        });
        const placement = await learner.json("/api/quiz/placement");
        assert.equal(placement.questions.length, 30);
        assert(!("correctAnswer" in placement.questions[0]));
        assert(!("explanation" in placement.questions[0]));
        const placementAnswers = await db.question.findMany({
            where: {
                id: { in: placement.questions.map((q: {
                        id: string;
                    }) => q.id) },
            },
        });
        await learner.json("/api/quiz/submit", "POST", {
            quizId: "placement",
            answers: placementAnswers.map((q) => ({
                questionId: q.id,
                selected: q.correctAnswer,
            })),
        });
        const before = await learner.json("/api/dashboard");
        assert.equal(before.user.profile.placementComplete, true);
        assert.equal(before.user.profile.level, "C2");
        assert.equal(before.user.progress.xp, 30);
        assert.equal((await learner.request("/api/courses/english-a1/enroll", "POST", {}, "http://localhost:3000")).status, 200);
        await learner.json("/api/courses/english-a1/enroll", "POST", {});
        await learner.json("/api/courses/english-a1/enroll", "POST", {});
        assert.equal(await db.courseEnrollment.count({
            where: { userId, courseId: "english-a1" },
        }), 1);
        assert.equal((await learner.request("/api/lessons/a1-1/progress", "POST", { step: 5 }))
            .status, 400);
        for (let step = 0; step <= 5; step++)
            await learner.json("/api/lessons/a1-1/progress", "POST", { step });
        const lesson = await learner.json("/api/lessons/a1-1");
        const actual = await db.question.findMany({
            where: {
                id: { in: lesson.quiz.questions.map((q: {
                        id: string;
                    }) => q.id) },
            },
        });
        const submission = {
            quizId: lesson.quiz.id,
            answers: actual.map((q) => ({
                questionId: q.id,
                selected: q.correctAnswer,
            })),
        };
        const results = await Promise.all([
            learner.json("/api/quiz/submit", "POST", submission),
            learner.json("/api/quiz/submit", "POST", submission),
        ]);
        assert.equal(results.reduce((s, r) => s + r.xp, 0), 30);
        const progress = await db.userProgress.findUniqueOrThrow({
            where: { userId },
        });
        assert.equal(progress.lessonsCompleted, 1);
        assert.equal(progress.xp, 60);
        const review = await learner.json("/api/vocabulary/review", "POST", {
            vocabularyId: "v01",
            rating: "good",
        });
        assert.equal(review.xp, 5);
        assert.equal((await learner.request("/api/vocabulary/review", "POST", {
            vocabularyId: "v01",
            rating: "good",
        })).status, 409);
        assert.equal(await db.vocabularyReview.count({
            where: { userId, vocabularyId: "v01" },
        }), 1);
        const note = await learner.json("/api/notes", "POST", {
            title: "My saved note",
            content: "Learning persists.",
            tags: ["test"],
        });
        await learner.json(`/api/notes/${note.id}`, "PATCH", {
            title: "Updated note",
            content: "Updated content",
            tags: [],
        });
        const foreign = await db.user.create({
            data: {
                email: `foreign-${suffix}@example.test`,
                name: "Foreign",
                notes: { create: { title: "Private", content: "Private", tags: [] } },
            },
            include: { notes: true },
        });
        foreignId = foreign.id;
        assert.equal((await learner.request(`/api/notes/${foreign.notes[0].id}`, "PATCH", {
            title: "Hijack",
            content: "No",
            tags: [],
        })).status, 404);
        await learner.json("/api/favorites", "POST", {
            type: "word",
            resourceId: "v01",
            title: "First word",
            href: "/dictionary?q=hello",
        });
        assert.equal((await learner.json("/api/favorites")).length, 1);
        const start = await learner.json("/api/study/start", "POST", {
            kind: "lesson",
            resourceId: "a1-1",
        });
        await db.studySession.update({
            where: { id: start.id },
            data: { startedAt: new Date(Date.now() - 65000) },
        });
        await learner.json("/api/study/finish", "POST", { sessionId: start.id });
        const savedSeconds = (await learner.json("/api/dashboard")).user.progress
            .studySeconds;
        await learner.json("/api/study/finish", "POST", { sessionId: start.id });
        assert.equal((await learner.json("/api/dashboard")).user.progress.studySeconds, savedSeconds);
        assert(savedSeconds >= 65);
        const fresh = new BrowserSession();
        await fresh.login(email, password);
        const after = await fresh.json("/api/dashboard");
        assert.equal(after.user.progress.xp, 65);
        assert.equal(after.user.progress.lessonsCompleted, 1);
        assert.equal(after.enrollments.length, 1);
        assert.equal((await fresh.json("/api/notes"))[0].title, "Updated note");
        assert.equal((await fresh.json("/api/favorites")).length, 1);
        const config = await fresh.json("/api/config");
        const aiStatus = await fresh.json("/api/ai/status");
        assert.equal(aiStatus.configured, config.ai);
        assert.equal((await fresh.json("/api/writing/submissions")).length, 0);
        if (!config.ai) {
            assert.equal((await fresh.request("/api/ai/chat", "POST", {
                message: "Hello",
                scenario: "Coffee Shop",
                difficulty: "Beginner",
                correction: "important",
            })).status, 503);
            assert.equal((await fresh.json("/api/ai/status")).usage.chat.used, aiStatus.usage.chat.used);
        }
        const conversation = await db.aIConversation.create({ data: { userId, title: "Integration chat", scenario: "Coffee Shop", difficulty: "Beginner", correction: "important", messages: { create: { role: "assistant", content: "Welcome", metadata: { correction: null, vocabulary: [], followUp: "How are you?" } } } } });
        const foreignConversation = await db.aIConversation.create({ data: { userId: foreignId, title: "Private foreign chat", scenario: "Airport", difficulty: "Beginner", correction: "none" } });
        assert((await fresh.json("/api/ai")).some((item: {
            id: string;
        }) => item.id === conversation.id));
        assert.equal((await fresh.json(`/api/ai/${conversation.id}`)).messages[0].metadata.followUp, "How are you?");
        assert.equal((await learner.request(`/api/ai/${foreignConversation.id}`, "DELETE")).status, 404);
        assert.equal((await learner.request(`/api/ai/${conversation.id}`, "DELETE")).status, 200);
        assert.equal((await db.aIConversation.findUnique({ where: { id: conversation.id } })), null);
        if (process.env.DEMO_PASSWORD) {
            const admin = new BrowserSession();
            await admin.login("admin@englishmaster.vn", process.env.DEMO_PASSWORD);
            const course = await admin.json("/api/admin/courses", "POST", {
                title: `Integration Course ${suffix}`,
                level: "A1",
                category: "Test",
                description: "Temporary course for integration validation.",
                duration: "1 week",
                instructor: "Test author",
                outcomes: ["Verify persistence"],
                color: "blue",
                published: false,
                premium: false,
            });
            createdContent.push(course.id);
            assert.equal((await anon.request(`/api/courses/${course.id}`)).status, 404);
            await admin.json(`/api/admin/courses/${course.id}`, "PATCH", {
                ...course,
                title: "Updated integration course",
                published: true,
            });
            assert.equal((await anon.request(`/api/courses/${course.id}`)).status, 200);
            await admin.json(`/api/admin/courses/${course.id}`, "DELETE");
            createdContent.length = 0;
        }
        await db.user.update({
            where: { id: userId },
            data: { sessionVersion: { increment: 1 } },
        });
        assert.equal((await fresh.request("/api/dashboard")).status, 401);
        console.log("PASS: registration, auth, RBAC, CSRF, placement, enrollment, lesson progression, concurrent XP, SRS, notes ownership, favorites, study-time idempotency, re-login persistence, AI status/history ownership, admin CRUD, session revocation.");
    }
    finally {
        for (const id of createdContent)
            await db.course.deleteMany({ where: { id } });
        if (userId)
            await db.user.deleteMany({ where: { id: userId } });
        if (foreignId)
            await db.user.deleteMany({ where: { id: foreignId } });
        await db.rateLimit.deleteMany({ where: { key: { contains: email } } });
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exitCode = 1;
})
    .finally(() => db.$disconnect());
