import nodemailer from "nodemailer";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createVerificationCode,
  hashVerificationCode,
} from "@/lib/email-verification";
import {
  ApiError,
  checkOrigin,
  clientRateLimit,
  errorResponse,
  rateLimit,
  readJson,
} from "@/lib/security";

const emailSchema = z.email().toLowerCase().trim();
const resendMessage =
  "Nếu email đang chờ xác thực, mã mới sẽ được gửi khi có thể.";

export async function sendVerificationEmail(email: string, code: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
    throw new ApiError("Chức năng gửi email chưa được cấu hình.", 503);
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,
  });

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Mã xác thực EnglishMaster",
    text: `Mã xác thực của bạn là ${code}. Mã có hiệu lực trong 10 phút. Nếu không đăng ký tài khoản, hãy bỏ qua email này.`,
  });
}

export async function verifyEmail(request: Request) {
  try {
    checkOrigin(request);
    await clientRateLimit(request.headers, "verify-email", 30, 3600);
    await rateLimit("verify-email:capacity", 1000, 3600);

    const { email, code } = z
      .object({
        email: emailSchema,
        code: z.string().regex(/^\d{6}$/, "Mã phải gồm 6 chữ số."),
      })
      .parse(await readJson(request));

    await rateLimit(`verify-email:${email}`, 10, 60);

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailVerificationRequired: true,
        banned: true,
      },
    });

    const invalidMessage = "Mã không hợp lệ hoặc đã hết hạn.";
    if (
      !user ||
      user.banned ||
      !user.emailVerificationRequired ||
      user.emailVerified
    ) {
      throw new ApiError(invalidMessage);
    }

    const codeHash = hashVerificationCode(user.email, code);
    const now = new Date();

    const verified = await db.$transaction(async (tx) => {
      // Xóa có điều kiện: mã đúng, chưa hết hạn, chưa vượt quá 5 lần thử.
      // Chỉ request đầu tiên xóa được mã mới được xác thực.
      const consumed = await tx.emailVerificationCode.deleteMany({
        where: {
          userId: user.id,
          codeHash,
          expiresAt: { gt: now },
          attempts: { lt: 5 },
        },
      });

      if (consumed.count === 1) {
        await tx.user.update({
          where: { id: user.id },
          data: { emailVerified: now },
        });
        return true;
      }

      // Mã sai: tăng số lần thử, nhưng không tăng với mã đã hết hạn.
      await tx.emailVerificationCode.updateMany({
        where: {
          userId: user.id,
          expiresAt: { gt: now },
          attempts: { lt: 5 },
        },
        data: { attempts: { increment: 1 } },
      });

      return false;
    });

    if (!verified) throw new ApiError(invalidMessage);

    return Response.json({
      message: "Email đã được xác thực. Bạn có thể đăng nhập.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function resendVerificationEmail(request: Request) {
  try {
    checkOrigin(request);
    // Use a new key so existing one-hour counters do not keep users locked out.
    await clientRateLimit(request.headers, "resend-email-minute", 10, 60);
    await rateLimit("resend-email:capacity", 1000, 3600);

    const { email } = z
      .object({ email: emailSchema })
      .parse(await readJson(request));

    await rateLimit(`resend-email-minute:${email}`, 5, 60);

    if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
      throw new ApiError("Chức năng gửi email chưa được cấu hình.", 503);
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailVerificationRequired: true,
        banned: true,
      },
    });

    // Cùng một phản hồi cho email không tồn tại/đã xác thực.
    if (
      !user ||
      user.banned ||
      !user.emailVerificationRequired ||
      user.emailVerified
    ) {
      return Response.json({ message: resendMessage });
    }

    const code = createVerificationCode();
    const codeHash = hashVerificationCode(user.email, code);
    const now = new Date();

    // Mỗi mã mới cách mã trước tối thiểu 60 giây.
    const rotated = await db.emailVerificationCode.updateMany({
      where: {
        userId: user.id,
        sentAt: { lte: new Date(now.getTime() - 60_000) },
      },
      data: {
        codeHash,
        expiresAt: new Date(now.getTime() + 10 * 60_000),
        attempts: 0,
        sentAt: now,
      },
    });

    if (rotated.count !== 1) {
      return Response.json({ message: resendMessage });
    }

    try {
      await sendVerificationEmail(user.email, code);
    } catch (error) {
      // Gửi lỗi thì cho phép thử lại ngay; không ghi mã ra log.
      await db.emailVerificationCode.updateMany({
        where: { userId: user.id, codeHash },
        data: { sentAt: new Date(0) },
      });
      console.error(
        "Không gửi được email xác thực:",
        error instanceof Error ? error.message : "Unknown error",
      );
      throw new ApiError("Chưa gửi được email. Vui lòng thử lại.", 503);
    }

    return Response.json({ message: resendMessage });
  } catch (error) {
    return errorResponse(error);
  }
}
