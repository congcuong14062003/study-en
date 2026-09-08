"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, ArrowUpRight, BookOpen, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/utils";
type Result = {
    id: string;
    title: string;
    subtitle: string;
    type: string;
    href: string;
};
export function SearchModal({ open, onOpenChange }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const [q, setQ] = useState("");
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        if (q.trim().length < 2) {
            setResults([]);
            return;
        }
        const timer = setTimeout(() => {
            setLoading(true);
            setError("");
            api<Result[]>(`/search?q=${encodeURIComponent(q)}`, { signal: controller.signal }).then(setResults).catch(e => {
                if (!controller.signal.aborted)
                    setError(e.message);
            }).finally(() => {
                if (!controller.signal.aborted)
                    setLoading(false);
            });
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [q]);
    return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogTitle>Tìm điều bạn muốn học</DialogTitle><DialogDescription>Khóa học, từ vựng, ngữ pháp hoặc bài đọc.</DialogDescription><div className="flex-row"><Search size={20}/><input className="input" placeholder="Nhập ít nhất 2 ký tự…" aria-label="Nội dung cần tìm" value={q} onChange={e => setQ(e.target.value)} autoFocus/></div><div className="search-results">{loading ? <div className="flex-row muted"><Loader2 size={16} className="spin"/> Đang tìm kiếm…</div> : error ? <p className="error-message">{error}</p> : results.length ? results.map(r => <Link key={`${r.type}-${r.id}`} className="search-result" href={r.href} onClick={() => onOpenChange(false)}><span className="icon-box"><BookOpen size={17}/></span><div><strong>{r.title}</strong><span>{r.type} · {r.subtitle}</span></div><ArrowUpRight size={17}/></Link>) : q.length >= 2 ? <p>Không tìm thấy kết quả. Thử từ khóa khác nhé.</p> : <p>Thử “daily”, “travel” hoặc “present”.</p>}</div></DialogContent></Dialog>;
}
