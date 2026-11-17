const BRAND = "StudyToMaster";

export function verificationEmailContent(code: string) {
  if (!/^\d{6}$/.test(code)) throw new Error("Mã xác thực không hợp lệ.");

  const verificationUrl = new URL(
    "/verify-email",
    process.env.NEXTAUTH_URL || "http://localhost:3000",
  ).toString();
  const digits = [...code]
    .map(
      (digit) =>
        `<span style="display:inline-block;width:38px;line-height:44px;margin:0 4px 4px 0;border-radius:7px;background:#ffffff;color:#19243c;text-align:center;font:700 24px/44px Arial,sans-serif;">${digit}</span>`,
    )
    .join("");

  return {
    subject: `Mã xác thực tài khoản ${BRAND}`,
    text: `Mã xác thực ${BRAND} của bạn là ${code}. Mã có hiệu lực trong 10 phút. Mở ${verificationUrl} để nhập mã. Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.`,
    html: `<!doctype html>
<html lang="vi">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f7f8fc;color:#19243c;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f7f8fc;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border:1px solid #e7ebf2;border-radius:16px;">
          <tr><td style="padding:30px 28px 12px;">
            <div style="font-size:20px;font-weight:800;color:#5146e5;">${BRAND}</div>
            <h1 style="margin:26px 0 10px;font-size:24px;line-height:1.3;color:#19243c;">Xác thực email của bạn</h1>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#536078;">Nhập mã dưới đây để hoàn tất đăng ký tài khoản.</p>
            <div style="padding:20px 18px;background:#eff3f9;border-radius:12px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#27354d;">Mã xác thực của bạn</p>
              <div style="white-space:nowrap;">${digits}</div>
              <p style="margin:8px 0 18px;font-size:13px;line-height:1.5;color:#63718a;">Mã có hiệu lực trong <strong>10 phút</strong>.</p>
              <a href="${verificationUrl}" style="display:inline-block;padding:13px 20px;border-radius:9px;background:#075d97;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Mở trang xác thực</a>
            </div>
            <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#78849a;">Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>
          </td></tr>
          <tr><td style="padding:18px 28px 26px;font-size:12px;color:#9aa4b5;">${BRAND} · Học ngoại ngữ mỗi ngày</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}
