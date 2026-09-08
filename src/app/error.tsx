"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}) {
    return <main id="main-content" className="error-page"><div><div className="error-code">Oops.</div><h1>Hành trình tạm chậm một nhịp.</h1><p>Chưa thể tải trang lúc này. Hãy thử lại sau vài giây.</p><div className="flex-row"><Button onClick={reset}>Thử lại</Button><Button variant="outline" asChild><Link href="/">Về trang chủ</Link></Button></div></div></main>;
}
