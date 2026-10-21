"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, type MouseEvent } from "react";
import { ChevronRight, Search, Bell, ArrowUpRight, Crown, LogOut, Menu, Shield } from "lucide-react";
import { signOut } from "next-auth/react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SearchModal } from "./search-modal";
import { initials } from "@/lib/utils";
import { PageMotion } from "@/components/ui/motion";
import { LearningLanguageProvider, LanguageSwitcher } from "@/components/learning/language-switcher";
import { learningLanguage, learningLanguages } from "@/lib/languages";
import {
  mainLinks, learningLinks, personalLinks, communityLinks, adminLinks, mobileTabs,
  navigationIsActive, mobileTabForPath, workspacePageTitle, type WorkspaceLink,
} from "@/lib/workspace-navigation";

export type ShellUser = {
  id: string; name: string | null; email: string; role: string;
  premiumActive?: boolean; targetLanguage?: string; profile?: { level: string } | null;
};
export function AppShell({ children, user }: { children: React.ReactNode; user: ShellUser | null }) {
  const pathname = usePathname();
  const [search, setSearch] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileTrigger = useRef<HTMLButtonElement | null>(null);
  const mobileTitle = useRef<HTMLHeadingElement | null>(null);
  const admin = pathname.startsWith("/admin");
  const language = learningLanguage(user?.targetLanguage);
  const title = workspacePageTitle(pathname);
  const activeTab = mobileTabForPath(pathname);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setSearch((value) => !value);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 701px)");
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    mobileTrigger.current = event.currentTarget;
    setMobileOpen(true);
  }
  const nav = (items: WorkspaceLink[], label: string, mobile = false) => (
    <nav className="sidebar-links" aria-label={label}>
      {items.map(({ href, label: name, icon: Icon }) => (
        <Link key={href} href={href}
          className={navigationIsActive(href, pathname) ? "active" : ""}
          aria-current={navigationIsActive(href, pathname) ? "page" : undefined}
          onClick={mobile ? () => setMobileOpen(false) : undefined}
        >
          <Icon />{name}{href === "/ai-tutor" && <span className="badge">AI</span>}
        </Link>
      ))}
    </nav>
  );
  const accountLabel = user
    ? (language === "zh" ? "Nhập môn" : user.profile?.level || "A1") + " · Tài khoản " + (user.premiumActive ? "Premium" : user.role === "ADMIN" ? "Admin" : "Free")
    : "Bắt đầu hành trình của bạn";
  return (
    <LearningLanguageProvider value={language}>
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-scroll">
          {admin ? <>
            <p className="nav-label">QUẢN TRỊ NỘI DUNG</p>
            {nav(adminLinks, "Điều hướng quản trị")}
            <hr className="divider" />
            {nav([{ href: "/dashboard", label: "Về trang học tập", icon: ArrowUpRight }], "Trở về học tập")}
          </> : <>
            {nav(mainLinks, "Hành trình học")}
            <p className="nav-label">KHÔNG GIAN HỌC TẬP</p>
            {nav(learningLinks, "Các mục học tập")}
            {nav(communityLinks, "AI và cộng đồng")}
            <p className="nav-label">GÓC CỦA BẠN</p>
            {nav(personalLinks, "Cá nhân")}
            {user?.role === "ADMIN" && nav([{ href: "/admin", label: "Quản trị", icon: Shield }], "Quản trị")}
            <div className="sidebar-upgrade">
              <Crown size={24} /><h4>Mở khóa tiềm năng của bạn</h4>
              <p>Học sâu hơn cùng EnglishMaster Premium.</p>
              <Button asChild><Link href="/pricing">Khám phá Premium <ArrowUpRight size={13} /></Link></Button>
            </div>
          </>}
        </div>
        <div className="sidebar-user">
          <Link href={user ? "/profile" : "/login"} className="avatar">{initials(user?.name)}</Link>
          <div><strong>{user?.name || "Khách tham quan"}</strong><small>{accountLabel}</small></div>
          {user ? <Button variant="ghost" size="icon" aria-label="Đăng xuất" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={15} /></Button>
            : <Link href="/login" aria-label="Đăng nhập"><ChevronRight size={15} /></Link>}
        </div>
      </aside>
      <div className="workspace">
        <header className="workspace-topbar">
          <Button className="workspace-menu-toggle" variant="ghost" size="icon" onClick={openMenu}
            aria-label="Mở menu học tập" aria-expanded={mobileOpen} aria-controls="mobile-workspace-navigation"><Menu size={22} /></Button>
          <div className="breadcrumb">
            <span>{admin ? "Quản trị" : "Không gian học tập"}</span><ChevronRight size={12} /><strong title={title}>{title}</strong>
          </div>
          <div className="topbar-actions">
            {user && !admin && <LanguageSwitcher />}
            <button className="search-trigger" onClick={() => setSearch(true)} aria-label="Tìm kiếm (Ctrl K)">
              <Search size={15} /><span>Tìm kiếm điều bạn muốn học…</span><kbd>⌘ K</kbd>
            </button>
            <span className="topbar-theme"><ThemeToggle /></span>
            <Button asChild variant="ghost" size="icon" className="notification-button"><Link href="/notifications" aria-label="Thông báo"><Bell size={18} /></Link></Button>
            <Link href={user ? "/profile" : "/login"} className="avatar" aria-label="Hồ sơ cá nhân">{initials(user?.name)}</Link>
          </div>
        </header>
        <main className="workspace-main" id="main-content">
          {language === "zh" && ["/exams", "/placement-test", "/onboarding"].some((path) => pathname.startsWith(path)) && (
            <p className="notice">Mục này dành riêng cho tiếng Anh (CEFR/TOEIC/IELTS). Đổi sang tiếng Anh để xem lộ trình tương ứng; tiến độ tiếng Trung của bạn vẫn được giữ.</p>
          )}
          <PageMotion>{children}</PageMotion>
        </main>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Điều hướng di động">
        {mobileTabs.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href} className={activeTab === href ? "active" : ""} aria-current={activeTab === href ? "location" : undefined}>
            <Icon />{label}
          </Link>
        ))}
        <button type="button" onClick={openMenu} className={mobileOpen || activeTab === "menu" ? "active" : ""}
          aria-label="Mở tất cả chức năng" aria-expanded={mobileOpen} aria-controls="mobile-workspace-navigation"><Menu />Menu</button>
      </nav>
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent id="mobile-workspace-navigation" className="mobile-navigation-dialog"
          onOpenAutoFocus={(event) => { event.preventDefault(); mobileTitle.current?.focus(); }}
          onCloseAutoFocus={(event) => { if (mobileTrigger.current?.isConnected) { event.preventDefault(); mobileTrigger.current.focus(); } }}>
          <DialogTitle ref={mobileTitle} tabIndex={-1}>Tất cả chức năng</DialogTitle>
          <DialogDescription>{admin ? "Quản trị nền tảng" : learningLanguages[language].name + " · " + title}</DialogDescription>
          <div className="mobile-navigation-account"><strong>{user?.name || "Khách tham quan"}</strong><span>{accountLabel}</span></div>
          {admin ? <>
            {nav(adminLinks, "Quản trị trên di động", true)}
            {nav([{ href: "/dashboard", label: "Về trang học tập", icon: ArrowUpRight }], "Về học tập", true)}
          </> : <>
            {nav(mainLinks, "Hành trình trên di động", true)}
            <h3>Không gian học tập</h3>{nav(learningLinks, "Học tập trên di động", true)}
            <h3>AI & cộng đồng</h3>{nav(communityLinks, "AI và cộng đồng trên di động", true)}
            <h3>Góc của bạn</h3>{nav(personalLinks, "Cá nhân trên di động", true)}
            {user?.role === "ADMIN" && nav([{ href: "/admin", label: "Quản trị", icon: Shield }], "Mở quản trị", true)}
          </>}
          <div className="mobile-navigation-footer">
            <span>Giao diện</span><ThemeToggle />
            {user ? <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={16} />Đăng xuất</Button>
              : <Button asChild><Link href="/login">Đăng nhập</Link></Button>}
          </div>
        </DialogContent>
      </Dialog>
      <SearchModal open={search} onOpenChange={setSearch} />
    </LearningLanguageProvider>
  );
}
