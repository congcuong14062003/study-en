import { randomBytes, createHash } from "node:crypto";
import { hash } from "bcryptjs";
import nodemailer from "nodemailer";
import { z } from "zod";
import { db } from "@/lib/db";
import { registerSchema, passwordSchema } from "@/lib/validation";
import { ApiError, checkOrigin, errorResponse, readJson, rateLimit, clientRateLimit } from "@/lib/security";
export async function register(request: Request) {
    try {
        checkOrigin(request);
        await clientRateLimit(request.headers, "register", 10, 3600);
        await rateLimit("register:capacity", 1000, 3600);
        const values = registerSchema.parse(await readJson(request));
        await rateLimit(`register:${values.email}`, 4, 3600);
        const passwordHash = await hash(values.password, 12);
        const user = await db.user.create({ data: { name: values.name, email: values.email, passwordHash, profile: { create: {} }, progress: { create: {} }, subscription: { create: {} }, notifications: { create: { title: "Chào mừng đến với EnglishMaster", body: "Hãy bắt đầu bằng một mục tiêu nhỏ và bài kiểm tra trình độ.", type: "welcome", href: "/onboarding" } } }, select: { id: true, name: true, email: true } });
        return Response.json({ user }, { status: 201 });
    }
    catch (e) {
        return errorResponse(e);
    }
}
export async function forgotPassword(request: Request) {
    try {
        checkOrigin(request);
        const { email } = z.object({ email: z.email().toLowerCase().trim() }).parse(await readJson(request));
        await clientRateLimit(request.headers, "reset", 10, 3600);
        await rateLimit("reset:capacity", 1000, 3600);
        await rateLimit(`reset:${email}`, 3, 3600);
        if (!process.env.SMTP_HOST || !process.env.SMTP_FROM)
            throw new ApiError("Email khôi phục chưa được thiết lập. Vui lòng liên hệ quản trị viên.", 503);
        const user = await db.user.findUnique({ where: { email } });
        if (user && !user.banned) {
            const token = randomBytes(32).toString("hex");
            const tokenHash = createHash("sha256").update(token).digest("hex");
            await db.passwordReset.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
            const origin = new URL(process.env.NEXTAUTH_URL!).origin;
            const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_PORT === "465", auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined });
            await transport.sendMail({ from: process.env.SMTP_FROM, to: email, subject: "Đặt lại mật khẩu EnglishMaster", text: `Mở liên kết sau để đặt lại mật khẩu trong 30 phút: ${origin}/reset-password?token=${token}\nNếu bạn không yêu cầu, hãy bỏ qua email này.` });
        }
        return Response.json({ message: "Nếu email này đã được đăng ký, bạn sẽ nhận được hướng dẫn khôi phục." });
    }
    catch (e) {
        return errorResponse(e);
    }
}
export async function resetPassword(request: Request) {
    try {
        checkOrigin(request);
        await rateLimit("reset-confirm:global", 30, 3600);
        const { token, password } = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password: passwordSchema }).parse(await readJson(request));
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const passwordHash = await hash(password, 12);
        await db.$transaction(async (tx) => {
            const saved = await tx.passwordReset.findUnique({ where: { tokenHash } });
            if (!saved || saved.expiresAt < new Date())
                throw new ApiError("Liên kết đã hết hạn hoặc đã được sử dụng.");
            const deleted = await tx.passwordReset.deleteMany({ where: { id: saved.id, expiresAt: { gt: new Date() } } });
            if (deleted.count !== 1)
                throw new ApiError("Liên kết đã được sử dụng.");
            await tx.user.update({ where: { id: saved.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } });
            await tx.passwordReset.deleteMany({ where: { userId: saved.userId } });
        });
        return Response.json({ message: "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại." });
    }
    catch (e) {
        return errorResponse(e);
    }
}
