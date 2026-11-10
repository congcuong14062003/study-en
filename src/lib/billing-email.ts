import nodemailer from "nodemailer";

const defaultBillingAdminEmail = "cuongkoi1406@gmail.com";

function createBillingTransport() {
  const { SMTP_HOST, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_FROM) {
    throw new Error("SMTP_HOST and SMTP_FROM are required to send billing alerts.");
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });
  return { transport, from: SMTP_FROM };
}

function appUrl(path: string) {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  return baseUrl ? `${baseUrl.replace(/\/$/, "")}${path}` : path;
}

export async function sendBillingReviewEmail(input: {
  orderId: string;
  providerId: string;
  amount: number;
  learnerName: string | null;
  learnerEmail: string;
  reportedAt: Date;
}) {
  const { transport, from } = createBillingTransport();
  const adminEmail =
    process.env.BILLING_ADMIN_EMAIL?.trim() || defaultBillingAdminEmail;

  await transport.sendMail({
    from,
    to: adminEmail,
    subject: `EnglishMaster: đơn Premium chờ duyệt ${input.providerId}`,
    text: [
      "Có học viên báo đã chuyển khoản cho đơn Premium.",
      `Mã đơn: ${input.providerId}`,
      `Số tiền: ${input.amount.toLocaleString("vi-VN")} VND`,
      `Học viên: ${input.learnerName || "Chưa có tên"} (${input.learnerEmail})`,
      `Thời gian báo: ${input.reportedAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`,
      `Mở trang đối soát: ${appUrl("/admin/subscriptions")}`,
      `Mã đơn nội bộ: ${input.orderId}`,
      "Hãy kiểm tra tiền thực nhận trong tài khoản ngân hàng trước khi duyệt. Email này không xác nhận giao dịch đã thành công.",
    ].join("\n"),
  });
}

export async function sendPremiumActivatedEmail(input: {
  providerId: string;
  amount: number;
  learnerName: string | null;
  learnerEmail: string;
  premiumUntil: Date | null;
}) {
  const { transport, from } = createBillingTransport();
  const validity = input.premiumUntil
    ? `Gói có hiệu lực đến ${input.premiumUntil.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.`
    : "Gói Premium không giới hạn thời hạn.";

  await transport.sendMail({
    from,
    to: input.learnerEmail,
    subject: `EnglishMaster: Premium đã được kích hoạt · ${input.providerId}`,
    text: [
      `Xin chào ${input.learnerName || "bạn"},`,
      "Khoản thanh toán Premium của bạn đã được xác nhận.",
      `Mã đơn: ${input.providerId}`,
      `Số tiền: ${input.amount.toLocaleString("vi-VN")} VND`,
      validity,
      `Vào trang gói học: ${appUrl("/billing")}`,
      "Cảm ơn bạn đã đồng hành cùng EnglishMaster.",
    ].join("\n\n"),
  });
}
