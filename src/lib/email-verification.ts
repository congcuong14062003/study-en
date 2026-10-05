import { createHmac, randomInt } from "node:crypto";

export function createVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashVerificationCode(email: string, code: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET chưa được cấu hình.");

  return createHmac("sha256", secret)
    .update(`email-verification:${email}:${code}`)
    .digest("hex");
}
