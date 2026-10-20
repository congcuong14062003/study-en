import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function initials(name?: string | null) {
  return (name || "Học viên")
    .split(" ")
    .slice(-2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}
export function formatNumber(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}
export async function api<T = Record<string, unknown>>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await response.text();
  let data: unknown;
  let validJson = false;
  try {
    data = JSON.parse(body);
    validJson = true;
  } catch {
    // Framework/proxy errors can return an empty body or HTML instead of JSON.
  }
  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string" &&
      data.error.trim()
        ? data.error
        : `Yêu cầu thất bại (HTTP ${response.status}). Vui lòng thử lại.`;
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  if (!validJson)
    throw new Error("Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
  return data as T;
}
