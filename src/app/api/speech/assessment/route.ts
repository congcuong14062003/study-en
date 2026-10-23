import { requireUser } from "@/lib/auth";
import { ApiError, checkOrigin, errorResponse, rateLimit } from "@/lib/security";
import { MAX_WAV_BYTES, validateSpeechWav } from "@/lib/speech-audio";
import { assessSpeech, speechAssessmentInput, speechConfiguration } from "@/lib/speech-assessment";
export const runtime = "nodejs";
export async function GET() {
  try { await requireUser(); return Response.json({ configured: Boolean(speechConfiguration()), maxSeconds: 28, dailyLimit: 20 }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireUser();
    const config = speechConfiguration();
    if (!config) throw new ApiError("Chưa bật Azure Speech. Quản trị viên cần cấu hình AZURE_SPEECH_KEY và AZURE_SPEECH_REGION.", 503);
    if (request.headers.get("content-type") !== "audio/wav") throw new ApiError("Chỉ nhận bản thu WAV.", 415);
    let reference: string;
    try { reference = decodeURIComponent(request.headers.get("x-reference-text") || ""); } catch { throw new ApiError("Câu mẫu không hợp lệ."); }
    const input = speechAssessmentInput.parse({ reference, locale: request.headers.get("x-speech-language") });
    if (Number(request.headers.get("content-length") || 0) > MAX_WAV_BYTES) throw new ApiError("Bản thu quá lớn.", 413);
    const reader = request.body?.getReader();
    if (!reader) throw new ApiError("Thiếu bản thu.");
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > MAX_WAV_BYTES) { await reader.cancel(); throw new ApiError("Bản thu quá lớn.", 413); }
      chunks.push(value);
    }
    const audio = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { audio.set(chunk, offset); offset += chunk.length; }
    try { validateSpeechWav(audio); } catch (error) { throw new ApiError((error as Error).message); }
    await rateLimit(`speech:assessment:burst:${user.id}`, 8, 60);
    await rateLimit(`speech:assessment:day:${user.id}`, 20, 86400);
    await rateLimit("speech:assessment:capacity", 100, 60);
    try { return Response.json(await assessSpeech(config, input, audio), { headers: { "Cache-Control": "no-store" } }); }
    catch (error) { throw new ApiError(error instanceof Error && error.name !== "TimeoutError" ? error.message : "Chấm phát âm quá thời gian. Vui lòng thử lại.", 503); }
  } catch (error) { return errorResponse(error); }
}
