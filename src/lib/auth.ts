import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { ApiError, rateLimit, clientRateLimit } from "./security";
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db), secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, pages: { signIn: "/login", error: "/login" },
    providers: [Credentials({ name: "Email", credentials: { email: { label: "Email", type: "email" }, password: { label: "Mật khẩu", type: "password" }, remember: { label: "Ghi nhớ đăng nhập", type: "text" } }, async authorize(credentials, request) {
                const parsed = z.object({ email: z.email().toLowerCase().trim(), password: z.string().min(1).max(72) }).safeParse(credentials);
                if (!parsed.success)
                    return null;
                await clientRateLimit(request.headers || {}, "login", 40, 900);
                await rateLimit("login:capacity", 2000, 900);
                await rateLimit(`login:${parsed.data.email}`, 8, 900);
                const user = await db.user.findUnique({ where: { email: parsed.data.email } });
                const valid = await compare(parsed.data.password, user?.passwordHash || "$2b$12$0oPxFA2Fn8VnAyNBACbdUuTlhpjAA.JWDwaRh3Dq.jBYvUDxUZL4G");
                if (!user || !user.passwordHash || !valid || user.banned)
                    return null;
                return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, sessionVersion: user.sessionVersion, remember: credentials?.remember === "true" };
            } }),
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })] : []),
        ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? [Facebook({ clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET })] : [])],
    callbacks: { async signIn({ user }) {
            const current = await db.user.findUnique({ where: { email: user.email || "" } });
            return !current?.banned;
        }, async jwt({ token, user }) {
            if (user) {
                const current = await db.user.findUnique({ where: { id: user.id } });
                token.id = user.id;
                token.role = current?.role || "USER";
                if (user.sessionVersion !== undefined && current?.sessionVersion !== user.sessionVersion)
                    throw new Error("Session changed. Please sign in again.");
                token.sessionVersion = user.sessionVersion ?? current?.sessionVersion ?? 0;
                token.deadline = Date.now() + (user.remember === false ? 8 * 3600000 : 30 * 86400000);
            }
            if (token.deadline && token.deadline < Date.now())
                token.id = "";
            return token;
        }, async session({ session, token }) {
            session.user.id = token.id;
            session.user.role = token.role;
            session.user.sessionVersion = token.sessionVersion;
            if (token.deadline)
                session.expires = new Date(token.deadline).toISOString();
            return session;
        } },
    events: { async createUser({ user }) {
            await db.user.update({ where: { id: user.id }, data: { profile: { create: {} }, progress: { create: {} }, subscription: { create: {} } } });
        } }
};
export async function currentUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return null;
    const user = await db.user.findUnique({ where: { id: session.user.id }, include: { profile: true, progress: true, subscription: true } });
    if (!user || user.banned || user.sessionVersion !== session.user.sessionVersion)
        return null;
    const { passwordHash: _, ...safe } = user;
    return safe;
}
export async function requireUser() {
    const user = await currentUser();
    if (!user)
        throw new ApiError("Vui lòng đăng nhập để tiếp tục.", 401);
    return user;
}
export async function requireAdmin() {
    const user = await requireUser();
    if (user.role !== "ADMIN")
        throw new ApiError("Bạn không có quyền truy cập trang quản trị.", 403);
    return user;
}
