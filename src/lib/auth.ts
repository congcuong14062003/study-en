import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter, AdapterAccount } from "next-auth/adapters";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { ApiError, rateLimit, clientRateLimit } from "./security";
import { canAttachFirstOAuthAccount } from "./independent-auth";

const independentProviderAdapter: Adapter = {
  ...PrismaAdapter(db),
  // No email sign-in provider is configured. OAuth identities must be resolved
  // by provider/account ID, never by an email shared with another user.
  async getUserByEmail() {
    return null;
  },
  async linkAccount(account: AdapterAccount) {
    const owner = await db.user.findUnique({
      where: { id: account.userId },
      select: {
        passwordHash: true,
        accounts: { select: { id: true }, take: 1 },
      },
    });
    // NextAuth otherwise links a new OAuth provider to an active session.
    // Each provider must have its own User, including when already signed in.
    if (!canAttachFirstOAuthAccount(owner)) {
      throw new Error("Independent sign-in methods cannot be linked.");
    }
    return db.account.create({ data: account });
  },
};

export const authOptions: NextAuthOptions = {
  adapter: independentProviderAdapter,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
        remember: { label: "Ghi nhớ đăng nhập", type: "text" },
      },
      async authorize(credentials, request) {
        const parsed = z
          .object({
            email: z.email().toLowerCase().trim(),
            password: z.string().min(1).max(72),
          })
          .safeParse(credentials);
        if (!parsed.success) return null;
        await clientRateLimit(request.headers || {}, "login", 40, 900);
        await rateLimit("login:capacity", 2000, 900);
        await rateLimit(`login:${parsed.data.email}`, 8, 900);
        const user = await db.user.findFirst({
          where: {
            email: parsed.data.email,
            passwordHash: { not: null },
          },
        });
        const valid = await compare(
          parsed.data.password,
          user?.passwordHash ||
            "$2b$12$0oPxFA2Fn8VnAyNBACbdUuTlhpjAA.JWDwaRh3Dq.jBYvUDxUZL4G",
        );
        if (!user || !user.passwordHash || !valid || user.banned) {
          return null;
        }

        if (user.emailVerificationRequired && !user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          sessionVersion: user.sessionVersion,
          remember: credentials?.remember === "true",
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (
        process.env.NODE_ENV === "development" &&
        account?.provider === "facebook"
      ) {
        const facebookProfile = profile as
          | { id?: string; name?: string; email?: string; picture?: unknown }
          | undefined;
        console.info("[auth][facebook] profile received: ", profile);
      }
      const current = user.id
        ? await db.user.findUnique({ where: { id: user.id } })
        : null;
      return (
        !current?.banned &&
        !(current?.emailVerificationRequired && !current.emailVerified)
      );
    },
    async jwt({ token, user }) {
      if (user) {
        const current = await db.user.findUnique({ where: { id: user.id } });
        token.id = user.id;
        token.role = current?.role || "USER";
        if (
          user.sessionVersion !== undefined &&
          current?.sessionVersion !== user.sessionVersion
        )
          throw new Error("Session changed. Please sign in again.");
        token.sessionVersion =
          user.sessionVersion ?? current?.sessionVersion ?? 0;
        token.deadline =
          Date.now() + (user.remember === false ? 8 * 3600000 : 30 * 86400000);
      }
      if (token.deadline && token.deadline < Date.now()) token.id = "";
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.sessionVersion = token.sessionVersion;
      if (token.deadline)
        session.expires = new Date(token.deadline).toISOString();
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: {
          profile: { create: {} },
          progress: { create: {} },
          subscription: { create: {} },
        },
      });
    },
  },
};
export async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true, progress: true, subscription: true },
  });
  if (
    !user ||
    user.banned ||
    (user.emailVerificationRequired && !user.emailVerified) ||
    user.sessionVersion !== session.user.sessionVersion
  )
    return null;
  const { passwordHash: _, ...safe } = user;
  return safe;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new ApiError("Vui lòng đăng nhập để tiếp tục.", 401);
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN")
    throw new ApiError("Bạn không có quyền truy cập trang quản trị.", 403);
  return user;
}
