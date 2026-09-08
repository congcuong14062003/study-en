"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, Check, Clock, Flame, GraduationCap, LockKeyhole, Route, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/hooks/use-data";
import { formatNumber, initials } from "@/lib/utils";
import { PageHeading, StatCard, SkillProgress, ActivityChart } from "@/components/dashboard/dashboard";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui/states";
import type { DashboardData } from "@/services/dashboard";
export function ProgressPages({ section }: {
    section: "analytics" | "calendar" | "achievements" | "study-plan";
}) {
    const { data, loading, error, refresh } = useData<DashboardData>("/dashboard");
    const [monthOffset, setMonthOffset] = useState(0);
    if (loading)
        return <LoadingSkeleton />;
    if (error || !data)
        return <ErrorState message={error || "Không có dữ liệu"} retry={refresh}/>;
    const p = data.user.progress;
    const scores = (p?.skillScores || {}) as Record<string, number>;
    if (section === "achievements")
        return <><PageHeading title="Mỗi cột mốc đều đáng tự hào" description={`${data.achievements.length} / ${data.allBadges.length} thành tích đã mở khóa. Hành trình vẫn đang tiếp tục.`}><Badge><Trophy size={13}/> Bộ sưu tập của bạn</Badge></PageHeading><div className="grid-3">{data.allBadges.map((a, i) => {
            const own = data.achievements.find(o => o.achievementId === a.id);
            const Icon = a.icon === "flame" ? Flame : a.icon === "book" ? BookOpen : Trophy;
            return <Card className={`achievement-card ${own ? "unlocked" : "locked"}`} key={a.id}><span className={`achievement-large ${["orange", "purple", "green"][i % 3]}`}><Icon size={42}/>{!own && <LockKeyhole size={16}/>}</span><Badge className={own ? "green" : "neutral"}>{own ? "ĐÃ MỞ KHÓA" : "ĐANG CHINH PHỤC"}</Badge><h2>{a.title}</h2><p>{a.description}</p>{own && <span className="field-help">{new Date(own.unlockedAt).toLocaleDateString("vi-VN")}</span>}</Card>;
        })}</div></>;
    if (section === "study-plan") {
        const weeks = (data.plan?.weeks || [{ week: 1, topic: "Daily routines" }, { week: 2, topic: "Family & friends" }, { week: 3, topic: "Work & study" }, { week: 4, topic: "Travel & experiences" }]) as {
            week: number;
            topic: string;
        }[];
        const total = data.enrollments.reduce((s, c) => s + c.course.lessons.length, 0), done = data.lessonProgress.filter(p => p.completed).length;
        const weak = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];
        return <div className="content-narrow"><PageHeading title="Hành trình này là của bạn" description={`${data.user.profile?.level || "A1"} · Mục tiêu ${data.user.profile?.goal.toLowerCase() || "giao tiếp"} · ${data.user.profile?.dailyMinutes || 20} phút mỗi ngày`}><Button asChild variant="outline" size="sm"><Link href="/onboarding">Điều chỉnh lộ trình</Link></Button></PageHeading><Card className="plan-overview"><span className="icon-box"><Route size={26}/></span><div><h2>English {data.user.profile?.level} Roadmap</h2><p>{done} / {total} bài học đã hoàn thành</p><Progress value={total ? done / total * 100 : 0} className="mt-4"/></div></Card><div className="plan-timeline">{weeks.map((w, i) => <Card className="plan-week" key={w.week}><span className="week-number">{i + 1}</span><div><Badge className="neutral">TUẦN {w.week}</Badge><h2>{w.topic}</h2><p>{["Xây nền tảng qua những câu chuyện quen thuộc.", "Kết nối với những người quan trọng trong cuộc sống.", "Tự tin diễn đạt ý tưởng và phối hợp cùng người khác.", "Áp dụng kiến thức vào những trải nghiệm mới."][i % 4]}</p><div className="flex-row mt-4"><Link className="text-link" href="/courses">Khóa học phù hợp <ArrowRight size={14}/></Link><Link className="text-link" href="/vocabulary">Ôn từ vựng</Link></div></div></Card>)}</div><Card className="section-card"><div className="flex-row mb-4"><Sparkles size={20} className="purple-text"/><h2 style={{ margin: 0 }}>Gợi ý bước tiếp theo</h2></div><p>{weak ? `Kết quả gần nhất cho thấy ${weak[0]} đang ở ${weak[1]}%. Hãy dành thêm một buổi luyện tập cho kỹ năng này.` : "Hoàn thành bài kiểm tra đầu vào để nhận gợi ý phù hợp với điểm mạnh và phần cần cải thiện."}</p><Button asChild className="mt-4"><Link href={weak ? `/${weak[0] === "vocabulary" ? "vocabulary" : weak[0]}` : "/placement-test"}>{weak ? "Luyện tập kỹ năng này" : "Kiểm tra trình độ"}<ArrowRight size={16}/></Link></Button><p className="field-help mt-4">Gợi ý dựa trên kết quả bài làm đã lưu.</p></Card></div>;
    }
    if (section === "calendar") {
        const ref = new Date();
        ref.setMonth(ref.getMonth() + monthOffset, 1);
        const year = ref.getFullYear(), month = ref.getMonth(), days = new Date(year, month + 1, 0).getDate(), first = (ref.getDay() + 6) % 7;
        const monthGoals = data.goals.filter(g => g.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`));
        return <><PageHeading title="Một lịch học. Nhiều tiến bộ nhỏ." description="Nhìn lại nhịp học và những ngày bạn đã dành thời gian cho mình."/><Card className="section-card"><div className="flex-row justify-between mb-4"><h2>{ref.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}</h2><div className="flex-row"><Button variant="outline" size="sm" disabled={monthOffset <= -2} onClick={() => setMonthOffset(v => v - 1)}>Tháng trước</Button><Button variant="outline" size="sm" disabled={monthOffset >= 0} onClick={() => setMonthOffset(v => v + 1)}>Tháng sau</Button></div></div><div className="calendar-grid">{["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"].map(d => <span className="calendar-label" key={d}>{d}</span>)}{Array.from({ length: first }, (_, i) => <div key={`blank-${i}`}/>)}{Array.from({ length: days }, (_, i) => {
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
            const g = data.goals.find(g => g.date === key);
            return <div className={`calendar-day ${g ? "studied" : ""}`} key={key} title={`${key}: ${Math.floor((g?.seconds || 0) / 60)} phút, ${g?.xp || 0} XP`}><strong>{i + 1}</strong>{g && <><Check size={14}/><span>{Math.floor(g.seconds / 60)} phút</span></>}</div>;
        })}</div></Card><div className="stats-grid"><StatCard label="Ngày học trong tháng" value={String(monthGoals.length)} icon={CalendarDays}/><StatCard label="Phút học trong tháng" value={formatNumber(Math.floor(monthGoals.reduce((s, g) => s + g.seconds, 0) / 60))} icon={Clock} color="green"/><StatCard label="Chuỗi học hiện tại" value={`${p?.streak || 0} ngày`} icon={Flame} color="orange"/><StatCard label="Chuỗi dài nhất" value={`${p?.longestStreak || 0} ngày`} icon={Trophy} color="purple"/></div></>;
    }
    const attempts = data.attempts;
    const correct = attempts.reduce((s, a) => s + a.score, 0), questions = attempts.reduce((s, a) => s + a.total, 0);
    return <><PageHeading title="Nhìn lại để tiến xa hơn" description="Tiến bộ được tạo nên từ những điều bạn làm mỗi ngày."/><div className="stats-grid mb-4"><StatCard label="Tổng XP" value={formatNumber(p?.xp || 0)} icon={Zap}/><StatCard label="Từ vựng đã học" value={String(p?.wordsLearned || 0)} icon={BookOpen} color="blue"/><StatCard label="Độ chính xác quiz gần đây" value={questions ? `${Math.round(correct / questions * 100)}%` : "Chưa có"} icon={Target} color="green"/><StatCard label="Thời gian học" value={`${Math.floor((p?.studySeconds || 0) / 60)} phút`} icon={Clock} color="orange"/></div><div className="grid-2"><Card className="section-card"><h2>Thời gian học trong tuần</h2><ActivityChart week={data.week}/></Card><Card className="section-card"><h2>Điểm kỹ năng gần nhất</h2><SkillProgress scores={scores}/></Card></div><Card className="section-card"><h2>Dấu chân học tập · 90 ngày</h2><div className="learning-heatmap">{Array.from({ length: 91 }, (_, i) => {
        const d = new Date(Date.now() - (90 - i) * 86400000);
        const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(d);
        const g = data.goals.find(g => g.date === key);
        const intensity = g ? Math.min(4, Math.max(1, Math.ceil(g.seconds / 900))) : 0;
        return <span key={key} className={`heat-${intensity}`} title={`${key}: ${Math.floor((g?.seconds || 0) / 60)} phút · ${g?.xp || 0} XP`}/>;
    })}</div><p className="field-help mt-4">Màu đậm hơn biểu thị nhiều thời gian học hơn. Di chuột để xem chi tiết.</p></Card><Card className="section-card"><h2>Những bài kiểm tra gần đây</h2>{attempts.length ? attempts.slice(0, 8).map(a => <div className="list-row" key={a.id}><div><h3>{a.quizId === "placement" ? "Kiểm tra đầu vào" : a.quizId.startsWith("practice") ? "Luyện tập kỹ năng" : "Kiểm tra bài học"}</h3><p>{new Date(a.createdAt).toLocaleString("vi-VN")}</p></div><Badge className={a.score / a.total >= .6 ? "green" : "orange"}>{a.score} / {a.total}</Badge><span className="text-link">+{a.xp} XP</span></div>) : <p>Chưa có bài kiểm tra nào. Bắt đầu một bài để thấy tiến bộ của bạn.</p>}</Card></>;
}
type RankedUser = {
    id: string;
    name: string;
    level: string;
    xp: number;
    country: string;
};
export function Leaderboard({ userId }: {
    userId: string;
}) {
    const [period, setPeriod] = useState("weekly");
    const { data, loading, error, refresh } = useData<RankedUser[]>(`/leaderboard?period=${period}`);
    return <><PageHeading title="Cùng nhau tiến bộ mỗi ngày" description="Một chút động lực từ những người bạn đồng hành."><Badge><Trophy size={13}/> Bảng xếp hạng</Badge></PageHeading><div className="tabs-row">{[["daily", "Hôm nay"], ["weekly", "Tuần này"], ["monthly", "Tháng này"], ["all", "Mọi thời gian"]].map(([v, t]) => <button key={v} className={`tab-button ${period === v ? "active" : ""}`} onClick={() => setPeriod(v)}>{t}</button>)}</div>{loading ? <LoadingSkeleton /> : error ? <ErrorState message={error} retry={refresh}/> : data?.length ? <Card className="leaderboard-card">{data.map((u, i) => <div className={`leaderboard-row ${u.id === userId ? "current-user" : ""}`} key={u.id}><span className={`rank rank-${i + 1}`}>{i < 3 ? <Trophy size={23}/> : i + 1}</span><span className="avatar">{initials(u.name)}</span><div><h3>{u.name}{u.id === userId && <Badge>Bạn</Badge>}</h3><p>{u.level} · {u.country === "VN" ? "Việt Nam" : u.country}</p></div><strong>{formatNumber(u.xp)} <small>XP</small></strong></div>)}</Card> : <EmptyState title="Cùng tạo những bước tiến đầu tiên" description="Bảng xếp hạng hiển thị những học viên chọn công khai hồ sơ."/>}<p className="field-help mt-4">Bạn kiểm soát việc xuất hiện trên bảng xếp hạng tại <Link href="/settings" className="text-link">Cài đặt quyền riêng tư</Link>.</p></>;
}
