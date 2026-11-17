"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { initials } from "@/lib/utils";

const SIZE = 280;
const OUTPUT = 512;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

export function AvatarEditor({ userId, name, image, onSaved }: {
  userId: string;
  name: string | null;
  image: string | null;
  onSaved: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const source = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const baseScale = dimensions.width && dimensions.height
    ? Math.max(SIZE / dimensions.width, SIZE / dimensions.height)
    : 1;
  const drawnWidth = dimensions.width * baseScale * zoom;
  const drawnHeight = dimensions.height * baseScale * zoom;
  const limitX = Math.max(0, (drawnWidth - SIZE) / 2);
  const limitY = Math.max(0, (drawnHeight - SIZE) / 2);
  const clamp = (x: number, y: number) => ({
    x: Math.max(-limitX, Math.min(limitX, x)),
    y: Math.max(-limitY, Math.min(limitY, y)),
  });

  function choose(file?: File) {
    if (!file) return;
    if (!(["image/png", "image/jpeg", "image/webp"].includes(file.type)) || file.size > MAX_SOURCE_BYTES) {
      toast.error("Chọn ảnh PNG, JPEG hoặc WebP dưới 8 MB.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const preview = new Image();
    preview.onload = () => {
      source.current = preview;
      setDimensions({ width: preview.naturalWidth, height: preview.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setUrl(objectUrl);
    };
    preview.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast.error("Không đọc được ảnh này. Hãy chọn ảnh khác.");
    };
    preview.src = objectUrl;
  }

  async function save() {
    if (!source.current) return;
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Trình duyệt không hỗ trợ chỉnh ảnh.");
      const factor = OUTPUT / SIZE;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, OUTPUT, OUTPUT);
      context.drawImage(source.current,
        ((SIZE - drawnWidth) / 2 + offset.x) * factor,
        ((SIZE - drawnHeight) / 2 + offset.y) * factor,
        drawnWidth * factor, drawnHeight * factor);
      let blob: Blob | null = null;
      for (const quality of [0.86, 0.7, 0.5]) {
        blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size <= 1024 * 1024) break;
      }
      if (!blob || blob.size > 1024 * 1024) throw new Error("Không thể nén ảnh dưới 1 MB. Hãy chọn ảnh khác.");
      const response = await fetch(`/api/avatar/${userId}`, {
        method: "POST", headers: { "Content-Type": "image/jpeg" }, body: blob,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể lưu ảnh đại diện.");
      setUrl(null);
      toast.success("Đã cập nhật ảnh đại diện");
      onSaved();
      router.refresh();
    } catch (error) { toast.error((error as Error).message); }
    finally { setSaving(false); }
  }

  return <>
    <div className="avatar-upload-row">
      <div className="profile-avatar">{image ? <img src={image} alt="Ảnh đại diện hiện tại" /> : initials(name)}</div>
      <div>
        <Button type="button" className="avatar-upload-button" disabled={saving} onClick={() => fileInput.current?.click()}>
          <Camera size={17} /> {image ? "Đổi ảnh đại diện" : "Tải ảnh đại diện"}
        </Button>
        <p className="field-help">PNG, JPEG hoặc WebP dưới 8 MB. Có thể chỉnh vị trí trước khi lưu.</p>
      </div>
    </div>
    <input ref={fileInput} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp"
      aria-label="Chọn ảnh đại diện" onChange={(event) => { choose(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
    <Dialog open={Boolean(url)} onOpenChange={(open) => { if (!open && !saving) setUrl(null); }}>
      <DialogContent className="avatar-editor-dialog">
        <DialogTitle>Chỉnh ảnh đại diện</DialogTitle>
        <DialogDescription>Kéo ảnh để chọn phần hiển thị trong khung tròn, sau đó nhấn Lưu ảnh.</DialogDescription>
        {url && <div className="avatar-crop" role="img" aria-label="Vùng chọn ảnh đại diện"
          tabIndex={0}
          onKeyDown={(event) => {
            const delta = event.shiftKey ? 20 : 5;
            const moves: Record<string, [number, number]> = {
              ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta],
            };
            if (moves[event.key]) { event.preventDefault(); const [x, y] = moves[event.key]; setOffset((prev) => clamp(prev.x + x, prev.y + y)); }
          }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            setOffset(clamp(drag.current.offsetX + event.clientX - drag.current.x,
              drag.current.offsetY + event.clientY - drag.current.y));
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}>
          <img src={url} alt="" draggable={false} style={{
            width: drawnWidth, height: drawnHeight,
            left: (SIZE - drawnWidth) / 2 + offset.x,
            top: (SIZE - drawnHeight) / 2 + offset.y,
          }} />
          <div className="avatar-crop-mask" />
        </div>}
        <label className="avatar-zoom-label" htmlFor="avatar-zoom"><ZoomOut size={18} /> Phóng to ảnh <ZoomIn size={18} /></label>
        <input id="avatar-zoom" className="avatar-zoom" type="range" min="1" max="3" step="0.05" value={zoom}
          onChange={(event) => {
            const next = Number(event.target.value);
            setZoom(next);
            const nextLimitX = Math.max(0, (dimensions.width * baseScale * next - SIZE) / 2);
            const nextLimitY = Math.max(0, (dimensions.height * baseScale * next - SIZE) / 2);
            setOffset((prev) => ({
              x: Math.max(-nextLimitX, Math.min(nextLimitX, prev.x)),
              y: Math.max(-nextLimitY, Math.min(nextLimitY, prev.y)),
            }));
          }} />
        <div className="avatar-editor-actions">
          <Button type="button" variant="outline" disabled={saving} onClick={() => setUrl(null)}>Hủy</Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? <Loader2 size={16} className="spin" /> : <Camera size={16} />} Lưu ảnh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
