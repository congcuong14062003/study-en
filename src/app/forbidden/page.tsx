import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function Page() {
    return <main className="error-page" id="main-content"><div><div className="error-code">403</div><h1>Trang này dành cho quản trị viên.</h1><p>Tài khoản của bạn chưa có quyền truy cập.</p><Button asChild><Link href="/dashboard">Về không gian học tập</Link></Button></div></main>;
}
