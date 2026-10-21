import {
  LayoutDashboard, BookOpen, Layers, Headphones, Mic, FileText, PenLine,
  Sparkles, Trophy, Heart, NotebookPen, Settings, Bell, Route, CalendarDays,
  ChartNoAxesCombined, Users, FileQuestion, CreditCard, Flag, GraduationCap,
  type LucideIcon,
} from "lucide-react";

export type WorkspaceLink = { href: string; label: string; icon: LucideIcon };
export const mainLinks: WorkspaceLink[] = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/study-plan", label: "Lộ trình của tôi", icon: Route },
];
export const learningLinks: WorkspaceLink[] = [
  { href: "/courses", label: "Khóa học", icon: BookOpen },
  { href: "/vocabulary", label: "Từ vựng", icon: Layers },
  { href: "/flashcards", label: "Ôn flashcard", icon: Layers },
  { href: "/dictionary", label: "Từ điển", icon: BookOpen },
  { href: "/grammar", label: "Ngữ pháp", icon: FileText },
  { href: "/listening", label: "Luyện nghe", icon: Headphones },
  { href: "/speaking", label: "Luyện nói", icon: Mic },
  { href: "/reading", label: "Luyện đọc", icon: BookOpen },
  { href: "/writing", label: "Luyện viết", icon: PenLine },
  { href: "/exams", label: "Luyện đề TOEIC / IELTS", icon: FileQuestion },
];
export const communityLinks: WorkspaceLink[] = [
  { href: "/ai-tutor", label: "AI Tutor", icon: Sparkles },
  { href: "/leaderboard", label: "Bảng xếp hạng", icon: Trophy },
];
export const personalLinks: WorkspaceLink[] = [
  { href: "/billing", label: "Gói học & thanh toán", icon: CreditCard },
  { href: "/favorites", label: "Đã lưu", icon: Heart },
  { href: "/notes", label: "Ghi chú", icon: NotebookPen },
  { href: "/calendar", label: "Lịch học", icon: CalendarDays },
  { href: "/analytics", label: "Thống kê", icon: ChartNoAxesCombined },
  { href: "/achievements", label: "Thành tích", icon: Trophy },
  { href: "/profile", label: "Hồ sơ cá nhân", icon: Users },
  { href: "/notifications", label: "Thông báo", icon: Bell },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];
export const adminLinks: WorkspaceLink[] = [
  { href: "/admin", label: "Tổng quan quản trị", icon: LayoutDashboard },
  { href: "/admin/users", label: "Học viên", icon: Users },
  { href: "/admin/courses", label: "Khóa học", icon: BookOpen },
  { href: "/admin/lessons", label: "Bài học", icon: GraduationCap },
  { href: "/admin/vocabulary", label: "Từ vựng", icon: Layers },
  { href: "/admin/grammar", label: "Ngữ pháp", icon: FileText },
  { href: "/admin/listening", label: "Bài nghe", icon: Headphones },
  { href: "/admin/reading", label: "Bài đọc", icon: BookOpen },
  { href: "/admin/questions", label: "Câu hỏi", icon: FileQuestion },
  { href: "/admin/subscriptions", label: "Gói thành viên", icon: CreditCard },
  { href: "/admin/reports", label: "Báo cáo", icon: Flag },
  { href: "/admin/settings", label: "Cấu hình", icon: Settings },
];
export const mobileTabs: WorkspaceLink[] = [
  { href: "/dashboard", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/study-plan", label: "Học tập", icon: Route },
  { href: "/vocabulary", label: "Luyện tập", icon: Layers },
  { href: "/ai-tutor", label: "AI Tutor", icon: Sparkles },
];
export function navigationIsActive(href: string, pathname: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
}
export function mobileTabForPath(pathname: string) {
  if (["/study-plan", "/courses", "/lessons"].some((path) => navigationIsActive(path, pathname))) return "/study-plan";
  if (["/vocabulary", "/flashcards", "/dictionary", "/grammar", "/listening", "/speaking", "/reading", "/writing", "/quiz"].some((path) => navigationIsActive(path, pathname))) return "/vocabulary";
  return mobileTabs.find((link) => navigationIsActive(link.href, pathname))?.href || "menu";
}
export function workspacePageTitle(pathname: string) {
  const links = [...mainLinks, ...learningLinks, ...communityLinks, ...personalLinks, ...adminLinks,
    { href: "/lessons", label: "Bài học" }, { href: "/quiz", label: "Luyện tập" },
    { href: "/placement-test", label: "Kiểm tra tiếng Anh" }, { href: "/onboarding", label: "Thiết lập lộ trình" },
  ];
  return links.sort((a, b) => b.href.length - a.href.length).find((link) => navigationIsActive(link.href, pathname))?.label || "Không gian học tập";
}
