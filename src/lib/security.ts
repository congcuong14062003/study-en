import { db } from "./db";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { isIP } from "node:net";
import { createHash } from "node:crypto";
export class ApiError extends Error {
    constructor(message: string, public status = 400) {
        super(message);
    }
}
export async function clientRateLimit(headers: Headers | Record<string, string | string[] | undefined>, scope: string, limit: number, seconds: number) {
    // Enable only when a controlled reverse proxy overwrites X-Real-IP.
    if (process.env.TRUST_PROXY !== "true")
        return;
    const value = headers instanceof Headers ? headers.get("x-real-ip") : headers["x-real-ip"];
    if (typeof value !== "string" || !isIP(value))
        throw new ApiError("Thiếu thông tin proxy tin cậy.", 503);
    const key = createHash("sha256").update(value).digest("hex");
    await rateLimit(`${scope}:ip:${key}`, limit, seconds);
}
export async function rateLimit(key: string, limit = 40, seconds = 60) {
    const now = new Date();
    const expires = new Date(now.getTime() + seconds * 1000);
    const rows = await db.$queryRaw<{
        count: number;
    }[]> `INSERT INTO "RateLimit" ("key","count","expiresAt") VALUES (${key},1,${expires}) ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "RateLimit"."expiresAt" < ${now} THEN 1 ELSE "RateLimit"."count"+1 END,"expiresAt"=CASE WHEN "RateLimit"."expiresAt" < ${now} THEN ${expires} ELSE "RateLimit"."expiresAt" END RETURNING "count"`;
    if (rows[0].count > limit)
        throw new ApiError("Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.", 429);
}
export function checkOrigin(request: Request) {
    const origin = request.headers.get("origin");
    const expectedUrl = new URL(process.env.NEXTAUTH_URL || "http://127.0.0.1:3000");
    if (!origin)
        throw new ApiError("Yêu cầu không hợp lệ. Vui lòng tải lại trang.", 403);
    let receivedUrl: URL;
    try {
        receivedUrl = new URL(origin);
    }
    catch {
        throw new ApiError("Yêu cầu không hợp lệ. Vui lòng tải lại trang.", 403);
    }
    const requestUrl = new URL(request.url);
    const host = request.headers.get("host")?.trim();
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim().toLowerCase();
    const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
        ? forwardedProtocol
        : requestUrl.protocol.slice(0, -1);
    let receivedRequestOrigin = requestUrl.origin;
    if (host) {
        try {
            receivedRequestOrigin = new URL(`${protocol}://${host}`).origin;
        }
        catch {
            // Keep the framework-provided request URL as the fallback.
        }
    }
    if (receivedUrl.origin === expectedUrl.origin || receivedUrl.origin === receivedRequestOrigin)
        return;
    const localHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
    const sameLocalServer = process.env.NODE_ENV !== "production"
        && localHosts.has(receivedUrl.hostname)
        && localHosts.has(expectedUrl.hostname)
        && receivedUrl.protocol === expectedUrl.protocol
        && receivedUrl.port === expectedUrl.port;
    if (!sameLocalServer)
        throw new ApiError("Yêu cầu không hợp lệ. Vui lòng tải lại trang.", 403);
}
export async function readJson(request: Request) {
    if (!request.headers.get("content-type")?.includes("application/json"))
        throw new ApiError("Yêu cầu phải có nội dung JSON.", 415);
    const limit = 65536;
    if (Number(request.headers.get("content-length") || 0) > limit)
        throw new ApiError("Nội dung quá dài.", 413);
    const reader = request.body?.getReader();
    if (!reader)
        throw new ApiError("Thiếu nội dung JSON.");
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        size += value.byteLength;
        if (size > limit) {
            await reader.cancel();
            throw new ApiError("Nội dung quá dài.", 413);
        }
        chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
    }
    try {
        return JSON.parse(new TextDecoder().decode(body)) as unknown;
    }
    catch {
        throw new ApiError("JSON không hợp lệ.");
    }
}
export function errorResponse(error: unknown) {
    if (error instanceof ZodError)
        return Response.json({ error: error.issues[0]?.message || "Dữ liệu không hợp lệ." }, { status: 400 });
    if (error instanceof ApiError)
        return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
        return Response.json({ error: "Dữ liệu đã tồn tại." }, { status: 409 });
    console.error("API failure:", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "Không thể xử lý yêu cầu. Vui lòng thử lại." }, { status: 500 });
}
