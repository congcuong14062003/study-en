"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
export function Navbar() {
    const [open, setOpen] = useState(false);
    const { data: session, status } = useSession();
    const authenticated = status === "authenticated" && Boolean(session?.user);
    return <header className="marketing-nav"><div className="container nav-inner"><Brand /><nav aria-label="Điều hướng chính" className={open ? "public-links open" : "public-links"}><Link href="/" onClick={() => setOpen(false)}>Trang chủ</Link><Link href="/courses" onClick={() => setOpen(false)}>Khóa học</Link><Link href="/vocabulary" onClick={() => setOpen(false)}>Tự học</Link><Link href="/ai-tutor" onClick={() => setOpen(false)}>AI Tutor <span className="tiny-new">MỚI</span></Link><Link href="/blog" onClick={() => setOpen(false)}>Blog</Link><Link href="/pricing" onClick={() => setOpen(false)}>Bảng giá</Link></nav><div className="nav-actions"><ThemeToggle />{status !== "loading" && (authenticated ? <Button asChild size="sm"><Link href="/dashboard">Vào học</Link></Button> : <><Link className="login-link" href="/login">Đăng nhập</Link><Button asChild size="sm"><Link href="/register">Bắt đầu miễn phí</Link></Button></>)}<Button className="mobile-menu-toggle" variant="ghost" size="icon" aria-label="Mở menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button></div></div></header>;
}
