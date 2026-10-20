import { z } from "zod";

const bankCodeSchema = z.string().trim().toUpperCase().max(30)
  .regex(/^[A-Z0-9]*$/, "Mã ngân hàng/BIN chỉ gồm chữ và số (VD: 970415 hoặc ICB).");
const accountNumberSchema = z.string().trim().transform((v) => v.replace(/\s/g, ""))
  .pipe(z.string().max(19, "Số tài khoản VietQR tối đa 19 ký tự.")
    .regex(/^[A-Za-z0-9]*$/, "Số tài khoản chỉ gồm chữ và số, không có ký tự đặc biệt."));
const receiverSchema = z.object({
  bankCode: bankCodeSchema.refine((v) => v.length >= 2, "Hãy nhập mã ngân hàng/BIN."),
  accountNumber: accountNumberSchema.refine((v) => v.length >= 1, "Hãy nhập số tài khoản."),
  accountName: z.string().trim().min(1).max(150),
});
export const billingSettingsSchema = z.object({
  enabled: z.boolean(),
  bankName: z.string().trim().max(120),
  bankCode: bankCodeSchema,
  accountName: z.string().trim().max(150),
  accountNumber: accountNumberSchema,
  instructions: z.string().trim().max(1000),
  monthlyAmount: z.number().int().min(1000).max(100000000),
  yearlyAmount: z.number().int().min(1000).max(100000000),
}).superRefine((v, ctx) => {
  if (v.enabled && (!v.bankName || !receiverSchema.safeParse(v).success))
    ctx.addIssue({ code: "custom", message: "Cần có tên ngân hàng, mã ngân hàng/BIN, chủ tài khoản và số tài khoản trước khi bật thanh toán. QR sẽ tự sinh, không cần tải ảnh." });
});
export const billingPeriodSchema = z.enum(["monthly", "yearly"]);
export const transferReportSchema = z.object({ transferNote: z.string().trim().max(1000).default("") });
export const paymentReviewSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve"), bankTransactionId: z.string().trim().min(3).max(120).transform((v) => v.toUpperCase()), confirmedReceived: z.literal(true), receivedAmount: z.number().int().positive(), reviewNote: z.string().trim().max(1000).default("") }),
  z.object({ decision: z.literal("reject"), reviewNote: z.string().trim().min(5, "Hãy ghi rõ lý do từ chối.").max(1000) }),
]);
export const paymentStatusLabels: Record<string, string> = {
  awaiting_transfer: "Chờ chuyển khoản", pending_review: "Chờ admin đối soát",
  paid: "Đã xác nhận · Premium đã mở", rejected: "Chưa được xác nhận", cancelled: "Đã hủy",
};
export type BillingSettings = z.infer<typeof billingSettingsSchema>;
export const defaultBillingSettings: BillingSettings = {
  enabled: false, bankName: "", bankCode: "", accountName: "", accountNumber: "", instructions: "",
  monthlyAmount: 199000, yearlyAmount: 1788000,
};
export type TransferOrder = {
  id: string; providerId: string; userId: string; amount: number; currency: string;
  status: string; period: string | null; bankName: string | null; accountName: string | null;
  bankCode: string | null; qrCodeUrl: string | null;
  accountNumber: string | null; instructions: string | null; qrImageId: string | null;
  receiptId: string | null; transferNote: string | null; reportedAt: string | null;
  reviewedAt: string | null; reviewNote: string | null; createdAt: string; premiumUntil: string | null;
  bankTransactionId?: string | null; reviewedBy?: string | null;
  user?: { name: string | null; email: string };
};
export type BillingAccount = {
  orders: TransferOrder[];
  subscription: { plan: string; status: string; currentPeriodEnd: string | null } | null;
};
// Same Quick Link mechanism as luxhomes_server/payment.model.js. Never accept
// a client-provided URL, amount or transfer reference for an actual order.
export function vietQrUrl(receiver: { bankCode?: string | null; accountNumber?: string | null; accountName?: string | null }, payment?: { amount: number; reference: string }) {
  const parsed = receiverSchema.safeParse(receiver);
  if (!parsed.success) return null;
  if (payment && (!Number.isSafeInteger(payment.amount) || payment.amount <= 0 || payment.amount > 9999999999999 || !/^[A-Za-z0-9 ]{1,50}$/.test(payment.reference))) return null;
  const { bankCode, accountNumber, accountName } = parsed.data;
  // VietQR recommends SVG-first; legacy uploaded SVG files remain disallowed.
  const url = new URL(`https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact.svg`);
  url.searchParams.set("accountName", accountName);
  if (payment) {
    url.searchParams.set("amount", String(payment.amount));
    url.searchParams.set("addInfo", payment.reference);
  }
  return url.toString();
}
export function addPremiumMonths(start: Date, months: number) {
  const result = new Date(start);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}
export function premiumExtension(
  subscription: { plan: string; status: string; currentPeriodEnd: Date | null } | null,
  period: "monthly" | "yearly", now = new Date(),
) {
  const active = subscription?.plan === "PREMIUM" && subscription.status === "active";
  if (active && !subscription.currentPeriodEnd) return null; // Preserve lifetime grants.
  const base = active && subscription.currentPeriodEnd! > now ? subscription.currentPeriodEnd! : now;
  return addPremiumMonths(base, period === "yearly" ? 12 : 1);
}
export function paymentImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP") return "image/webp";
  return null;
}
