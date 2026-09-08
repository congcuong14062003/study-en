"use client";
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { ArrowRight, BookOpen, Check, Clock, Flame, Loader2, LogOut, Monitor, Moon, Settings, Sun, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { api, initials, formatNumber } from "@/lib/utils";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading, StatCard } from "@/components/dashboard/dashboard";
import { LoadingSkeleton, ErrorState } from "@/components/ui/states";
import type { DashboardData } from "@/services/dashboard";
export function ProfileSettings({ settings = false }: {
    settings?: boolean;
}) {
    const { data, loading, error, refresh } = useData<DashboardData>("/dashboard");
    const [busy, setBusy] = useState(false);
    const { theme, setTheme } = useTheme();
    async function save(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        try {
            await api("/profile", { method: "PATCH", body: JSON.stringify({ name: f.get("name"), bio: f.get("bio"), dailyMinutes: Number(f.get("dailyMinutes")), reminderTime: f.get("reminderTime"), notificationsEnabled: f.get("notificationsEnabled") === "on", publicLeaderboard: f.get("publicLeaderboard") === "on", language: "vi" }) });
            toast.success("Đã lưu thay đổi");
            refresh();
        }
        catch (e) {
            toast.error((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    if (loading)
        return <LoadingSkeleton />;
    if (error || !data)
        return <ErrorState message={error || "Không có hồ sơ"} retry={refresh}/>;
    const u = data.user, p = u.progress;
    if (!settings)
        return <><PageHeading title="Một hành trình rất riêng" description="Đây là bạn và những tiến bộ tích lũy mỗi ngày."><Button asChild variant="outline"><Link href="/settings"><Settings size={16}/> Chỉnh sửa hồ sơ</Link></Button></PageHeading><Card className="profile-hero"><div className="profile-avatar">{initials(u.name)}</div><div><Badge>{u.profile?.level || "A1"} · {u.subscription?.plan || "FREE"}</Badge><h1>{u.name}</h1><p>{u.profile?.bio || "Mỗi ngày một chút tiếng Anh, tự tin thêm một bước."}</p><span className="field-help">Việt Nam · Mục tiêu {u.profile?.goal}</span></div></Card><div className="stats-grid"><StatCard label="Tổng kinh nghiệm" value={`${formatNumber(p?.xp || 0)} XP`} icon={Zap}/><StatCard label="Chuỗi học" value={`${p?.streak || 0} ngày`} icon={Flame} color="orange"/><StatCard label="Từ đã học" value={String(p?.wordsLearned || 0)} icon={BookOpen} color="blue"/><StatCard label="Phút học" value={String(Math.floor((p?.studySeconds || 0) / 60))} icon={Clock} color="green"/></div><Card className="section-card mt-4"><h2>Khóa học đang tham gia</h2>{data.enrollments.length ? data.enrollments.map(e => <Link href={`/courses/${e.courseId}`} key={e.id} className="list-row"><div className="row-main"><span className="icon-box"><BookOpen size={22}/></span><div><h3>{e.course.title}</h3><p>{e.course.level} · {e.course.lessons.length} bài học</p></div></div><ArrowRight size={18}/></Link>) : <p>Bạn chưa tham gia khóa học nào. <Link href="/courses" className="text-link">Khám phá ngay</Link></p>}</Card><div className="profile-links">{[["/achievements", "Thành tích"], ["/calendar", "Lịch học"], ["/favorites", "Nội dung đã lưu"], ["/notes", "Ghi chú"], ["/dictionary", "Từ điển"], ["/study-plan", "Lộ trình học"], ["/notifications", "Thông báo"], ["/listening", "Luyện nghe"], ["/speaking", "Luyện nói"], ["/reading", "Luyện đọc"], ["/writing", "Luyện viết"], ["/grammar", "Ngữ pháp"]].map(([href, label]) => <Link key={href} href={href} className="card">{label}<ArrowRight size={15}/></Link>)}</div><Button variant="outline" className="mt-4" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={16}/> Đăng xuất</Button></>;
    return <div className="content-narrow"><PageHeading title="Thiết lập theo cách của bạn" description="Một không gian học vừa vặn với thói quen và mục tiêu của bạn."/><form onSubmit={save}><Card className="section-card"><h2>Hồ sơ cá nhân</h2><div className="form-row"><div className="field"><label htmlFor="profile-name">Họ và tên</label><input className="input" id="profile-name" name="name" defaultValue={u.name || ""} minLength={2} maxLength={80} required/></div><div className="field"><label htmlFor="profile-email">Email</label><input className="input" id="profile-email" value={u.email} readOnly/><span className="field-help">Email dùng để đăng nhập tài khoản.</span></div></div><div className="field"><label htmlFor="profile-bio">Đôi điều về bạn</label><textarea id="profile-bio" name="bio" defaultValue={u.profile?.bio || ""} maxLength={500} placeholder="Bạn đang học tiếng Anh vì điều gì?"/></div></Card><Card className="section-card"><h2>Giao diện</h2><div className="theme-options">{[{ value: "light", label: "Sáng", icon: Sun }, { value: "dark", label: "Tối", icon: Moon }, { value: "system", label: "Theo hệ thống", icon: Monitor }].map(({ value, label, icon: Icon }) => <button type="button" key={value} className={`choice ${theme === value ? "active" : ""}`} onClick={() => setTheme(value)}><Icon size={21}/>{label}{theme === value && <Check size={17}/>}</button>)}</div><p className="field-help mt-4">Giao diện hiện tại: Tiếng Việt. Nội dung học bằng tiếng Anh có giải thích tiếng Việt.</p></Card><Card className="section-card"><h2>Thói quen học tập</h2><div className="form-row"><div className="field"><label htmlFor="daily-goal">Mục tiêu mỗi ngày</label><select name="dailyMinutes" id="daily-goal" defaultValue={u.profile?.dailyMinutes || 20}>{[10, 20, 30, 45, 60].map(v => <option key={v} value={v}>{v} phút</option>)}</select></div><div className="field"><label htmlFor="reminder-time">Giờ học mong muốn</label><input className="input" type="time" id="reminder-time" name="reminderTime" defaultValue={u.profile?.reminderTime || "20:00"}/><span className="field-help">Nhắc học trong ứng dụng khi bạn mở dashboard sau giờ đã chọn.</span></div></div><label className="checkbox-label"><input type="checkbox" name="notificationsEnabled" defaultChecked={u.profile?.notificationsEnabled}/>Nhận thông báo trong ứng dụng</label></Card><Card className="section-card"><h2>Quyền riêng tư</h2><label className="checkbox-label"><input type="checkbox" name="publicLeaderboard" defaultChecked={u.profile?.publicLeaderboard}/>Hiển thị tên, trình độ và XP trên bảng xếp hạng</label><p className="field-help mt-4">Email, ghi chú và nội dung hội thoại luôn thuộc tài khoản của bạn.</p></Card><div className="form-actions"><Button type="submit" disabled={busy}>{busy ? <Loader2 size={16} className="spin"/> : <Check size={16}/>}Lưu thay đổi</Button></div></form></div>;
}
