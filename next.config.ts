import type { NextConfig } from "next";

function absoluteOrigin(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed)
    return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.origin;
  }
  catch {
    return null;
  }
}

const nextAuthUrl = absoluteOrigin(process.env.NEXTAUTH_URL)
  || absoluteOrigin(process.env.VERCEL_URL)
  || "http://127.0.0.1:3000";

// next-auth/react treats an empty NEXTAUTH_URL as a real value and passes it to
// new URL(). Normalize it before Next.js imports application modules to prerender.
process.env.NEXTAUTH_URL = nextAuthUrl;

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  env: {
    NEXTAUTH_URL: nextAuthUrl,
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" }
    ] }];
  }
};
export default config;
