import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
export function initials(name?: string | null) {
    return (name || "Học viên").split(" ").slice(-2).map(x => x[0]).join("").toUpperCase();
}
export function formatNumber(n: number) {
    return new Intl.NumberFormat("vi-VN").format(n);
}
export async function api<T = Record<string, unknown>>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`/api${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
    const data = await response.json();
    if (!response.ok)
        throw new Error(data.error || "Có lỗi xảy ra. Vui lòng thử lại.");
    return data as T;
}
