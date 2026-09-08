import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
    return { rules: { userAgent: "*", allow: ["/", "/courses", "/pricing", "/blog"], disallow: ["/api/", "/admin/", "/dashboard", "/profile", "/settings", "/reset-password", "/notes", "/ai-tutor"] }, sitemap: `${process.env.NEXTAUTH_URL || "http://127.0.0.1:3000"}/sitemap.xml` };
}
