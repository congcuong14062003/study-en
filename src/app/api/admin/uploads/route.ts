import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { requireAdmin } from "@/lib/auth";
import { ApiError, checkOrigin, errorResponse, rateLimit } from "@/lib/security";
export async function POST(request: Request) {
    try {
        checkOrigin(request);
        const user = await requireAdmin();
        await rateLimit(`upload:${user.id}`, 10, 3600);
        const length = Number(request.headers.get("content-length") || 0);
        if (!length || length > 2200000)
            throw new ApiError("Ảnh phải nhỏ hơn 2 MB.", 413);
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size > 2000000)
            throw new ApiError("Chọn ảnh PNG, JPEG hoặc WebP nhỏ hơn 2 MB.");
        const bytes = Buffer.from(await file.arrayBuffer());
        const extension = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "png" : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "jpg" : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "webp" : null;
        if (!extension)
            throw new ApiError("Chỉ hỗ trợ ảnh PNG, JPEG và WebP hợp lệ.");
        const name = `${randomUUID()}.${extension}`;
        const dir = join(process.cwd(), "public", "uploads");
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, name), bytes, { flag: "wx" });
        return Response.json({ url: `/uploads/${name}` }, { status: 201 });
    }
    catch (e) {
        return errorResponse(e);
    }
}
