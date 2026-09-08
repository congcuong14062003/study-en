"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, BookOpen, Layers, Headphones, Mic, FileText, PenLine, Sparkles, Trophy, Heart, NotebookPen, Settings, ChevronRight, Search, Bell, ArrowUpRight, Crown, LogOut, Route, CalendarDays, ChartNoAxesCombined, Shield, Users, FileQuestion, CreditCard, Flag, GraduationCap } from "lucide-react";
import { signOut } from "next-auth/react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { SearchModal } from "./search-modal";
import { initials } from "@/lib/utils";
export type ShellUser = {
    id: string;
    name: string | null;
    email: string;
    role: string;
    profile?: {
        level: string;
    } | null;
};
const learningLinks = [{ href: "/courses", label: "Khóa học", icon: BookOpen }, { href: "/vocabulary", label: "Từ vựng", icon: Layers }, { href: "/grammar", label: "Ngữ pháp", icon: FileText }, { href: "/listening", label: "Luyện nghe", icon: Headphones }, { href: "/speaking", label: "Luyện nói", icon: Mic }, { href: "/reading", label: "Luyện đọc", icon: BookOpen }, { href: "/writing", label: "Luyện viết", icon: PenLine }];
const personalLinks = [{ href: "/favorites", label: "Đã lưu", icon: Heart }, { href: "/notes", label: "Ghi chú", icon: NotebookPen }, { href: "/calendar", label: "Lịch học", icon: CalendarDays }, { href: "/analytics", label: "Thống kê", icon: ChartNoAxesCombined }, { href: "/settings", label: "Cài đặt", icon: Settings }];
const adminLinks = [{ href: "/admin", label: "Tổng quan", icon: LayoutDashboard }, { href: "/admin/users", label: "Học viên", icon: Users }, { href: "/admin/courses", label: "Khóa học", icon: BookOpen }, { href: "/admin/lessons", label: "Bài học", icon: GraduationCap }, { href: "/admin/vocabulary", label: "Từ vựng", icon: Layers }, { href: "/admin/grammar", label: "Ngữ pháp", icon: FileText }, { href: "/admin/listening", label: "Bài nghe", icon: Headphones }, { href: "/admin/reading", label: "Bài đọc", icon: BookOpen }, { href: "/admin/questions", label: "Câu hỏi", icon: FileQuestion }, { href: "/admin/subscriptions", label: "Gói thành viên", icon: CreditCard }, { href: "/admin/reports", label: "Báo cáo", icon: Flag }, { href: "/admin/settings", label: "Cấu hình", icon: Settings }];
export function AppShell({ children, user }: {
    children: React.ReactNode;
    user: ShellUser | null;
}) {
    const pathname = usePathname();
    const [search, setSearch] = useState(false);
    const admin = pathname.startsWith("/admin");
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setSearch(v => !v);
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);
    const nav = (items: typeof learningLinks) => <nav className="sidebar-links">{items.map(({ href, label, icon: Icon }) => <Link key={href} className={pathname === href || (href !== "/admin" && pathname.startsWith(href + "/")) ? "active" : ""} href={href}><Icon />{label}</Link>)}</nav>;
    const title = [...learningLinks, ...personalLinks, ...adminLinks, { href: "/dashboard", label: "Tổng quan" }, { href: "/ai-tutor", label: "AI Tutor" }, { href: "/leaderboard", label: "Bảng xếp hạng" }, { href: "/flashcards", label: "Ôn tập từ vựng" }, { href: "/study-plan", label: "Lộ trình học" }, { href: "/achievements", label: "Thành tích" }, { href: "/profile", label: "Hồ sơ cá nhân" }].find(l => l.href === pathname)?.label || "Không gian học tập";
    return <><aside className="sidebar"><Brand /><div className="sidebar-scroll">{admin ? <><p className="nav-label">QUẢN TRỊ NỘI DUNG</p>{nav(adminLinks)}<hr className="divider"/>{nav([{ href: "/dashboard", label: "Về trang học tập", icon: ArrowUpRight }])}</> : <>{nav([{ href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard }, { href: "/study-plan", label: "Lộ trình của tôi", icon: Route }])}<p className="nav-label">KHÔNG GIAN HỌC TẬP</p>{nav(learningLinks)}<nav className="sidebar-links"><Link href="/ai-tutor" className={pathname === "/ai-tutor" ? "active" : ""}><Sparkles />AI Tutor<span className="badge">AI</span></Link><Link href="/leaderboard" className={pathname === "/leaderboard" ? "active" : ""}><Trophy />Bảng xếp hạng</Link></nav><p className="nav-label">GÓC CỦA BẠN</p>{nav(personalLinks)}{user?.role === "ADMIN" && nav([{ href: "/admin", label: "Quản trị", icon: Shield }])}<div className="sidebar-upgrade"><Crown size={24}/><h4>Mở khóa tiềm năng của bạn</h4><p>Học sâu hơn cùng EnglishMaster Premium.</p><Button asChild><Link href="/pricing">Khám phá Premium <ArrowUpRight size={13}/></Link></Button></div></>}</div><div className="sidebar-user"><Link href={user ? "/profile" : "/login"} className="avatar">{initials(user?.name)}</Link><div><strong>{user?.name || "Khách tham quan"}</strong><small>{user ? `${user.profile?.level || "A1"} · Tài khoản ${user.role === "PREMIUM" ? "Premium" : "Free"}` : "Bắt đầu hành trình của bạn"}</small></div>{user ? <Button variant="ghost" size="icon" aria-label="Đăng xuất" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={15}/></Button> : <Link href="/login"><ChevronRight size={15}/></Link>}</div></aside><div className="workspace"><header className="workspace-topbar"><div className="breadcrumb"><span>{admin ? "Quản trị" : "Không gian học tập"}</span><ChevronRight size={12}/><strong>{title}</strong></div><div className="topbar-actions"><button className="search-trigger" onClick={() => setSearch(true)} aria-label="Tìm kiếm (Ctrl K)"><Search size={15}/><span>Tìm kiếm điều bạn muốn học…</span><kbd>⌘ K</kbd></button><ThemeToggle /><Button asChild variant="ghost" size="icon" className="notification-button"><Link href="/notifications" aria-label="Thông báo"><Bell size={18}/></Link></Button><Link href={user ? "/profile" : "/login"} className="avatar" aria-label="Hồ sơ cá nhân">{initials(user?.name)}</Link></div></header><main className="workspace-main" id="main-content">{children}</main></div><nav className="mobile-bottom-nav" aria-label="Điều hướng di động">{[{ href: "/dashboard", label: "Trang chủ", icon: LayoutDashboard }, { href: "/courses", label: "Học tập", icon: BookOpen }, { href: "/vocabulary", label: "Luyện tập", icon: Layers }, { href: "/ai-tutor", label: "AI Tutor", icon: Sparkles }, { href: "/profile", label: "Cá nhân", icon: Users }].map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={pathname === href ? "active" : ""}><Icon />{label}</Link>)}</nav><SearchModal open={search} onOpenChange={setSearch}/></>;
}
