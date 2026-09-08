"use client";
import { useState } from "react";
import { BookOpen, CheckCircle2, CreditCard, FileText, Loader2, Pencil, Plus, Search, Shield, Trash2, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { api, formatNumber } from "@/lib/utils";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageHeading, StatCard } from "@/components/dashboard/dashboard";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui/states";
type Row = Record<string, unknown>;
type Summary = {
    users: number;
    active: number;
    premium: number;
    revenue: number;
    courses: number;
    lessons: number;
    complete: number;
    daily: {
        date: string;
        _count: {
            userId: number;
        };
        _sum: {
            seconds: number;
        };
    }[];
    aiConfigured: boolean;
    emailConfigured: boolean;
    googleConfigured: boolean;
};
const titles: Record<string, string> = { dashboard: "Tổng quan nền tảng", users: "Quản lý học viên", courses: "Quản lý khóa học", lessons: "Quản lý bài học", vocabulary: "Thư viện từ vựng", grammar: "Nội dung ngữ pháp", listening: "Thư viện bài nghe", reading: "Thư viện bài đọc", questions: "Ngân hàng câu hỏi", subscriptions: "Gói thành viên", reports: "Kết quả học tập", settings: "Cấu hình dịch vụ" };
const templates: Record<string, Row> = { courses: { title: "", level: "A1", category: "Giao tiếp", description: "", duration: "4 tuần", instructor: "EnglishMaster", outcomes: [], color: "blue", published: false, premium: false, thumbnail: "" }, lessons: { courseId: "", title: "", description: "", order: 1, vocabularyIds: [], grammarId: "", listeningId: "", readingId: "", questionIds: [], published: false }, vocabulary: { word: "", ipa: "", meaning: "", definition: "", partOfSpeech: "noun", example: "", translation: "", category: "Daily Life", level: "A1", synonyms: [], antonyms: [], collocations: [], wordFamily: [] }, grammar: { title: "", level: "A1", description: "", structure: [], examples: [], notes: "", commonMistake: "" }, listening: { title: "", level: "A1", topic: "Daily Life", duration: 2, transcript: "", translation: "", audioUrl: "" }, reading: { title: "", level: "A1", category: "Daily life", minutes: 3, body: "", translation: "" }, questions: { skill: "vocabulary", level: "A1", prompt: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "", passage: "", audioText: "" }, users: { name: "", role: "USER", banned: false } };
const labels: Record<string, string> = { title: "Tên nội dung", name: "Họ tên", level: "Trình độ CEFR", category: "Chủ đề", description: "Mô tả", duration: "Thời lượng", instructor: "Giảng viên / biên soạn", outcomes: "Mục tiêu đầu ra", color: "Màu bìa", published: "Đã xuất bản", premium: "Dành cho Premium", thumbnail: "URL ảnh bìa (HTTPS)", courseId: "Mã khóa học", order: "Thứ tự bài", vocabularyIds: "Mã từ vựng", grammarId: "Mã bài ngữ pháp", listeningId: "Mã bài nghe", readingId: "Mã bài đọc", questionIds: "Mã câu hỏi", word: "Từ tiếng Anh", ipa: "Phiên âm IPA", meaning: "Nghĩa tiếng Việt", definition: "Định nghĩa tiếng Anh", partOfSpeech: "Từ loại", example: "Ví dụ", translation: "Bản dịch", synonyms: "Từ đồng nghĩa", antonyms: "Từ trái nghĩa", collocations: "Cụm từ", wordFamily: "Họ từ", audioUrl: "URL bản thu âm (HTTPS, tùy chọn)", structure: "Cấu trúc", examples: "Các ví dụ", notes: "Lưu ý", commonMistake: "Lỗi thường gặp", topic: "Chủ đề", transcript: "Lời thoại", minutes: "Phút đọc", body: "Nội dung bài đọc", skill: "Kỹ năng", prompt: "Câu hỏi", options: "Các lựa chọn (mỗi dòng một đáp án)", correctAnswer: "Chỉ số đáp án đúng (bắt đầu từ 0)", explanation: "Giải thích", passage: "Đoạn văn đọc hiểu", audioText: "Lời thoại nghe", role: "Vai trò", banned: "Khóa tài khoản" };
export function AdminDashboard({ section = "dashboard" }: {
    section?: string;
}) {
    const { data, loading, error, refresh } = useData<Row[] | Summary>(`/admin/${section}`);
    const [q, setQ] = useState(""), [filter, setFilter] = useState("all"), [editing, setEditing] = useState<Row | null>(null), [form, setForm] = useState<Row>({}), [open, setOpen] = useState(false), [deleting, setDeleting] = useState<Row | null>(null), [busy, setBusy] = useState(false), [formError, setFormError] = useState("");
    function edit(row: Row | null) {
        setEditing(row);
        setForm(Object.fromEntries(Object.entries(templates[section] || {}).map(([key, def]) => [key, row?.[key] ?? def])));
        setFormError("");
        setOpen(true);
    }
    async function save(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setFormError("");
        try {
            const payload = { ...form };
            for (const [key, value] of Object.entries(payload)) {
                if (Array.isArray(value) && key !== "options")
                    payload[key] = value.map(v => String(v).trim()).filter(Boolean);
            }
            if (payload.audioUrl === "")
                payload.audioUrl = null;
            if (section === "lessons")
                for (const key of ["grammarId", "listeningId", "readingId"])
                    if (!payload[key])
                        payload[key] = null;
            await api(`/admin/${section}${editing ? `/${editing.id}` : ""}`, { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
            setOpen(false);
            refresh();
            toast.success(editing ? "Đã cập nhật nội dung" : "Đã tạo nội dung mới");
        }
        catch (e) {
            setFormError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    async function remove() {
        if (!deleting)
            return;
        setBusy(true);
        try {
            await api(`/admin/${section}/${deleting.id}`, { method: "DELETE" });
            setDeleting(null);
            refresh();
            toast.success("Đã xóa dữ liệu");
        }
        catch (e) {
            toast.error((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    if (loading)
        return <LoadingSkeleton />;
    if (error || !data)
        return <ErrorState message={error || "Chưa có dữ liệu"} retry={refresh}/>;
    if (!Array.isArray(data)) {
        return <><PageHeading title={titles[section] || titles.dashboard} description="Dữ liệu vận hành từ hệ thống EnglishMaster."><Badge><Shield size={13}/> ADMIN</Badge></PageHeading>{section === "settings" ? <div className="content-narrow"><Card className="section-card"><h2>Kết nối dịch vụ</h2>{[["AI Tutor & Writing", data.aiConfigured, "OPENAI_API_KEY"], ["Email khôi phục mật khẩu", data.emailConfigured, "SMTP_HOST, SMTP_FROM và thông tin SMTP"], ["Đăng nhập Google", data.googleConfigured, "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"]].map(([title, enabled, env]) => <div className="list-row" key={String(title)}><div><h3>{String(title)}</h3><p>{String(env)}</p></div><Badge className={enabled ? "green" : "orange"}>{enabled ? "Đã cấu hình" : "Chưa cấu hình"}</Badge></div>)}<p className="notice mt-4">Khóa dịch vụ được quản lý bằng biến môi trường trên máy chủ. Không hiển thị hoặc nhập khóa bí mật vào giao diện.</p></Card></div> : <><div className="stats-grid"><StatCard label="Tổng học viên" value={formatNumber(data.users)} icon={Users}/><StatCard label="Hoạt động 7 ngày" value={formatNumber(data.active)} icon={Zap} color="green"/><StatCard label="Thành viên Premium" value={formatNumber(data.premium)} icon={CreditCard} color="orange"/><StatCard label="Doanh thu đã thanh toán" value={`${formatNumber(data.revenue)} ₫`} icon={CreditCard} color="blue"/></div><div className="grid-2 mt-4"><Card className="section-card"><h2>Học viên hoạt động mỗi ngày</h2><div className="admin-chart">{data.daily.toReversed().map(d => <div key={d.date} title={`${d.date}: ${d._count.userId} học viên`}><strong>{d._count.userId}</strong><span style={{ height: Math.max(8, d._count.userId / Math.max(1, ...data.daily.map(d => d._count.userId)) * 130) }}/><small>{d.date.slice(5)}</small></div>)}</div></Card><Card className="section-card"><h2>Thư viện & kết quả</h2>{[["Khóa học", data.courses], ["Bài học", data.lessons], ["Lượt hoàn thành bài học", data.complete]].map(([t, v]) => <div className="list-row" key={t}><span>{t}</span><strong>{v}</strong></div>)}<p className="field-help mt-4">Thống kê thành viên và doanh thu dựa trên bản ghi thực; dữ liệu mẫu chỉ thuộc tài khoản demo.</p></Card></div></>}</>;
    }
    const readonly = ["subscriptions", "reports"].includes(section);
    const rows = data.filter(r => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()) && (filter === "all" || r.level === filter));
    const columns = section === "users" ? ["name", "email", "role", "banned"] : section === "courses" ? ["title", "level", "category", "published"] : section === "vocabulary" ? ["word", "ipa", "meaning", "level"] : section === "questions" ? ["prompt", "skill", "level", "correctAnswer"] : section === "subscriptions" ? ["user", "plan", "status", "currentPeriodEnd"] : section === "reports" ? ["user", "quiz", "score", "total", "createdAt"] : ["title", "level", section === "lessons" ? "courseId" : "id"];
    return <><PageHeading title={titles[section] || section} description={`${data.length} bản ghi · Tạo, chỉnh sửa và quản lý nội dung học tập.`}>{!readonly && <Button onClick={() => edit(null)} disabled={section === "users"}><Plus size={16}/>{section === "users" ? "Đăng ký qua trang học viên" : "Tạo mới"}</Button>}</PageHeading><div className="toolbar"><input className="input" placeholder="Tìm kiếm nội dung…" aria-label="Tìm trong bảng" value={q} onChange={e => setQ(e.target.value)}/>{!["users", "subscriptions", "reports"].includes(section) && <select aria-label="Lọc trình độ" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Mọi trình độ</option>{["A1", "A2", "B1", "B2", "C1", "C2"].map(l => <option key={l}>{l}</option>)}</select>}</div><Card className="table-card"><div className="table-scroll"><table><thead><tr>{columns.map(c => <th key={c}>{labels[c] || { email: "Email", plan: "Gói", status: "Trạng thái", currentPeriodEnd: "Hết hạn", user: "Học viên", quiz: "Bài kiểm tra", score: "Điểm", total: "Tổng câu", createdAt: "Ngày tạo", id: "Mã nội dung" }[c] || c}</th>)}{!readonly && <th>Thao tác</th>}</tr></thead><tbody>{rows.map(row => <tr key={String(row.id)}>{columns.map(c => <td key={c}>{typeof row[c] === "boolean" ? <Badge className={row[c] ? c === "banned" ? "orange" : "green" : "neutral"}>{row[c] ? c === "banned" ? "Đã khóa" : "Xuất bản" : c === "banned" ? "Hoạt động" : "Bản nháp"}</Badge> : row[c] && typeof row[c] === "object" ? String((row[c] as Row).name || (row[c] as Row).title || (row[c] as Row).email || "") : String(row[c] ?? "—").slice(0, 140)}</td>)}{!readonly && <td><div className="flex-row"><Button variant="ghost" size="icon" onClick={() => edit(row)} aria-label={`Sửa ${row.title || row.word || row.name}`}><Pencil size={15}/></Button><Button variant="ghost" size="icon" onClick={() => setDeleting(row)} aria-label={`Xóa ${row.title || row.word || row.name}`}><Trash2 size={15}/></Button></div></td>}</tr>)}</tbody></table></div>{!rows.length && <div className="empty-state"><p>Chưa có bản ghi phù hợp.</p></div>}</Card><p className="field-help mt-4">Nội dung đã có học viên hoặc đang được dùng trong bài học được bảo vệ khi xóa.</p><Dialog open={open} onOpenChange={setOpen}><DialogContent className="cms-dialog"><DialogTitle>{editing ? "Chỉnh sửa" : "Tạo mới"} · {titles[section]}</DialogTitle><DialogDescription>{section === "lessons" ? "Dùng mã nội dung trong các thư viện để liên kết bài học. Danh sách mã: mỗi dòng một mã." : "Các thay đổi được lưu trực tiếp vào cơ sở dữ liệu."}</DialogDescription>{editing && <p className="field-help mb-4">Mã: {String(editing.id)}</p>}<form onSubmit={save}>{section === "courses" && <div className="field"><label htmlFor="cover-upload">Tải ảnh bìa từ máy (PNG, JPEG, WebP · tối đa 2 MB)</label><input id="cover-upload" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file)
                    return;
                setBusy(true);
                try {
                    const body = new FormData();
                    body.append("file", file);
                    const response = await fetch("/api/admin/uploads", { method: "POST", body });
                    const result = await response.json();
                    if (!response.ok)
                        throw new Error(result.error);
                    setForm(f => ({ ...f, thumbnail: result.url }));
                    toast.success("Đã tải ảnh lên. Nhấn Lưu thay đổi để dùng ảnh này.");
                }
                catch (error) {
                    setFormError((error as Error).message);
                }
                finally {
                    setBusy(false);
                }
            }}/></div>}{section === "users" && <p className="notice mb-4">Chuyển vai trò sang PREMIUM sẽ cấp gói Premium thủ công. Chuyển về USER sẽ thu hồi gói và yêu cầu đăng nhập lại.</p>}<div className="cms-fields">{Object.entries(form).map(([key, value]) => <div className={`field ${["description", "body", "transcript", "translation", "notes", "prompt", "explanation"].includes(key) || Array.isArray(value) ? "full" : ""}`} key={key}>{typeof value === "boolean" ? <label className="checkbox-label"><input type="checkbox" checked={value} onChange={e => setForm({ ...form, [key]: e.target.checked })}/>{labels[key] || key}</label> : <><label htmlFor={`cms-${key}`}>{labels[key] || key}</label>{Array.isArray(value) ? <><textarea id={`cms-${key}`} value={value.join("\n")} onChange={e => setForm({ ...form, [key]: e.target.value.split("\n") })} rows={3}/><span className="field-help">Mỗi dòng một mục. Để trống nếu không có.</span></> : key === "level" || key === "role" || key === "color" || key === "skill" ? <select id={`cms-${key}`} value={String(value)} onChange={e => setForm({ ...form, [key]: e.target.value })}>{(key === "level" ? ["A1", "A2", "B1", "B2", "C1", "C2"] : key === "role" ? ["USER", "PREMIUM"] : key === "skill" ? ["vocabulary", "grammar", "reading", "listening"] : ["blue", "purple", "orange", "green"]).map(o => <option key={o}>{o}</option>)}</select> : ["description", "body", "transcript", "translation", "notes", "prompt", "explanation"].includes(key) ? <textarea id={`cms-${key}`} value={String(value || "")} onChange={e => setForm({ ...form, [key]: e.target.value })} maxLength={12000}/> : <input className="input" id={`cms-${key}`} type={typeof value === "number" ? "number" : "text"} value={String(value ?? "")} onChange={e => setForm({ ...form, [key]: typeof value === "number" ? Number(e.target.value) : e.target.value })} maxLength={1000}/>}</>}</div>)}</div>{formError && <p role="alert" className="error-message">{formError}</p>}<div className="form-actions"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button disabled={busy} type="submit">{busy ? <Loader2 size={16} className="spin"/> : <CheckCircle2 size={16}/>}Lưu thay đổi</Button></div></form></DialogContent></Dialog><Dialog open={Boolean(deleting)} onOpenChange={v => {
            if (!v)
                setDeleting(null);
        }}><DialogContent><DialogTitle>Xóa bản ghi này?</DialogTitle><DialogDescription>“{String(deleting?.title || deleting?.word || deleting?.name || "")}” sẽ bị xóa. Nội dung đang được sử dụng có thể không được phép xóa.</DialogDescription><div className="form-actions"><Button variant="outline" onClick={() => setDeleting(null)}>Giữ lại</Button><Button variant="destructive" disabled={busy} onClick={remove}>Xóa bản ghi</Button></div></DialogContent></Dialog></>;
}
