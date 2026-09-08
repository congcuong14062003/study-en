import { Landing } from "@/components/landing";
export default function HomePage() {
    const data = { "@context": "https://schema.org", "@type": "WebSite", name: "EnglishMaster", inLanguage: "vi", url: process.env.NEXTAUTH_URL || "http://127.0.0.1:3000", description: "Nền tảng học tiếng Anh cho người Việt" };
    return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}/><Landing /></>;
}
