"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, CreditCard, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { api, formatNumber } from "@/lib/utils";
import { paymentStatusLabels, type BillingAccount, type BillingSettings, type TransferOrder } from "@/lib/billing";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { PageHeading } from "@/components/dashboard/dashboard";

export function billingDate(value: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}
async function copy(value: string) {
  try { await navigator.clipboard.writeText(value); toast.success("Đã sao chép"); }
  catch { toast.error("Không sao chép được. Anh/chị có thể chọn và sao chép nội dung bên dưới."); }
}
export async function uploadPaymentImage(path: string, file: File) {
  if (file.size > 2000000) throw new Error("Ảnh phải nhỏ hơn 2 MB.");
  const body = new FormData();
  body.set("file", file);
  const response = await fetch(`/api/billing/${path}`, { method: "POST", body });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Không tải được ảnh (HTTP ${response.status}).`);
  return data;
}
export function BankQr({ url, preview = false }: { url: string; preview?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className="payment-qr-panel">
    {failed ? <div className="payment-warning" role="status">
      <p>Chưa tải được QR từ VietQR. Kiểm tra mã ngân hàng, kết nối mạng hoặc chuyển khoản thủ công theo thông tin bên cạnh.</p>
      <Button type="button" size="sm" variant="outline" onClick={() => setFailed(false)}>Tải lại QR</Button>
    </div> : <img className="payment-qr" src={url} referrerPolicy="no-referrer" alt={preview ? "QR xem trước theo thông tin ngân hàng đang nhập" : "Mã QR chuyển khoản của đơn này"} onError={() => setFailed(true)} />}
    {preview && <p className="field-help">QR xem trước tài khoản nhận, chưa có số tiền hoặc mã đơn. Bấm Lưu cấu hình để áp dụng cho đơn mới.</p>}
  </div>;
}
export function TransferDetails({ order }: { order: TransferOrder }) {
  const qrUrl = order.qrCodeUrl || (order.qrImageId ? `/api/billing/images/${order.qrImageId}` : null);
  return <div className="transfer-details">
    <div className="transfer-heading"><strong>{order.providerId}</strong><Badge>{paymentStatusLabels[order.status] || order.status}</Badge></div>
    <div className="transfer-grid">
      {qrUrl && <BankQr key={qrUrl} url={qrUrl} />}
      <dl className="transfer-facts">
        <div><dt>Gói</dt><dd>Premium · {order.period === "yearly" ? "12 tháng" : "1 tháng"}</dd></div>
        <div><dt>Số tiền cần chuyển</dt><dd className="transfer-amount">{formatNumber(order.amount)}₫</dd></div>
        <div><dt>Ngân hàng</dt><dd>{order.bankName}</dd></div>
        <div><dt>Chủ tài khoản</dt><dd>{order.accountName}</dd></div>
        <div><dt>Số tài khoản</dt><dd>{order.accountNumber} <Button size="icon" variant="ghost" aria-label="Sao chép số tài khoản" onClick={() => void copy(order.accountNumber || "")}><Copy size={15} /></Button></dd></div>
        <div><dt>Nội dung chuyển khoản</dt><dd><code>{order.providerId}</code> <Button size="icon" variant="ghost" aria-label="Sao chép nội dung chuyển khoản" onClick={() => void copy(order.providerId)}><Copy size={15} /></Button></dd></div>
      </dl>
    </div>
    <p className="payment-warning">{order.qrCodeUrl ? "QR đã có sẵn ngân hàng, số tài khoản, số tiền và mã đơn. " : "QR của đơn cũ có thể chỉ có tài khoản nhận; hãy nhập số tiền và mã đơn nếu chưa có. "}Luôn kiểm tra người nhận, số tiền và nội dung <strong>{order.providerId}</strong> trên ứng dụng ngân hàng trước khi xác nhận.</p>
    {order.instructions && <p className="payment-instructions">{order.instructions}</p>}
    {order.transferNote && <p><strong>Thông tin học viên:</strong> {order.transferNote}</p>}
    {order.receiptId && <a className="text-link" href={`/api/billing/images/${order.receiptId}`} target="_blank" rel="noreferrer">Xem ảnh biên lai đã gửi</a>}
    {order.reviewNote && <p className="payment-warning"><strong>Ghi chú đối soát:</strong> {order.reviewNote}</p>}
    {order.status === "paid" && <p className="success-message">Premium đã được mở. {order.premiumUntil ? `Thời hạn sau giao dịch: ${billingDate(order.premiumUntil)}.` : "Không giới hạn thời hạn."}</p>}
  </div>;
}
function LearnerOrder({ order, onChange }: { order: TransferOrder; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  async function action(kind: "report" | "cancel") {
    if (kind === "cancel" && !window.confirm("Chỉ hủy nếu bạn CHƯA chuyển tiền. Hủy đơn này?")) return;
    setBusy(true); setError("");
    try {
      await api(`/billing/orders/${order.id}/${kind}`, { method: "POST", body: JSON.stringify({ transferNote: note }) });
      toast.success(kind === "report" ? "Đã gửi admin đối soát. Premium chỉ mở sau khi xác nhận tiền thực nhận." : "Đã hủy đơn chưa thanh toán.");
      onChange();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function receipt(file?: File) {
    if (!file) return;
    setBusy(true); setError("");
    try { await uploadPaymentImage(`orders/${order.id}/receipt`, file); toast.success("Đã tải biên lai. Hãy bấm Đã chuyển khoản để gửi đối soát."); onChange(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <Card className="section-card">
    <TransferDetails order={order} />
    {["awaiting_transfer", "rejected"].includes(order.status) && <div className="payment-report">
      <label>Ảnh biên lai (tùy chọn, PNG/JPEG/WebP dưới 2 MB)<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(e) => { void receipt(e.target.files?.[0]); e.target.value = ""; }} /></label>
      <label>Thông tin chuyển khoản (tên người chuyển / mã giao dịch, tùy chọn)<textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} disabled={busy} placeholder="Không gửi mật khẩu, OTP hoặc thông tin thẻ." /></label>
      <p className="field-help">Biên lai không thay thế xác nhận từ ngân hàng. Chỉ bấm nút bên dưới sau khi đã chuyển khoản thành công.</p>
      <div className="payment-actions"><Button disabled={busy} onClick={() => void action("report")}>{busy ? "Đang xử lý…" : order.status === "rejected" ? "Yêu cầu đối soát lại đơn này" : "Tôi đã chuyển khoản · Gửi đối soát"}</Button>{order.status === "awaiting_transfer" && <Button variant="outline" disabled={busy} onClick={() => void action("cancel")}>Hủy đơn chưa chuyển tiền</Button>}</div>
    </div>}
    {order.status === "pending_review" && <p className="payment-warning">Yêu cầu đã đến admin. Đang chờ kiểm tra số tiền, nội dung và giao dịch thực nhận. Không chuyển thêm tiền cho đơn này.</p>}
    {order.status === "rejected" && <p className="field-help">Nếu bạn đã chuyển tiền, hãy liên hệ quản trị viên và cung cấp mã đơn này để đối soát lại; không chuyển lại tiền chỉ vì đơn bị từ chối.</p>}
    {error && <p className="error-message" role="alert">{error}</p>}
  </Card>;
}
export function BillingPage() {
  const router = useRouter();
  const config = useData<BillingSettings>("/billing/config");
  const account = useData<BillingAccount>("/billing/orders");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const active = account.data?.orders.find((o) => ["awaiting_transfer", "pending_review"].includes(o.status));
  const current = account.data?.orders.find((o) => o.id === selected) || active || account.data?.orders[0];
  useEffect(() => {
    function refresh() { account.refresh(); router.refresh(); }
    window.addEventListener("focus", refresh);
    const timer = active?.status === "pending_review" ? setInterval(refresh, 20000) : undefined;
    return () => { window.removeEventListener("focus", refresh); if (timer) clearInterval(timer); };
  }, [active?.status, account.refresh, router]);
  async function create(period: "monthly" | "yearly") {
    setBusy(true);
    try {
      const order = await api<TransferOrder>("/billing/orders", { method: "POST", body: JSON.stringify({ period }) });
      setSelected(order.id); account.refresh(); toast.success("Đơn đã sẵn sàng. Hãy chuyển đúng số tiền và mã đơn.");
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }
  if (!account.data || !config.data) {
    const error = account.error || config.error;
    return error ? <ErrorState message={error} retry={() => { account.refresh(); config.refresh(); }} /> : <LoadingSkeleton />;
  }
  const sub = account.data.subscription;
  const premium = sub?.plan === "PREMIUM" && sub.status === "active" && (!sub.currentPeriodEnd || Date.parse(sub.currentPeriodEnd) > Date.now());
  const lifetime = premium && !sub.currentPeriodEnd;
  return <>
    <PageHeading title="Gói học & thanh toán" description="Chuyển khoản ngân hàng, đối soát bởi quản trị viên."><Button variant="outline" onClick={() => { account.refresh(); config.refresh(); router.refresh(); }}><RefreshCw size={16} /> Cập nhật trạng thái</Button></PageHeading>
    <Card className="section-card payment-summary"><ShieldCheck /><div><h2>{premium ? "Premium đang hoạt động" : "Bạn đang dùng gói Free"}</h2><p>{premium ? sub.currentPeriodEnd ? `Có hiệu lực đến ${billingDate(sub.currentPeriodEnd)}. Gia hạn sẽ cộng tiếp thời gian còn lại.` : "Premium không giới hạn thời hạn." : "Gói Premium mở sau khi admin xác nhận đã nhận đủ tiền."}</p></div></Card>
    {!active && !lifetime && <Card className="section-card">
      <h2>Đăng ký Premium</h2>
      {config.data.enabled ? <div className="payment-actions">
        <Button disabled={busy} onClick={() => void create("monthly")}><CreditCard size={17} /> 1 tháng · {formatNumber(config.data!.monthlyAmount)}₫</Button>
        <Button variant="outline" disabled={busy} onClick={() => void create("yearly")}>12 tháng · {formatNumber(config.data!.yearlyAmount)}₫</Button>
      </div> : <p>Chuyển khoản chưa được mở. Quản trị viên cần cấu hình thông tin ngân hàng trước; QR sẽ được sinh tự động.</p>}
    </Card>}
    {active && current?.id !== active.id && <Button onClick={() => setSelected(active.id)}>Quay lại đơn đang chờ · {active.providerId}</Button>}
    {current && <LearnerOrder key={current.id} order={current} onChange={account.refresh} />}
    <Card className="section-card"><h2>Lịch sử đăng ký</h2><p className="field-help">Hiển thị tối đa 100 đơn gần nhất. Không tự động gia hạn hoặc trừ tiền.</p>
      {!account.data.orders.length && <p>Chưa có đơn thanh toán nào.</p>}
      <div className="payment-history">{account.data.orders.map((o) => <button key={o.id} className={current?.id === o.id ? "active" : ""} onClick={() => setSelected(o.id)}><span><strong>{o.providerId}</strong><small>{billingDate(o.createdAt)}</small></span><span>{formatNumber(o.amount)}₫<small>{paymentStatusLabels[o.status] || o.status}</small></span></button>)}</div>
    </Card>
  </>;
}
