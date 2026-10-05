"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { api } from "@/lib/utils";

export function VerifyEmailForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    setEmail(sessionStorage.getItem("pendingVerificationEmail") || "");

    if (sessionStorage.getItem("verificationEmailSent") === "false") {
      setError("Chưa gửi được mã. Vui lòng bấm “Gửi lại mã”.");
    }
    sessionStorage.removeItem("verificationEmailSent");
  }, []);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await api<{ message: string }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
        }),
      });

      sessionStorage.removeItem("pendingVerificationEmail");
      setVerified(true);
      setMessage(result.message);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không xác thực được email.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await api<{ message: string }>(
        "/auth/resend-verification",
        {
          method: "POST",
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        },
      );
      setMessage(result.message);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Chưa gửi lại được mã.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-story">
        <Brand />
        <div>
          <h1>Xác thực email của bạn.</h1>
          <p>Nhập mã 6 chữ số đã được gửi đến hộp thư của bạn.</p>
        </div>
        <small>© EnglishMaster</small>
      </div>

      <div className="auth-form-panel">
        <div className="auth-top">
          <Link href="/" className="text-link">
            ← Trang chủ
          </Link>
          <ThemeToggle />
        </div>

        <div className="auth-form-content">
          <h2>Nhập mã xác thực</h2>
          <p>Mã có hiệu lực trong 10 phút. Hãy kiểm tra cả thư mục Spam.</p>

          {message && (
            <p className="success-message" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          {verified ? (
            <Link href="/login" className="text-link">
              Đến trang đăng nhập →
            </Link>
          ) : (
            <>
              <form onSubmit={verify}>
                <div className="field">
                  <label htmlFor="verify-email">Email</label>
                  <input
                    className="input"
                    id="verify-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="verify-code">Mã 6 chữ số</label>
                  <input
                    className="input"
                    id="verify-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                  />
                </div>

                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "Đang kiểm tra..." : "Xác thực email"}
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                disabled={busy || !email.trim()}
                onClick={resend}
                className="w-full"
              >
                Gửi lại mã
              </Button>
            </>
          )}

          <div className="auth-bottom">
            <Link href="/login">Trở lại đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
