"use client";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Check, ChevronRight, Clock, Flame, Headphones, MessageCircle, MoreHorizontal, Play, Sparkles, Target, Trophy, Zap, AudioLines, GraduationCap } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useData } from "@/hooks/use-data";
import { LoadingSkeleton, ErrorState } from "@/components/ui/states";
import { formatNumber } from "@/lib/utils";
import type { DashboardData } from "@/services/dashboard";
export function PageHeading({ title, description, children }: {
    title: string;
    description?: string;
    children?: React.ReactNode;
}) {
    return <div className="page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{children}</div>;
}
export function StatCard({ label, value, icon: Icon, color = "purple", note }: {
    label: string;
    value: string;
    icon: typeof BookOpen;
    color?: string;
    note?: string;
}) {
    return <Card className="stat-card"><div className="stat-top"><span className={`icon-box ${color}`}><Icon /></span>{note && <span className="stat-trend">{note}</span>}</div><strong>{value}</strong><p>{label}</p></Card>;
}
export function ActivityChart({ week }: {
    week: DashboardData["week"];
}) {
    const max = Math.max(30, ...week.map(d => d.minutes));
    return <div className="activity-chart" aria-label="Thời gian học trong 7 ngày gần nhất">{week.map((d, i) => <div key={d.date} title={`${d.date}: ${d.minutes} phút`}><span className={`bar ${i === 6 ? "today" : ""}`} style={{ height: `${Math.max(3, d.minutes / max * 100)}px` }}/><small>{new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(new Date(`${d.date}T12:00:00`))}</small></div>)}</div>;
}
export function SkillProgress({ scores }: {
    scores: Record<string, number>;
}) {
    return <div className="skill-progress-list">{[["vocabulary", "Từ vựng"], ["grammar", "Ngữ pháp"], ["listening", "Nghe"], ["speaking", "Nói"], ["reading", "Đọc"], ["writing", "Viết"]].map(([key, label]) => <div className="skill-progress-row" key={key}><div><span>{label}</span><span>{scores[key] !== undefined ? `${scores[key]}%` : "Chưa đánh giá"}</span></div><Progress value={scores[key] || 0} aria-label={label}/></div>)}</div>;
}
export function Dashboard() {
    const { data, loading, error, refresh } = useData<DashboardData>("/dashboard");
    if (loading)
        return <LoadingSkeleton />;
    if (error || !data)
        return <ErrorState message={error || "Không tìm thấy dữ liệu"} retry={refresh}/>;
    const { user, today, week, lessonProgress, enrollments, due } = data;
    const p = user.progress;
    const name = user.name?.split(" ").at(-1) || "bạn";
    const current = lessonProgress.find(l => !l.completed);
    const fallback = enrollments[0]?.course.lessons.find(l => !lessonProgress.some(p => p.lessonId === l.id && p.completed));
    const course = current?.lesson.course || enrollments[0]?.course;
    const lesson = current?.lesson || fallback;
    const minutes = Math.floor((today?.seconds || 0) / 60), goal = user.profile?.dailyMinutes || 20, goalPercent = Math.min(100, Math.round(minutes / goal * 100));
    const scores = (p?.skillScores || {}) as Record<string, number>;
    const totalWeek = week.reduce((s, d) => s + d.minutes, 0);
    const goalCircumference = 2 * Math.PI * 55;
    return <><PageHeading title={`Chào buổi sáng, ${name} 👋`} description="Mỗi ngày một chút tiến bộ. Hôm nay mình học gì nhỉ?"><span className="date-label"><CalendarDays size={14}/>{new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</span></PageHeading><div className="dashboard-grid"><div className="main-column"><div className="stats-grid"><StatCard icon={Zap} color="purple" value={formatNumber(p?.xp || 0)} label="Tổng điểm kinh nghiệm" note="XP"/><StatCard icon={BookOpen} color="blue" value={formatNumber(p?.wordsLearned || 0)} label="Từ vựng đã học" note="Từng từ một"/><StatCard icon={GraduationCap} color="green" value={String(p?.lessonsCompleted || 0)} label="Bài học hoàn thành"/><StatCard icon={Clock} color="orange" value={`${Math.floor((p?.studySeconds || 0) / 3600)}h ${Math.floor((p?.studySeconds || 0) % 3600 / 60)}m`} label="Thời gian học tập"/></div><section><div className="section-label"><h2>Tiếp tục hành trình</h2><Link href="/courses" className="text-link">Khóa học của tôi <ChevronRight size={13}/></Link></div><Card className="continue-card"><div className="continue-copy"><Badge>{course?.level || "A1"} · {course?.title || "BẮT ĐẦU TỪ NỀN TẢNG"}</Badge><h2>{lesson?.title || "Một khởi đầu nhỏ.\nMột hành trình lớn."}</h2><p>{lesson ? `Bài ${lesson.order} · Cùng học, thực hành và tự tin hơn mỗi ngày.` : "Khám phá khóa học phù hợp và bắt đầu bài học đầu tiên."}</p><div className="continue-progress"><Progress value={(current?.step || 0) / 6 * 100}/><span>{Math.round((current?.step || 0) / 6 * 100)}% hoàn thành</span></div><Button asChild><Link href={lesson ? `/lessons/${lesson.id}` : "/courses"}><Play size={12} fill="currentColor"/>{lesson ? "Tiếp tục học" : "Khám phá khóa học"}<ArrowRight size={14}/></Link></Button></div><div className="continue-art" aria-hidden="true"><MessageCircle /><span className="hello-label">Hello!</span><span className="sound-label"><AudioLines size={35}/></span></div></Card></section><div className="two-column"><Card className="panel"><div className="panel-heading"><div><h2>Nhịp học của bạn</h2><p>Mỗi ngày đều có ý nghĩa</p></div><Link className="text-link" href="/analytics">7 ngày qua <ChevronRight size={11}/></Link></div><div className="chart-summary"><strong>{totalWeek}</strong><span>phút học tập</span></div><ActivityChart week={week}/></Card><Card className="panel"><div className="panel-heading"><h2>Tiến bộ kỹ năng</h2><Link href="/analytics" aria-label="Xem chi tiết tiến bộ" className="muted"><MoreHorizontal size={18}/></Link></div><SkillProgress scores={scores}/></Card></div><section><div className="section-label"><h2>Dành riêng cho bạn <Sparkles size={14} className="inline purple-text"/></h2><Link href="/study-plan" className="text-link">Xem lộ trình <ChevronRight size={13}/></Link></div><div className="recommended-grid">{[{ href: "/vocabulary", label: "Everyday\nwords", title: "Từ vựng cho cuộc sống mỗi ngày", type: "TỪ VỰNG", time: "10 phút", icon: BookOpen, color: "green" }, { href: "/grammar", label: "Make it\nclear.", title: "Xây nền ngữ pháp vững chắc", type: "NGỮ PHÁP", time: "15 phút", icon: GraduationCap, color: "purple" }, { href: "/listening", label: "Listen.\nConnect.", title: "Lắng nghe những câu chuyện mới", type: "LUYỆN NGHE", time: "8 phút", icon: Headphones, color: "orange" }].map(({ href, label, title, type, time, icon: Icon, color }) => <Link href={href} key={href} className="recommended-card card"><div className={`recommended-cover ${color}`}><span style={{ whiteSpace: "pre-line" }}>{label}</span><Icon /></div><div className="recommended-body"><Badge>{user.profile?.level || "A1"} · {type}</Badge><h3>{title}</h3><div><span>{time}</span><ArrowRight size={13}/></div></div></Link>)}</div></section><section><div className="section-label"><h2>Những cột mốc đáng nhớ</h2><Link href="/achievements" className="text-link">Tất cả thành tích <ChevronRight size={13}/></Link></div><Card className="panel achievement-row"><span className="achievement-medal"><Trophy size={23}/></span><div><h3>{data.achievements[0]?.achievement.title || "Bước chân đầu tiên đang chờ bạn"}</h3><p>{data.achievements[0]?.achievement.description || "Hoàn thành một bài học để nhận huy hiệu đầu tiên."}</p></div><Badge className="orange">{data.achievements.length ? "ĐÃ MỞ KHÓA" : "MỤC TIÊU TIẾP THEO"}</Badge></Card></section></div><aside className="right-column"><Card className="streak-panel"><div className="streak-title"><h2>Giữ lửa mỗi ngày</h2><Flame size={14} className="orange-text"/></div><div className="streak-fire"><Flame /></div><strong>{p?.streak || 0} <span>ngày liên tiếp</span></strong><p>Một thói quen nhỏ. Một thay đổi lớn.</p><div className="streak-week">{week.map(d => <div key={d.date}><span>{new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(new Date(`${d.date}T12:00:00`))}</span><i className={d.xp > 0 || d.minutes > 0 ? "done" : ""}>{d.xp > 0 || d.minutes > 0 ? <Check size={12}/> : "·"}</i></div>)}</div></Card><Card className="panel goal-panel"><div className="panel-heading"><h2>Mục tiêu hôm nay</h2><Link href="/settings" aria-label="Chỉnh mục tiêu học"><Target size={15} className="muted"/></Link></div><div className="goal-ring"><svg viewBox="0 0 137 137" role="img" aria-label={`${goalPercent}% mục tiêu hôm nay`}><circle cx="68.5" cy="68.5" r="55" fill="none" stroke="var(--line)" strokeWidth="9"/><circle cx="68.5" cy="68.5" r="55" fill="none" stroke="#9283dc" strokeWidth="9" strokeLinecap="round" strokeDasharray={goalCircumference} strokeDashoffset={goalCircumference * (1 - goalPercent / 100)}/></svg><div><strong>{minutes}<span> / {goal}</span></strong><span>phút hôm nay</span></div></div><p>{minutes >= goal ? "Bạn đã hoàn thành mục tiêu. Tuyệt lắm!" : `Chỉ còn ${goal - minutes} phút nữa. Bạn làm được mà!`}</p><div className="goal-footer"><span>Mục tiêu hằng ngày</span><strong>{goal} phút</strong></div></Card><Card className="panel challenge-panel"><div className="challenge-title"><span className="icon-box orange"><Zap size={19}/></span><div><h3>Thử thách hôm nay</h3><p>Ôn tập 10 từ vựng</p></div></div><div className="challenge-progress"><span>Cùng tiến thêm một bước</span><strong>{Math.min(10, data.reviewCount)} / 10</strong></div><Progress value={data.reviewCount / 10 * 100} className="orange"/><Badge className="orange"><Zap size={10}/> +5 XP mỗi từ</Badge></Card><Card className="panel review-panel"><span className="icon-box purple"><LayersIcon /></span><h3>Ôn một chút, nhớ lâu hơn</h3><p>{due ? `${due} từ vựng đang chờ bạn ôn lại. Củng cố kiến thức trước khi học điều mới nhé.` : "Học thêm từ mới để xây dựng bộ flashcard của riêng bạn."}</p><Button variant="secondary" asChild><Link href={due ? "/flashcards" : "/vocabulary"}>{due ? `Ôn tập ${due} từ vựng` : "Khám phá từ vựng"}<ArrowRight size={14}/></Link></Button></Card></aside></div></>;
}
function LayersIcon() {
    return <BookOpen size={22}/>;
}
