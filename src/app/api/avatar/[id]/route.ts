import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { paymentImageType } from "@/lib/billing";
import { ApiError, checkOrigin, errorResponse, rateLimit } from "@/lib/security";

type Context = { params: Promise<{ id: string }> };
export const runtime = "nodejs";
const MAX_AVATAR_BYTES = 1024 * 1024;

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const avatar = await db.userAvatar.findUnique({ where: { userId: id } });
    if (!avatar) throw new ApiError("Không tìm thấy ảnh đại diện.", 404);
    return new Response(new Uint8Array(avatar.data), {
      headers: {
        "Content-Type": avatar.contentType,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    if ((await params).id !== user.id) throw new ApiError("Không có quyền đổi ảnh đại diện này.", 403);
    await rateLimit(`avatar:${user.id}`, 10, 3600);
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_AVATAR_BYTES + 100_000) throw new ApiError("Ảnh cần nhỏ hơn 1 MB.", 413);
    const reader = request.body?.getReader();
    if (!reader) throw new ApiError("Thiếu ảnh đại diện.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_AVATAR_BYTES) {
        await reader.cancel();
        throw new ApiError("Ảnh cần nhỏ hơn 1 MB.", 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(Buffer.concat(chunks));
    if (!bytes.length || bytes.length > MAX_AVATAR_BYTES) throw new ApiError("Ảnh cần nhỏ hơn 1 MB.", 413);
    const contentType = paymentImageType(bytes);
    if (!contentType) throw new ApiError("Chọn ảnh PNG, JPEG hoặc WebP.", 415);
    const image = `/api/avatar/${user.id}?v=${Date.now()}`;
    await db.$transaction(async (tx) => {
      await tx.userAvatar.upsert({ where: { userId: user.id }, create: { userId: user.id, data: bytes, contentType }, update: { data: bytes, contentType } });
      await tx.user.update({ where: { id: user.id }, data: { image } });
    });
    return Response.json({ image });
  } catch (error) { return errorResponse(error); }
}
