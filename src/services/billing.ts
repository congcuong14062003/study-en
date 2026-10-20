import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/security";
import { lockUser } from "./learning";
import { billingPeriodSchema, billingSettingsSchema, defaultBillingSettings, paymentReviewSchema, premiumExtension, transferReportSchema, vietQrUrl } from "@/lib/billing";
import { paginationMeta, readPagination } from "@/lib/pagination";
import type { Prisma } from "@prisma/client";

const method = "bank_transfer";
const openStatuses = ["awaiting_transfer", "pending_review"];
// Do not return image bytes or internal bank reconciliation references to learners.
const orderSelect = {
  id: true, providerId: true, userId: true, amount: true, currency: true, status: true,
  period: true, bankName: true, bankCode: true, qrCodeUrl: true, accountName: true, accountNumber: true, instructions: true,
  qrImageId: true, receiptId: true, transferNote: true, reportedAt: true, reviewedAt: true,
  reviewNote: true, createdAt: true, premiumUntil: true,
} satisfies Prisma.PaymentSelect;
const settingsSelect = {
  enabled: true, bankName: true, bankCode: true, accountName: true, accountNumber: true, instructions: true,
  monthlyAmount: true, yearlyAmount: true,
} satisfies Prisma.BankTransferSettingsSelect;

export async function readBillingSettings() {
  return await db.bankTransferSettings.findUnique({ where: { id: "bank-transfer" }, select: settingsSelect }) || defaultBillingSettings;
}
export async function saveBillingSettings(adminId: string, raw: unknown) {
  const data = billingSettingsSchema.parse(raw);
  return db.bankTransferSettings.upsert({
    where: { id: "bank-transfer" }, create: { id: "bank-transfer", ...data, updatedBy: adminId },
    update: { ...data, updatedBy: adminId }, select: settingsSelect,
  });
}
export async function billingAccount(userId: string) {
  const [orders, subscription] = await Promise.all([
    db.payment.findMany({ where: { userId, method }, select: orderSelect, orderBy: { createdAt: "desc" }, take: 100 }),
    db.subscription.findUnique({ where: { userId }, select: { plan: true, status: true, currentPeriodEnd: true } }),
  ]);
  return { orders, subscription };
}
export async function createTransferOrder(userId: string, raw: unknown) {
  const period = billingPeriodSchema.parse(raw);
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const existing = await tx.payment.findFirst({ where: { userId, method, status: { in: openStatuses } }, select: orderSelect });
    if (existing) return existing; // Repeated clicks must not create duplicate orders.
    const settings = await tx.bankTransferSettings.findUnique({ where: { id: "bank-transfer" } });
    if (!settings?.enabled)
      throw new ApiError("Chuyển khoản Premium chưa được mở. Vui lòng quay lại sau.", 409);
    if (!settings.bankName || !vietQrUrl(settings))
      throw new ApiError("Quản trị viên cần cập nhật mã ngân hàng/BIN và thông tin nhận tiền để tự sinh QR.", 409);
    const sub = await tx.subscription.findUnique({ where: { userId } });
    if (sub?.plan === "PREMIUM" && sub.status === "active" && !sub.currentPeriodEnd)
      throw new ApiError("Bạn đã có Premium không giới hạn thời hạn, không cần mua thêm.", 409);
    const providerId = `EM${randomBytes(6).toString("hex").toUpperCase()}`;
    const amount = period === "yearly" ? settings.yearlyAmount : settings.monthlyAmount;
    const qrCodeUrl = vietQrUrl(settings, { amount, reference: providerId });
    if (!qrCodeUrl) throw new ApiError("Thông tin tạo QR của gói chưa hợp lệ.", 409);
    return tx.payment.create({ data: {
      userId, method, providerId, amount,
      period, currency: "VND", status: "awaiting_transfer",
      bankName: settings.bankName, bankCode: settings.bankCode, qrCodeUrl,
      accountName: settings.accountName, accountNumber: settings.accountNumber,
      instructions: settings.instructions,
    }, select: orderSelect });
  });
}
export async function changeTransferOrder(userId: string, id: string, action: "report" | "cancel", raw: unknown) {
  const data = action === "report" ? transferReportSchema.parse(raw) : null;
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const order = await tx.payment.findFirst({ where: { id, userId, method }, select: orderSelect });
    if (!order) throw new ApiError("Không tìm thấy đơn thanh toán.", 404);
    if (action === "report" && order.status === "pending_review") return order;
    if (action === "cancel" && order.status === "cancelled") return order;
    if (order.status !== "awaiting_transfer" && !(action === "report" && order.status === "rejected"))
      throw new ApiError("Không thể thay đổi đơn đã gửi đối soát hoặc đã được xử lý.", 409);
    if (order.status === "rejected" && await tx.payment.findFirst({ where: { userId, method, status: { in: openStatuses } }, select: { id: true } }))
      throw new ApiError("Bạn có đơn khác đang mở. Hãy liên hệ admin với mã đơn cũ để đối soát, không chuyển thêm tiền.", 409);
    const result = await tx.payment.update({ where: { id }, data: action === "report"
      ? { status: "pending_review", reportedAt: new Date(), transferNote: data!.transferNote }
      : { status: "cancelled" }, select: orderSelect });
    if (action === "report") {
      const admins = await tx.user.findMany({ where: { role: "ADMIN", banned: false }, select: { id: true } });
      await tx.notification.createMany({ data: admins.map((admin) => ({
        userId: admin.id, type: "payment", title: "Có đơn Premium chờ đối soát",
        body: `${order.providerId} · ${order.amount.toLocaleString("vi-VN")} VND. Hãy kiểm tra tiền thực nhận trước khi duyệt.`, href: "/admin/subscriptions",
      })) });
    }
    return result;
  });
}
export async function attachTransferReceipt(userId: string, id: string, image: { data: Uint8Array<ArrayBuffer>; contentType: string }) {
  return db.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const order = await tx.payment.findFirst({ where: { id, userId, method } });
    if (!order) throw new ApiError("Không tìm thấy đơn thanh toán.", 404);
    if (!["awaiting_transfer", "rejected"].includes(order.status)) throw new ApiError("Chỉ tải biên lai trước khi gửi yêu cầu đối soát.", 409);
    const receipt = await tx.paymentImage.create({ data: { kind: "receipt", ...image } });
    const result = await tx.payment.update({ where: { id }, data: { receiptId: receipt.id }, select: orderSelect });
    if (order.receiptId) await tx.paymentImage.delete({ where: { id: order.receiptId } });
    return result;
  });
}
export async function adminBilling(search: URLSearchParams) {
  const status = search.get("status");
  const q = (search.get("q") || "").trim().slice(0, 100);
  const where: Prisma.PaymentWhereInput = { method,
    ...(status && ["awaiting_transfer", "pending_review", "paid", "rejected", "cancelled"].includes(status) ? { status } : {}),
    ...(q ? { OR: [
      { providerId: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ] } : {}),
  };
  const { page, pageSize, skip } = readPagination(search, 20, 50);
  const [settings, orders, total, pendingCount] = await Promise.all([
    readBillingSettings(),
    db.payment.findMany({ where, select: { ...orderSelect, bankTransactionId: true, reviewedBy: true, user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
    db.payment.count({ where }), db.payment.count({ where: { method, status: "pending_review" } }),
  ]);
  return { settings, orders, pagination: paginationMeta(total, page, pageSize), pendingCount };
}
export async function reviewTransferOrder(adminId: string, id: string, raw: unknown) {
  const decision = paymentReviewSchema.parse(raw);
  const target = await db.payment.findFirst({ where: { id, method }, select: { userId: true } });
  if (!target) throw new ApiError("Không tìm thấy đơn thanh toán.", 404);
  if (target.userId === adminId) throw new ApiError("Không được duyệt đơn của chính mình.", 403);
  return db.$transaction(async (tx) => {
    await lockUser(tx, target.userId);
    const admin = await tx.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== "ADMIN" || admin.banned) throw new ApiError("Bạn không có quyền đối soát.", 403);
    const order = await tx.payment.findUniqueOrThrow({ where: { id } });
    if (order.status === "paid" && decision.decision === "approve") {
      if (order.bankTransactionId !== decision.bankTransactionId) throw new ApiError("Đơn đã được xác nhận bằng mã giao dịch khác.", 409);
      return tx.payment.findUniqueOrThrow({ where: { id }, select: orderSelect });
    }
    if (order.status !== "pending_review") throw new ApiError("Chỉ xử lý đơn đang chờ đối soát.", 409);
    if (decision.decision === "approve" && decision.receivedAmount !== order.amount)
      throw new ApiError("Số tiền thực nhận phải khớp với số tiền của đơn.", 409);
    const now = new Date();
    if (decision.decision === "reject") {
      const result = await tx.payment.update({ where: { id }, data: {
        status: "rejected", reviewedAt: now, reviewedBy: adminId, reviewNote: decision.reviewNote,
      }, select: orderSelect });
      await tx.notification.create({ data: { userId: order.userId, type: "payment", title: "Đơn Premium cần kiểm tra lại", body: `${order.providerId}: ${decision.reviewNote}`, href: "/billing" } });
      return result;
    }
    if (await tx.payment.findUnique({ where: { bankTransactionId: decision.bankTransactionId } }))
      throw new ApiError("Mã giao dịch ngân hàng này đã được dùng cho đơn khác.", 409);
    const user = await tx.user.findUniqueOrThrow({ where: { id: order.userId }, include: { subscription: true } });
    if (user.banned) throw new ApiError("Tài khoản này đang bị khóa. Hãy kiểm tra trước khi mở gói.", 409);
    const period = billingPeriodSchema.parse(order.period);
    const end = premiumExtension(user.subscription, period, now);
    await tx.subscription.upsert({ where: { userId: order.userId },
      create: { userId: order.userId, plan: "PREMIUM", status: "active", currentPeriodEnd: end },
      update: { plan: "PREMIUM", status: "active", currentPeriodEnd: end },
    });
    if (user.role !== "ADMIN") await tx.user.update({ where: { id: order.userId }, data: { role: "PREMIUM" } });
    const result = await tx.payment.update({ where: { id }, data: {
      status: "paid", reviewedAt: now, reviewedBy: adminId, reviewNote: decision.reviewNote,
      bankTransactionId: decision.bankTransactionId, premiumUntil: end,
    }, select: orderSelect });
    await tx.notification.create({ data: { userId: order.userId, type: "payment", title: "Premium đã được kích hoạt!",
      body: `Đã xác nhận thanh toán ${order.providerId}. ${end ? `Gói có hiệu lực đến ${end.toLocaleDateString("vi-VN")}.` : "Gói không giới hạn thời hạn."}`, href: "/billing" } });
    return result;
  });
}
