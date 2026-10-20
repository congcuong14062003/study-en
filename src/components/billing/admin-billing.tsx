"use client";
import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Save, ShieldCheck } from "lucide-react";
import { useData } from "@/hooks/use-data";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { api, formatNumber } from "@/lib/utils";
import { paymentStatusLabels, vietQrUrl, type BillingSettings, type TransferOrder } from "@/lib/billing";
import type { PaginationMeta } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { PageHeading } from "@/components/dashboard/dashboard";
import { BankQr, billingDate, TransferDetails } from "./billing";

function SettingsForm({ initial, onSave }: { initial: BillingSettings; onSave: () => void }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const candidateQr = vietQrUrl(form);
  const previewQr = useDebouncedValue(candidateQr, 600);
  function field<K extends keyof BillingSettings>(name: K, value: BillingSettings[K]) {
    setForm((current) => ({ ...current, [name]: value }));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await api("/billing/admin/config", { method: "PATCH", body: JSON.stringify(form) });
      toast.success("Đã lưu tài khoản nhận tiền và giá gói."); onSave();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <Card className="section-card">
    <h2>Cấu hình nhận chuyển khoản</h2>
    <p className="field-help">Nhập thông tin nhận tiền để tự sinh VietQR, không cần tải ảnh. Chỉ bật sau khi kiểm tra QR đúng tài khoản. Đơn cũ giữ nguyên ngân hàng, QR và giá đã đăng ký.</p>
    <form className="payment-settings" onSubmit={save}>
      <fieldset disabled={busy}>
        <div className="payment-fields">
          <label>Tên ngân hàng<input value={form.bankName} maxLength={120} onChange={(e) => field("bankName", e.target.value)} placeholder="VD: Vietinbank" /></label>
          <label>Mã ngân hàng / BIN (VietQR)<input value={form.bankCode} maxLength={30} autoCapitalize="characters" spellCheck={false} onChange={(e) => field("bankCode", e.target.value.toUpperCase())} placeholder="VD: 970415 hoặc ICB (Vietinbank)" /><small>Mã BIN hoặc mã viết tắt được VietQR hỗ trợ, không phải tên chi nhánh.</small></label>
          <label>Tên chủ tài khoản<input value={form.accountName} maxLength={150} onChange={(e) => field("accountName", e.target.value)} /></label>
          <label>Số tài khoản<input value={form.accountNumber} maxLength={25} onChange={(e) => field("accountNumber", e.target.value)} /></label>
          <label>Giá 1 tháng (VND)<input type="number" min={1000} max={100000000} step={1} required value={form.monthlyAmount} onChange={(e) => field("monthlyAmount", Number(e.target.value))} /></label>
          <label>Giá 12 tháng (VND)<input type="number" min={1000} max={100000000} step={1} required value={form.yearlyAmount} onChange={(e) => field("yearlyAmount", Number(e.target.value))} /></label>
        </div>
        {candidateQr && candidateQr === previewQr ? <BankQr key={previewQr!} url={previewQr!} preview /> : <p className="field-help" role="status">{candidateQr ? "Đang cập nhật QR xem trước…" : "Điền đúng mã ngân hàng/BIN, số tài khoản và tên chủ tài khoản để xem QR tự sinh."}</p>}
        <p className="field-help">Ảnh được sinh qua img.vietqr.io từ thông tin tài khoản nhận; QR của từng đơn có thêm số tiền và mã đơn. Không gửi email học viên, mật khẩu hay biên lai sang VietQR.</p>
        <label>Hướng dẫn / liên hệ hỗ trợ<textarea maxLength={1000} value={form.instructions} onChange={(e) => field("instructions", e.target.value)} placeholder="VD: Thời gian đối soát, email hoặc số hỗ trợ thanh toán." /></label>
        <label className="payment-check"><input type="checkbox" checked={form.enabled} onChange={(e) => field("enabled", e.target.checked)} /> Mở đăng ký Premium bằng chuyển khoản</label>
        <Button type="submit"><Save size={16} /> {busy ? "Đang lưu…" : "Lưu cấu hình"}</Button>
      </fieldset>
      {error && <p className="error-message" role="alert">{error}</p>}
    </form>
  </Card>;
}
function ReviewDialog({ order, close, done }: { order: TransferOrder; close: () => void; done: () => void }) {
  const [decision, setDecision] = useState("approve");
  const [bankTransactionId, setBankTransactionId] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await api(`/billing/admin/review/${order.id}`, { method: "POST", body: JSON.stringify({
        decision, bankTransactionId, reviewNote, confirmedReceived: confirmed, receivedAmount: order.amount,
      }) });
      toast.success(decision === "approve" ? "Đã xác nhận thanh toán và mở / gia hạn Premium." : "Đã ghi nhận từ chối và gửi thông báo cho học viên.");
      done();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) close(); }}><DialogContent className="payment-dialog">
    <DialogTitle>Đối soát đơn Premium</DialogTitle>
    <DialogDescription>Kiểm tra giao dịch thực nhận trong tài khoản ngân hàng. Ảnh biên lai không phải xác nhận đã nhận tiền.</DialogDescription>
    <p><strong>{order.user?.name}</strong> · {order.user?.email}</p>
    <p className="field-help">Mã học viên: {order.userId}. Gói chỉ mở cho tài khoản đã tạo đơn này, không gộp các tài khoản Google/Facebook/email cùng địa chỉ.</p>
    <TransferDetails order={order} />
    {order.status === "pending_review" ? <form className="payment-review-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <label>Kết quả<select value={decision} onChange={(e) => setDecision(e.target.value)}><option value="approve">Đã nhận đủ tiền · Mở Premium</option><option value="reject">Chưa khớp giao dịch · Từ chối</option></select></label>
        {decision === "approve" && <>
          <label>Mã giao dịch thực nhận trên ngân hàng<input value={bankTransactionId} onChange={(e) => setBankTransactionId(e.target.value)} required minLength={3} maxLength={120} placeholder="Không lấy mã từ ảnh biên lai mà chưa kiểm tra ngân hàng" /></label>
          <label className="payment-check"><input type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> Tôi đã kiểm tra giao dịch thực nhận {formatNumber(order.amount)} VND, đúng mã đơn {order.providerId}, chưa duyệt cho đơn khác.</label>
        </>}
        <label>Ghi chú {decision === "reject" ? "(bắt buộc, gửi cho học viên)" : "(gửi cho học viên, tùy chọn)"}<textarea required={decision === "reject"} minLength={decision === "reject" ? 5 : undefined} maxLength={1000} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} /></label>
        <Button type="submit" disabled={busy || (decision === "approve" && !confirmed)}><ShieldCheck size={17} /> {busy ? "Đang xử lý…" : decision === "approve" ? "Xác nhận tiền & mở Premium" : "Ghi nhận từ chối"}</Button>
      </fieldset>
      {error && <p className="error-message" role="alert">{error}</p>}
    </form> : <p className="field-help">{order.bankTransactionId ? `Mã ngân hàng: ${order.bankTransactionId} · ` : ""}Đối soát: {billingDate(order.reviewedAt)}{order.reviewedBy ? ` · Admin: ${order.reviewedBy}` : ""}. Không thể duyệt lại hoặc tự ý hoàn tiền từ màn hình này.</p>}
  </DialogContent></Dialog>;
}
type AdminBillingData = { settings: BillingSettings; orders: TransferOrder[]; pagination: PaginationMeta; pendingCount: number };
export function AdminBilling() {
  const [status, setStatus] = useState("pending_review");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<TransferOrder | null>(null);
  const query = useDebouncedValue(q, 300);
  const { data, error, refresh } = useData<AdminBillingData>(`/billing/admin?status=${status}&q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`);
  if (!data) return error ? <ErrorState message={error} retry={refresh} /> : <LoadingSkeleton />;
  return <>
    <PageHeading title="Premium & đối soát chuyển khoản" description="Đơn hàng, tài khoản nhận tiền và lịch sử xác nhận."><Button variant="outline" onClick={refresh}><RefreshCw size={16} /> Làm mới · {data.pendingCount} chờ duyệt</Button></PageHeading>
    <SettingsForm initial={data.settings} onSave={refresh} />
    <Card className="section-card">
      <h2>Đơn đăng ký Premium</h2>
      <p className="payment-warning">Không duyệt chỉ dựa vào ảnh hoặc nút “Đã chuyển khoản”. Đối chiếu tiền thực nhận, mã đơn và mã giao dịch trong ngân hàng trước khi mở gói.</p>
      <div className="payment-filters"><label>Trạng thái<select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="all">Tất cả</option>{Object.entries(paymentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Tìm mã đơn / email<input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Mã EM… hoặc email học viên" /></label></div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {!data.orders.length && <p>Chưa có đơn phù hợp.</p>}
      <div className="payment-history">{data.orders.map((order) => <button key={order.id} onClick={() => setSelected(order)}><span><strong>{order.providerId}</strong><small>{order.user?.name} · {order.user?.email}</small><small>{billingDate(order.createdAt)}</small></span><span><strong>{formatNumber(order.amount)}₫</strong><small>{order.period === "yearly" ? "12 tháng" : "1 tháng"}</small><Badge>{paymentStatusLabels[order.status] || order.status}</Badge></span><span>{order.status === "pending_review" ? "Đối soát →" : "Xem chi tiết →"}</span></button>)}</div>
      <Pagination meta={data.pagination} onPageChange={setPage} pageSizes={[20, 50]} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
    </Card>
    {selected && <ReviewDialog key={selected.id} order={selected} close={() => setSelected(null)} done={() => { setSelected(null); refresh(); }} />}
  </>;
}
