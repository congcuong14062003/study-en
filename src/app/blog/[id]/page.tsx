import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { blogPosts } from "@/lib/blog";
export function generateStaticParams() {
    return blogPosts.map(p => ({ id: p.id }));
}
export async function generateMetadata({ params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;
    const p = blogPosts.find(p => p.id === id);
    return { title: p?.title || "Bài viết", description: p?.description };
}
export default async function Page({ params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;
    const p = blogPosts.find(p => p.id === id);
    if (!p)
        notFound();
    return <><Navbar /><main className="container landing-section content-narrow" id="main-content"><Link href="/blog" className="back-link">← Góc học tập</Link><span className="eyebrow">CÁCH HỌC · {p.minutes} PHÚT ĐỌC</span><h1 className="blog-title">{p.title}</h1><p className="page-subtitle">{p.description}</p><article className="blog-body">{p.sections.map(s => <section key={s.title}><h2>{s.title}</h2><p>{s.body}</p></section>)}</article><Link href="/register" className="text-link">Bắt đầu hành trình của bạn →</Link></main><Footer /></>;
}
