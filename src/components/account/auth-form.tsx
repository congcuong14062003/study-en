"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, BookOpen, CheckCircle2, Eye, EyeOff, Loader2, Sparkles, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { api } from "@/lib/utils";
import { registerSchema } from "@/lib/validation";
export function AuthForm({ mode, }: {
    mode: "login" | "register" | "forgot-password" | "reset-password";
}) {
    const router = useRouter(), params = useSearchParams();
    const [busy, setBusy] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState(""), [show, setShow] = useState(false), [config, setConfig] = useState({ google: false, facebook: false });
    const register = mode === "register", login = mode === "login";
    useEffect(() => {
        api<typeof config>("/config")
            .then(setConfig)
            .catch(() => {
        });
    }, []);
    const title = register
        ? "Hành trình mới bắt đầu từ đây."
        : login
            ? "Rất vui được gặp lại bạn."
            : mode === "forgot-password"
                ? "Lấy lại quyền truy cập."
                : "Tạo mật khẩu mới.";
    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setBusy(true);
        setError("");
        const form = new FormData(e.currentTarget);
        const email = String(form.get("email") || "")
            .toLowerCase()
            .trim(), password = String(form.get("password") || "");
        try {
            if (register) {
                const values = registerSchema.parse({
                    name: form.get("name"),
                    email,
                    password,
                    confirmPassword: form.get("confirmPassword"),
                });
                await api("/auth/register", {
                    method: "POST",
                    body: JSON.stringify(values),
                });
            }
            if (register || login) {
                const result = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                });
                if (result?.error)
                    throw new Error("Email hoặc mật khẩu không đúng, hoặc bạn đã thử quá nhiều lần.");
                const target = params.get("callbackUrl");
                const safeTarget = target
                    ? new URL(target, window.location.origin)
                    : null;
                router.push(register
                    ? "/onboarding"
                    : safeTarget && safeTarget.origin === window.location.origin
                        ? `${safeTarget.pathname}${safeTarget.search}`
                        : "/dashboard");
                router.refresh();
            }
            else if (mode === "forgot-password") {
                const result = await api<{
                    message: string;
                }>("/auth/forgot-password", {
                    method: "POST",
                    body: JSON.stringify({ email }),
                });
                setSuccess(result.message);
            }
            else {
                if (password !== form.get("confirmPassword"))
                    throw new Error("Mật khẩu xác nhận không khớp.");
                const result = await api<{
                    message: string;
                }>("/auth/reset-password", {
                    method: "POST",
                    body: JSON.stringify({ password, token: params.get("token") }),
                });
                setSuccess(result.message);
            }
        }
        catch (e) {
            if (e && typeof e === "object" && "issues" in e)
                setError((e.issues as {
                    message: string;
                }[])[0].message);
            else
                setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
        }
        finally {
            setBusy(false);
        }
    }
    return (<div className="auth-page">
      <div className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow">A LITTLE EVERY DAY. A LONG WAY TO GO.</span>
          <h1>
            Tiếng Anh tốt hơn.
            <br />
            <span>Thế giới rộng hơn.</span>
          </h1>
          <p>
            Dành một chút thời gian hôm nay cho phiên bản tự tin hơn của bạn
            ngày mai.
          </p>
          <div className="auth-benefits">
            {[
            "Lộ trình phù hợp với trình độ của bạn",
            "Học mọi kỹ năng trong cùng một nơi",
            "Lưu tiến độ, thấy mình tiến bộ mỗi ngày",
        ].map((t) => (<div key={t}>
                <CheckCircle2 size={19}/>
                {t}
              </div>))}
          </div>
          <div className="auth-quote">
            <BookOpen size={35}/>
            <p>
              “The secret of getting ahead
              <br />
              is getting started.”
            </p>
            <span>Bước đầu tiên luôn bắt đầu từ bạn.</span>
          </div>
        </div>
        <small>© EnglishMaster · Made for your next chapter.</small>
      </div>
      <div className="auth-form-panel">
        <div className="auth-top">
          <Link href="/" className="text-link">
            ← Trang chủ
          </Link>
          <ThemeToggle />
        </div>
        <div className="auth-form-content">
          <span className="icon-box">
            <Sparkles size={24}/>
          </span>
          <h2>{title}</h2>
          <p>
            {register
            ? "Tạo tài khoản miễn phí và tìm lộ trình phù hợp với bạn."
            : login
                ? "Tiếp tục hành trình tiếng Anh của bạn hôm nay."
                : "Chúng tôi sẽ giúp bạn trở lại hành trình học tập."}
          </p>
          {(login || register) && (config.google || config.facebook) && (<>
              <div className="oauth-buttons">
                {config.google && (<Button variant="outline" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
                    Tiếp tục với Google
                  </Button>)}
                {config.facebook && (<Button variant="outline" onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })}>
                    Tiếp tục với Facebook
                  </Button>)}
              </div>
              <div className="auth-divider">hoặc bằng email</div>
            </>)}
          {success ? (<div role="status" className="success-message">
              {success}
              <div className="mt-4">
                <Link href="/login" className="text-link">
                  Trở lại đăng nhập <ArrowRight size={15}/>
                </Link>
              </div>
            </div>) : (<form onSubmit={submit}>
              {register && (<div className="field">
                  <label htmlFor="name">Họ và tên</label>
                  <input className="input" id="name" name="name" autoComplete="name" placeholder="Nguyễn Văn Anh" required minLength={2} maxLength={80}/>
                </div>)}
              {mode !== "reset-password" && (<div className="field">
                  <label htmlFor="email">Địa chỉ email</label>
                  <input className="input" id="email" name="email" type="email" autoComplete="email" placeholder="ban@example.com" required maxLength={254}/>
                </div>)}
              {mode !== "forgot-password" && (<div className="field">
                  <label htmlFor="password">Mật khẩu</label>
                  <div className="password-field">
                    <input className="input" id="password" name="password" type={show ? "text" : "password"} autoComplete={login ? "current-password" : "new-password"} placeholder={login
                    ? "Nhập mật khẩu của bạn"
                    : "Ít nhất 8 ký tự, có chữ và số"} required minLength={login ? 1 : 8} maxLength={64}/>
                    <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                      {show ? <EyeOff size={17}/> : <Eye size={17}/>}
                    </button>
                  </div>
                </div>)}
              {(register || mode === "reset-password") && (<div className="field">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                  <input className="input" id="confirmPassword" name="confirmPassword" type={show ? "text" : "password"} autoComplete="new-password" placeholder="Nhập lại mật khẩu" required minLength={8}/>
                </div>)}
              {login && (<div className="flex-row justify-between mb-4">
                  <span className="field-help">
                    Duy trì đăng nhập trên thiết bị này trong 30 ngày
                  </span>
                  <Link className="text-link" href="/forgot-password">
                    Quên mật khẩu?
                  </Link>
                </div>)}
              {error && (<p className="error-message" role="alert">
                  {error}
                </p>)}
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? (<Loader2 className="spin" size={18}/>) : (<>
                    {register
                    ? "Tạo tài khoản miễn phí"
                    : login
                        ? "Đăng nhập"
                        : mode === "forgot-password"
                            ? "Gửi liên kết khôi phục"
                            : "Cập nhật mật khẩu"}
                    <ArrowRight size={17}/>
                  </>)}
              </Button>
            </form>)}
          <div className="auth-bottom">
            {login ? (<>
                Bạn chưa có tài khoản?{" "}
                <Link href="/register">Đăng ký miễn phí</Link>
              </>) : register ? (<>
                Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
              </>) : (<Link href="/login">Trở lại đăng nhập</Link>)}
          </div>
        </div>
        <div className="auth-footnote">
          <CheckCircle2 size={13}/> Tiến độ của bạn được lưu an toàn trong tài
          khoản.
        </div>
      </div>
    </div>);
}
