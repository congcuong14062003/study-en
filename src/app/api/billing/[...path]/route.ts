import { db } from "@/lib/db";
import { currentUser, requireAdmin, requireUser } from "@/lib/auth";
import { ApiError, checkOrigin, errorResponse, rateLimit, readJson } from "@/lib/security";
import { paymentImageType } from "@/lib/billing";
import { adminBilling, attachTransferReceipt, billingAccount, changeTransferOrder, createTransferOrder, readBillingSettings, reviewTransferOrder, saveBillingSettings } from "@/services/billing";

type Context = { params: Promise<{ path: string[] }> };
export const runtime = "nodejs";

async function readImage(request: Request) {
  const maxSize = 2000000;
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) throw new ApiError("Hãy tải ảnh bằng biểu mẫu.", 415);
  if (Number(request.headers.get("content-length") || 0) > maxSize + 100000) throw new ApiError("Ảnh phải nhỏ hơn 2 MB.", 413);
  // Bound streamed bodies too; never trust Content-Length alone.
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError("Thiếu ảnh.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxSize + 100000) { await reader.cancel(); throw new ApiError("Ảnh phải nhỏ hơn 2 MB.", 413); }
    chunks.push(value);
  }
  let form: FormData;
  try { form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": contentType } }).formData(); }
  catch { throw new ApiError("Biểu mẫu ảnh không hợp lệ."); }
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > maxSize) throw new ApiError("Chọn ảnh PNG, JPEG hoặc WebP dưới 2 MB.");
  const data = new Uint8Array(await file.arrayBuffer());
  const mime = paymentImageType(data);
  if (!mime) throw new ApiError("Chỉ hỗ trợ PNG, JPEG hoặc WebP; không hỗ trợ SVG.");
  return { data, contentType: mime };
}
export async function GET(request: Request, { params }: Context) {
  try {
    const path = (await params).path;
    if (path.length === 1 && path[0] === "config") return Response.json(await readBillingSettings());
    if (path.length === 1 && path[0] === "orders") return Response.json(await billingAccount((await requireUser()).id));
    if (path.length === 1 && path[0] === "admin") {
      await requireAdmin();
      return Response.json(await adminBilling(new URL(request.url).searchParams));
    }
    if (path.length === 2 && path[0] === "images") {
      const metadata = await db.paymentImage.findUnique({ where: { id: path[1] }, select: { kind: true } });
      if (!metadata) throw new ApiError("Không tìm thấy ảnh.", 404);
      if (metadata.kind !== "qr") {
        const user = await currentUser();
        if (!user || (user.role !== "ADMIN" && !await db.payment.findFirst({ where: { userId: user.id, receiptId: path[1] }, select: { id: true } })))
          throw new ApiError("Không tìm thấy ảnh.", 404);
      }
      const image = await db.paymentImage.findUniqueOrThrow({ where: { id: path[1] } });
      return new Response(new Uint8Array(image.data), { headers: {
        "Content-Type": image.contentType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline", "Content-Security-Policy": "default-src 'none'; sandbox",
      } });
    }
    throw new ApiError("API không tồn tại.", 404);
  } catch (error) { return errorResponse(error); }
}
async function mutate(request: Request, { params }: Context) {
  try {
    checkOrigin(request);
    const path = (await params).path;
    const user = path[0] === "admin" ? await requireAdmin() : await requireUser();
    await rateLimit(`billing:${user.id}`, 40, 60);
    if (path.join("/") === "admin/qr" && request.method === "POST") {
      throw new ApiError("Không dùng upload QR nữa. Hãy lưu thông tin ngân hàng để tự sinh VietQR.", 405);
    }
    if (path.length === 3 && path[0] === "orders" && path[2] === "receipt" && request.method === "POST") {
      await rateLimit(`billing-receipt:${user.id}`, 10, 3600);
      return Response.json(await attachTransferReceipt(user.id, path[1], await readImage(request)));
    }
    const raw = await readJson(request);
    if (path.join("/") === "admin/config" && request.method === "PATCH") return Response.json(await saveBillingSettings(user.id, raw));
    if (path.length === 1 && path[0] === "orders" && request.method === "POST") {
      const period = typeof raw === "object" && raw !== null && "period" in raw ? raw.period : undefined;
      return Response.json(await createTransferOrder(user.id, period));
    }
    if (path.length === 3 && path[0] === "orders" && ["report", "cancel"].includes(path[2]) && request.method === "POST")
      return Response.json(await changeTransferOrder(user.id, path[1], path[2] as "report" | "cancel", raw));
    if (path.length === 3 && path[0] === "admin" && path[1] === "review" && request.method === "POST")
      return Response.json(await reviewTransferOrder(user.id, path[2], raw));
    throw new ApiError("Hành động không hợp lệ.", 405);
  } catch (error) { return errorResponse(error); }
}
export { mutate as POST, mutate as PATCH };
