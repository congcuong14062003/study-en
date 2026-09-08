"use client";
import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/utils";
export function FavoriteButton({ type, id, title, href, label = false }: {
    type: "word" | "grammar" | "lesson" | "article";
    id: string;
    title: string;
    href: string;
    label?: boolean;
}) {
    const [saved, setSaved] = useState(false), [busy, setBusy] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        api<{
            type: string;
            resourceId: string;
        }[]>("/favorites", { signal: controller.signal }).then(data => setSaved(data.some(f => f.type === type && f.resourceId === id))).catch(() => {
        });
        return () => controller.abort();
    }, [id, type]);
    async function toggle() {
        setBusy(true);
        try {
            const result = await api<{
                saved: boolean;
            }>("/favorites", { method: "POST", body: JSON.stringify({ type, resourceId: id, title, href }) });
            setSaved(result.saved);
            toast.success(result.saved ? "Đã thêm vào mục yêu thích" : "Đã bỏ lưu");
        }
        catch (e) {
            toast.error((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return <Button variant="ghost" size={label ? "sm" : "icon"} aria-label={saved ? `Bỏ lưu ${title}` : `Lưu ${title}`} aria-pressed={saved} disabled={busy} onClick={toggle}>{busy ? <Loader2 size={17} className="spin"/> : <Heart size={17} fill={saved ? "currentColor" : "none"} className={saved ? "purple-text" : ""}/>} {label && (saved ? "Đã lưu" : "Lưu lại")}</Button>;
}
