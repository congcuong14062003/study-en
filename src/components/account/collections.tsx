"use client";
import Link from "next/link";
import { useState } from "react";
import type { Note, Favorite, Notification } from "@prisma/client";
import { ArrowRight, Bell, Check, Heart, Loader2, NotebookPen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageHeading } from "@/components/dashboard/dashboard";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
export function Notes() {
    const { data, loading, error, refresh } = useData<Note[]>("/notes");
    const [q, setQ] = useState(""), [editing, setEditing] = useState<Note | null>(null), [open, setOpen] = useState(false), [deleting, setDeleting] = useState<Note | null>(null), [busy, setBusy] = useState(false);
    async function save(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        try {
            await api(`/notes${editing ? `/${editing.id}` : ""}`, { method: editing ? "PATCH" : "POST", body: JSON.stringify({ title: f.get("title"), content: f.get("content"), tags: String(f.get("tags") || "").split(",").map(x => x.trim()).filter(Boolean) }) });
            setOpen(false);
            refresh();
            toast.success("Đã lưu ghi chú");
        }
        catch (e) {
            toast.error((e as Error).message);
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
            await api(`/notes/${deleting.id}`, { method: "DELETE" });
            setDeleting(null);
            refresh();
            toast.success("Đã xóa ghi chú");
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
    if (error)
        return <ErrorState message={error} retry={refresh}/>;
    const visible = data?.filter(n => `${n.title} ${n.content} ${n.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) || [];
    return <><PageHeading title="Lưu lại những điều đáng nhớ" description="Một từ mới, một cấu trúc hay, một ý tưởng của riêng bạn."><Button onClick={() => {
            setEditing(null);
            setOpen(true);
        }}><Plus size={16}/> Ghi chú mới</Button></PageHeading><div className="toolbar"><input className="input" placeholder="Tìm tiêu đề, nội dung hoặc thẻ…" aria-label="Tìm ghi chú" value={q} onChange={e => setQ(e.target.value)}/></div>{visible.length ? <div className="grid-3">{visible.map(n => <Card className="note-card" key={n.id}><div className="flex-row justify-between"><span className="icon-box"><NotebookPen size={20}/></span><div className="flex-row"><Button variant="ghost" size="icon" aria-label={`Sửa ${n.title}`} onClick={() => {
                    setEditing(n);
                    setOpen(true);
                }}><Pencil size={15}/></Button><Button variant="ghost" size="icon" aria-label={`Xóa ${n.title}`} onClick={() => setDeleting(n)}><Trash2 size={15}/></Button></div></div><h2>{n.title}</h2><p>{n.content.slice(0, 220)}{n.content.length > 220 ? "…" : ""}</p><div className="tags">{n.tags.map(t => <Badge key={t} className="neutral">#{t}</Badge>)}</div><span className="field-help">Cập nhật {new Date(n.updatedAt).toLocaleDateString("vi-VN")}</span></Card>)}</div> : <EmptyState title={q ? "Không tìm thấy ghi chú" : "Chưa có ghi chú nào"} description="Nhấn Ghi chú mới để lưu một điều bạn vừa học được." href="/courses" action="Khám phá bài học"/>}<Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>{editing ? "Chỉnh sửa ghi chú" : "Một ghi chú mới"}</DialogTitle><DialogDescription>Giữ những điều hữu ích ở cùng một nơi.</DialogDescription><form onSubmit={save}><div className="field"><label htmlFor="note-title">Tiêu đề</label><input id="note-title" name="title" className="input" defaultValue={editing?.title} required maxLength={120}/></div><div className="field"><label htmlFor="note-body">Nội dung</label><textarea id="note-body" name="content" defaultValue={editing?.content} required maxLength={12000} style={{ minHeight: 220 }}/></div><div className="field"><label htmlFor="note-tags">Thẻ, cách nhau bằng dấu phẩy</label><input id="note-tags" name="tags" className="input" defaultValue={editing?.tags.join(", ")} placeholder="vocabulary, daily life"/></div><Button disabled={busy} type="submit">{busy ? "Đang lưu…" : "Lưu ghi chú"}</Button></form></DialogContent></Dialog><Dialog open={Boolean(deleting)} onOpenChange={v => {
            if (!v)
                setDeleting(null);
        }}><DialogContent><DialogTitle>Xóa ghi chú này?</DialogTitle><DialogDescription>“{deleting?.title}” sẽ bị xóa khỏi tài khoản của bạn.</DialogDescription><div className="form-actions"><Button variant="outline" onClick={() => setDeleting(null)}>Giữ lại</Button><Button variant="destructive" disabled={busy} onClick={remove}>Xóa ghi chú</Button></div></DialogContent></Dialog></>;
}
export function Favorites() {
    const { data, loading, error, refresh } = useData<Favorite[]>("/favorites");
    const [type, setType] = useState("all");
    async function remove(item: Favorite) {
        try {
            await api("/favorites", { method: "POST", body: JSON.stringify({ type: item.type, resourceId: item.resourceId, title: item.title, href: item.href }) });
            refresh();
            toast.success("Đã bỏ lưu");
        }
        catch (e) {
            toast.error((e as Error).message);
        }
    }
    if (loading)
        return <LoadingSkeleton />;
    if (error)
        return <ErrorState message={error} retry={refresh}/>;
    const list = data?.filter(d => type === "all" || d.type === type) || [];
    return <><PageHeading title="Những điều bạn muốn quay lại" description="Bộ sưu tập kiến thức của riêng bạn."/><div className="tabs-row">{[["all", "Tất cả"], ["word", "Từ vựng"], ["grammar", "Ngữ pháp"], ["lesson", "Bài học"], ["article", "Bài đọc"]].map(([v, t]) => <button className={`tab-button ${type === v ? "active" : ""}`} key={v} onClick={() => setType(v)}>{t}</button>)}</div>{list.length ? <div className="grid-3">{list.map(f => <Card className="favorite-card" key={f.id}><div className="flex-row justify-between"><Badge className="neutral">{{ word: "Từ vựng", grammar: "Ngữ pháp", lesson: "Bài học", article: "Bài đọc" }[f.type]}</Badge><Button variant="ghost" size="icon" aria-label={`Bỏ lưu ${f.title}`} onClick={() => remove(f)}><Heart fill="currentColor" size={17} className="purple-text"/></Button></div><Link href={f.href}><h2>{f.title}</h2><span className="text-link">Tiếp tục khám phá <ArrowRight size={15}/></span></Link></Card>)}</div> : <EmptyState title="Bạn chưa lưu nội dung nào" description="Chạm biểu tượng trái tim ở từ vựng, ngữ pháp, bài học hoặc bài đọc để lưu lại."/>}</>;
}
export function Notifications() {
    const { data, loading, error, refresh } = useData<Notification[]>("/notifications");
    async function mark(id: string) {
        try {
            await api(`/notifications/${id}`, { method: "POST", body: "{}" });
            refresh();
        }
        catch (e) {
            toast.error((e as Error).message);
        }
    }
    if (loading)
        return <LoadingSkeleton />;
    if (error)
        return <ErrorState message={error} retry={refresh}/>;
    return <><PageHeading title="Có điều mới dành cho bạn" description="Những nhắc nhở nhẹ nhàng và cột mốc đáng nhớ."><Button variant="outline" onClick={() => mark("read-all")} disabled={!data?.some(n => !n.read)}><Check size={16}/> Đánh dấu đã đọc</Button></PageHeading>{data?.length ? <div className="notification-list content-narrow">{data.map(n => <Card key={n.id} className={`notification-item ${n.read ? "" : "unread"}`}><span className="icon-box orange"><Bell size={21}/></span><div><Link href={n.href} onClick={() => mark(n.id)}><h3>{n.title}</h3><p>{n.body}</p></Link><small>{new Date(n.createdAt).toLocaleString("vi-VN")}</small></div>{!n.read && <Button variant="ghost" size="icon" onClick={() => mark(n.id)} aria-label="Đánh dấu thông báo đã đọc"><Check size={17}/></Button>}</Card>)}</div> : <EmptyState title="Bạn đã cập nhật mọi thứ" description="Thông báo mới sẽ xuất hiện khi bạn đạt cột mốc học tập."/>}</>;
}
