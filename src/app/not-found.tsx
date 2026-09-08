import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function NotFound() {
    return <main id="main-content" className="error-page"><div><div className="error-code">404</div><h1>Có vẻ bạn đã rẽ sang một lối khác.</h1><p>Trang này không tồn tại hoặc đã được chuyển đi.</p><Button asChild><Link href="/"><ArrowLeft size={16}/>Trở về trang chủ</Link></Button></div></main>;
}
