import nodemailer from "nodemailer";

const defaultBillingAdminEmail = "cuongkoi1406@gmail.com";

export async function sendBillingReviewEmail(input: {
  orderId: string;
  providerId: string;
  amount: number;
  learnerName: string | null;
  learnerEmail: string;
  reportedAt: Date;
}) {
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

  const adminEmail =
    process.env.BILLING_ADMIN_EMAIL?.trim() || defaultBillingAdminEmail;
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  const reviewUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/admin/subscriptions`
    : "/admin/subscriptions";

  await transport.sendMail({
    from: SMTP_FROM,
    to: adminEmail,
    subject: `EnglishMaster: đơn Premium chờ duyệt ${input.providerId}`,
    text: [
      "Có học viên báo đã chuyển khoản cho đơn Premium.",
      `Mã đơn: ${input.providerId}`,
      `Số tiền: ${input.amount.toLocaleString("vi-VN")} VND`,
      `Học viên: ${input.learnerName || "Chưa có tên"} (${input.learnerEmail})`,
      `Thời gian báo: ${input.reportedAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`,
      `Mở trang đối soát: ${reviewUrl}`,
      `Mã đơn nội bộ: ${input.orderId}`,
      "Hãy kiểm tra tiền thực nhận trong tài khoản ngân hàng trước khi duyệt. Email này không xác nhận giao dịch đã thành công.",
    ].join("\n"),
  });
}
