"use client";
import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/utils";
import { useFavorites } from "@/hooks/use-favorites";
export function FavoriteButton({
  type,
  id,
  title,
  href,
  label = false,
}: {
  type: "word" | "grammar" | "lesson" | "article";
  id: string;
  title: string;
  href: string;
  label?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const { loading, isFavorite, setFavorite } = useFavorites();
  const saved = isFavorite(type, id);
  async function toggle() {
    setBusy(true);
    try {
      const result = await api<{
        saved: boolean;
      }>("/favorites", {
        method: "POST",
        body: JSON.stringify({ type, resourceId: id, title, href }),
      });
      setFavorite({ type, resourceId: id }, result.saved);
      toast.success(result.saved ? "Đã thêm vào mục yêu thích" : "Đã bỏ lưu");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button
      variant="ghost"
      size={label ? "sm" : "icon"}
      aria-label={saved ? `Bỏ lưu ${title}` : `Lưu ${title}`}
      aria-pressed={saved}
      disabled={busy || loading}
      onClick={toggle}
    >
      {busy ? (
        <Loader2 size={17} className="spin" />
      ) : (
        <Heart
          size={17}
          fill={saved ? "currentColor" : "none"}
          className={saved ? "purple-text" : ""}
        />
      )}{" "}
      {label && (saved ? "Đã lưu" : "Lưu lại")}
    </Button>
  );
}
