import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog";
export const dynamic = "force-dynamic";
export default function sitemap(): MetadataRoute.Sitemap {
    const base = process.env.NEXTAUTH_URL || "http://127.0.0.1:3000";
    return ["", "/courses", "/pricing", "/blog", ...blogPosts.map(p => `/blog/${p.id}`)].map(path => ({ url: `${base}${path}`, changeFrequency: "weekly", priority: path === "" ? 1 : .7 }));
}
