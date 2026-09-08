import type { Metadata, Viewport } from "next";
import "@fontsource/plus-jakarta-sans/vietnamese-400.css";
import "@fontsource/plus-jakarta-sans/vietnamese-500.css";
import "@fontsource/plus-jakarta-sans/vietnamese-600.css";
import "@fontsource/plus-jakarta-sans/vietnamese-700.css";
import "@fontsource/plus-jakarta-sans/vietnamese-800.css";
import "@fontsource/plus-jakarta-sans/latin-400.css";
import "@fontsource/plus-jakarta-sans/latin-500.css";
import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-800.css";
import "./globals.css";
import { Providers } from "@/components/providers";
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"), title: { default: "EnglishMaster — Chinh phục tiếng Anh mỗi ngày", template: "%s | EnglishMaster" }, description: "Học tiếng Anh theo lộ trình của bạn. Từ vựng, ngữ pháp, nghe, nói, đọc, viết và AI Tutor dành cho người Việt.", openGraph: { title: "EnglishMaster", description: "Chinh phục tiếng Anh mỗi ngày", locale: "vi_VN", type: "website" } };
export const viewport: Viewport = { themeColor: "#5046e5" };
export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
    return <html lang="vi" suppressHydrationWarning><body><a href="#main-content" className="skip-link">Đi đến nội dung</a><Providers>{children}</Providers></body></html>;
}
