import { Suspense } from "react";
import nextDynamic from "next/dynamic";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Dashboard } from "@/components/dashboard/dashboard";
import { Courses } from "@/components/course/courses";
import { VocabularyPage, Flashcards } from "@/components/learning/vocabulary";
import { ContentLibrary } from "@/components/learning/content-library";
import { QuizPage } from "@/components/quiz/quiz-player";
import { Dictionary } from "@/components/learning/dictionary";
import { Onboarding } from "@/components/account/onboarding";
import { Notes, Favorites, Notifications } from "@/components/account/collections";
import { ProgressPages, Leaderboard } from "@/components/account/progress-pages";
import { ProfileSettings } from "@/components/account/profile-settings";
import { LoadingSkeleton } from "@/components/ui/states";
export const dynamic = "force-dynamic";
const LessonPlayer = nextDynamic(() => import("@/components/learning/lesson-player").then(m => m.LessonPlayer), { loading: () => <LoadingSkeleton /> });
const Speaking = nextDynamic(() => import("@/components/learning/speaking").then(m => m.Speaking), { loading: () => <LoadingSkeleton /> });
const Writing = nextDynamic(() => import("@/components/learning/writing").then(m => m.Writing), { loading: () => <LoadingSkeleton /> });
const AIChat = nextDynamic(() => import("@/components/ai/ai-chat").then(m => m.AIChat), { loading: () => <LoadingSkeleton /> });
const AdminDashboard = nextDynamic(() => import("@/components/admin/admin-dashboard").then(m => m.AdminDashboard), { loading: () => <LoadingSkeleton /> });
const routeTitles: Record<string, string> = { dashboard: "Tổng quan", courses: "Khóa học", vocabulary: "Từ vựng", flashcards: "Ôn flashcard", grammar: "Ngữ pháp", listening: "Luyện nghe", speaking: "Luyện nói", reading: "Luyện đọc", writing: "Luyện viết", "ai-tutor": "AI Tutor", dictionary: "Từ điển", favorites: "Đã lưu", notes: "Ghi chú", calendar: "Lịch học", achievements: "Thành tích", leaderboard: "Bảng xếp hạng", "study-plan": "Lộ trình học", analytics: "Thống kê", notifications: "Thông báo", profile: "Hồ sơ", settings: "Cài đặt", onboarding: "Làm quen với bạn", "placement-test": "Kiểm tra trình độ", quiz: "Luyện tập", lessons: "Bài học", admin: "Quản trị" };
type Props = {
    params: Promise<{
        section: string;
        slug?: string[];
    }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params }: Props) {
    const { section } = await params;
    return { title: routeTitles[section] || "Không tìm thấy" };
}
export default async function Page({ params, searchParams }: Props) {
    const { section, slug } = await params;
    const query = await searchParams;
    const id = slug?.[0];
    if (!(section in routeTitles) || slug && slug.length > 1)
        notFound();
    if (id && !['courses', 'grammar', 'listening', 'reading', 'lessons', 'admin'].includes(section))
        notFound();
    if (section === 'admin' && id && !['users', 'courses', 'lessons', 'vocabulary', 'grammar', 'listening', 'reading', 'questions', 'subscriptions', 'reports', 'settings'].includes(id))
        notFound();
    const user = await currentUser();
    if (!user && section !== "courses")
        redirect(`/login?callbackUrl=${encodeURIComponent(`/${section}${id ? `/${id}` : ""}`)}`);
    if (user && section === "dashboard" && !user.profile?.onboardingComplete)
        redirect("/onboarding");
    if (user && section === "dashboard" && !user.profile?.placementComplete)
        redirect("/placement-test");
    if (section === "admin" && user?.role !== "ADMIN")
        redirect("/forbidden");
    let content: React.ReactNode;
    switch (section) {
        case "dashboard":
            content = <Dashboard />;
            break;
        case "courses":
            content = <Courses id={id} userId={user?.id}/>;
            break;
        case "vocabulary":
            content = <VocabularyPage />;
            break;
        case "flashcards":
            content = <Flashcards />;
            break;
        case "grammar":
        case "listening":
        case "reading":
            content = <ContentLibrary kind={section} id={id}/>;
            break;
        case "lessons":
            if (!id)
                notFound();
            content = <LessonPlayer id={id}/>;
            break;
        case "quiz":
            content = <QuizPage quizId={`practice-${["vocabulary", "grammar", "reading", "listening"].includes(String(query.type)) ? query.type : "vocabulary"}`}/>;
            break;
        case "placement-test":
            content = <QuizPage quizId="placement"/>;
            break;
        case "onboarding":
            content = <Onboarding />;
            break;
        case "speaking":
            content = <Speaking />;
            break;
        case "writing":
            content = <Writing />;
            break;
        case "dictionary":
            content = <Dictionary />;
            break;
        case "ai-tutor":
            content = <AIChat />;
            break;
        case "favorites":
            content = <Favorites />;
            break;
        case "notes":
            content = <Notes />;
            break;
        case "notifications":
            content = <Notifications />;
            break;
        case "analytics":
        case "calendar":
        case "achievements":
        case "study-plan":
            content = <ProgressPages section={section}/>;
            break;
        case "leaderboard":
            content = <Leaderboard userId={user!.id}/>;
            break;
        case "profile":
        case "settings":
            content = <ProfileSettings settings={section === "settings"}/>;
            break;
        case "admin":
            content = <AdminDashboard section={id}/>;
            break;
        default: notFound();
    }
    return <AppShell user={user ? { id: user.id, name: user.name, email: user.email, role: user.role, profile: user.profile ? { level: user.profile.level } : null } : null}><Suspense fallback={<LoadingSkeleton />}>{content}</Suspense></AppShell>;
}
