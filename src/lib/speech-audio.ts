/** Azure short-audio assessment: mono PCM16 WAV at 16 kHz, at most 30 seconds. */
export const MAX_WAV_BYTES = 44 + 30 * 16000 * 2;
export function encodeSpeechWav(samples: Float32Array) {
  if (samples.length < 3200 || samples.length > 30 * 16000) throw new Error("Bản thu phải dài từ 0,2 đến 30 giây.");
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const label = (offset: number, text: string) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
  label(0, "RIFF"); view.setUint32(4, bytes.length - 8, true); label(8, "WAVE");
  label(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  label(36, "data"); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) { const value = Math.max(-1, Math.min(1, Number.isFinite(samples[i]) ? samples[i] : 0)); view.setInt16(44 + i * 2, value * (value < 0 ? 32768 : 32767), true); }
  return bytes;
}
export function validateSpeechWav(bytes: Uint8Array) {
  if (bytes.length < 6444 || bytes.length > MAX_WAV_BYTES) throw new Error("Bản thu phải dài từ 0,2 đến 30 giây.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const label = (offset: number, length: number) => new TextDecoder().decode(bytes.slice(offset, offset + length));
  if (label(0, 4) !== "RIFF" || label(8, 4) !== "WAVE" || label(12, 4) !== "fmt " || label(36, 4) !== "data" ||
    view.getUint32(4, true) !== bytes.length - 8 || view.getUint32(16, true) !== 16 || view.getUint16(20, true) !== 1 ||
    view.getUint16(22, true) !== 1 || view.getUint32(24, true) !== 16000 || view.getUint32(28, true) !== 32000 ||
    view.getUint16(32, true) !== 2 || view.getUint16(34, true) !== 16 || view.getUint32(40, true) !== bytes.length - 44 || (bytes.length - 44) % 2)
    throw new Error("Cần bản thu WAV PCM16 mono 16 kHz hợp lệ.");
}
export async function speechBlobToWav(blob: Blob) {
  if (blob.size > 8 * 1024 * 1024) throw new Error("Bản thu quá lớn. Hãy đọc một câu ngắn.");
  const context = new OfflineAudioContext(1, 1, 16000);
  const decoded = await context.decodeAudioData(await blob.arrayBuffer());
  if (decoded.sampleRate !== 16000) throw new Error("Trình duyệt chưa chuyển được âm thanh về 16 kHz. Hãy thử Chrome hoặc Edge.");
  if (decoded.duration > 30) throw new Error("Bản thu quá 30 giây. Hãy đọc lại câu ngắn hơn.");
  const mixed = new Float32Array(decoded.length);
  for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
    const values = decoded.getChannelData(channel);
    for (let i = 0; i < mixed.length; i++) mixed[i] += values[i] / decoded.numberOfChannels;
  }
  return new Blob([encodeSpeechWav(mixed).buffer as ArrayBuffer], { type: "audio/wav" });
}
