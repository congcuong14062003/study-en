"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness, CheckCircle2, Clock, GraduationCap, Layers, Loader2, MessageCircle, Play, Star } from "lucide-react";
import { toast } from "sonner";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/dashboard/dashboard";
import { useData } from "@/hooks/use-data";
import { api } from "@/lib/utils";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui/states";
export type CourseRecord = {
    id: string;
    title: string;
    description: string;
    level: string;
    category: string;
    duration: string;
    rating: number;
    instructor: string;
    outcomes: string[];
    color: string;
    premium: boolean;
    thumbnail?: string | null;
    enrolled?: boolean;
    lessons: {
        id: string;
        title: string;
        description: string;
        order: number;
    }[];
    _count: {
        enrollments: number;
    };
};
export function CourseCard({ course }: {
    course: CourseRecord;
}) {
    const Icon = course.id === "business-b1" ? BriefcaseBusiness : course.id === "english-a2" ? MessageCircle : BookOpen;
    return <Link href={`/courses/${course.id}`} className="course-card card"><div className={`course-cover ${course.color}`}><Badge>{course.level} · {course.category.toUpperCase()}</Badge>{course.thumbnail ? <img className="course-thumbnail" src={course.thumbnail} alt={course.title} loading="lazy"/> : <Icon size={80} strokeWidth={1}/>}<span className="cover-type">{course.level === "A1" ? "Start somewhere." : course.level === "A2" ? "Say a little more." : "Make it happen."}</span></div><div className="course-card-body"><div className="course-meta"><span>{course.lessons.length} bài học · {course.duration}</span><span className="flex-row"><Star size={11}/> {course.rating}</span></div><h3>{course.title}</h3><p>{course.description.slice(0, 112)}…</p><span className="text-link">Khám phá khóa học <ArrowRight size={15}/></span></div></Link>;
}
export function Courses({ id, userId }: {
    id?: string;
    userId?: string;
}) {
    const { data, loading, error, refresh } = useData<CourseRecord[] | CourseRecord>(`/courses${id ? `/${id}` : ""}`);
    const [q, setQ] = useState(""), [level, setLevel] = useState("all"), [category, setCategory] = useState("all"), [busy, setBusy] = useState(false);
    const router = useRouter();
    if (loading)
        return <LoadingSkeleton />;
    if (error || !data)
        return <ErrorState message={error || "Không tìm thấy khóa học"} retry={refresh}/>;
    if (id && !Array.isArray(data)) {
        const c = data;
        async function enroll() {
            if (!userId) {
                router.push(`/login?callbackUrl=${encodeURIComponent(`/courses/${id}`)}`);
                return;
            }
            setBusy(true);
            try {
                await api(`/courses/${id}/enroll`, { method: "POST", body: "{}" });
                toast.success("Đã tham gia khóa học. Cùng bắt đầu nhé!");
                router.push(`/lessons/${c.lessons[0]?.id}`);
            }
            catch (e) {
                toast.error((e as Error).message);
            }
            finally {
                setBusy(false);
            }
        }
        return <><Link className="back-link" href="/courses"><ArrowLeft size={15}/> Tất cả khóa học</Link><div className="course-detail-layout"><div><Card className={`content-header course-detail-hero ${c.color}`}><Badge>{c.level} · {c.category}</Badge><h1>{c.title}</h1><p>{c.description}</p><div className="course-detail-meta"><span><Layers size={15}/>{c.lessons.length} bài học</span><span><Clock size={15}/>{c.duration}</span><span><Star size={15}/>{c.rating} · Nội dung mẫu</span></div></Card><Card className="section-card"><h2>Bạn sẽ làm được gì?</h2><ul className="list-clean">{c.outcomes.map(o => <li key={o}><CheckCircle2 size={17}/>{o}</li>)}</ul></Card><Card className="section-card"><h2>Nội dung khóa học</h2>{c.lessons.map(l => <div className="list-row" key={l.id}><div className="row-main"><span className="row-number">{String(l.order).padStart(2, "0")}</span><div><h3>{l.title}</h3><p>{l.description}</p></div></div>{c.enrolled ? <Button variant="ghost" asChild size="icon"><Link href={`/lessons/${l.id}`} aria-label={`Học ${l.title}`}><Play size={17}/></Link></Button> : <BookOpen size={16} className="muted"/>}</div>)}</Card></div><aside><Card className="section-card course-enroll-card"><span className="icon-box purple"><GraduationCap size={30}/></span><h2>{c.premium ? "Khóa học Premium" : "Miễn phí để bắt đầu"}</h2><p>Học theo nhịp của bạn, quay lại bất cứ lúc nào.</p><Button className="w-full mt-4" disabled={busy || !c.lessons.length} onClick={enroll}>{busy ? <Loader2 size={17} className="spin"/> : c.enrolled ? "Tiếp tục học" : "Tham gia khóa học"}<ArrowRight size={16}/></Button><hr className="divider"/><ul className="list-clean"><li><CheckCircle2 size={16}/>Trọn bộ bài học và luyện tập</li><li><CheckCircle2 size={16}/>Lưu tiến độ tự động</li><li><CheckCircle2 size={16}/>Ôn tập với flashcard</li></ul><hr className="divider"/><p>Biên soạn bởi</p><strong>{c.instructor}</strong></Card></aside></div></>;
    }
    const courses = Array.isArray(data) ? data : [];
    const visible = courses.filter(c => (level === "all" || c.level === level) && (category === "all" || c.category === category) && `${c.title} ${c.description}`.toLowerCase().includes(q.toLowerCase()));
    return <><PageHeading title="Bước tiếp theo của bạn" description="Khám phá những khóa học được xây dựng cho hành trình của riêng bạn."><Badge><BookOpen size={12}/> {courses.length} khóa học</Badge></PageHeading><div className="course-banner"><div><span className="eyebrow">SMALL STEPS. REAL PROGRESS.</span><h2>Mở cánh cửa mới<br />với tiếng Anh.</h2><p>Từ lời chào đầu tiên đến một cuộc họp tự tin.</p></div><GraduationCap size={95} strokeWidth={1}/></div><div className="toolbar"><input className="input" aria-label="Tìm khóa học" placeholder="Tìm khóa học bạn quan tâm…" value={q} onChange={e => setQ(e.target.value)}/><select aria-label="Lọc trình độ" value={level} onChange={e => setLevel(e.target.value)}><option value="all">Tất cả trình độ</option>{["A1", "A2", "B1", "B2", "C1", "C2"].map(l => <option key={l}>{l}</option>)}</select><select aria-label="Lọc danh mục khóa học" value={category} onChange={e => setCategory(e.target.value)}><option value="all">Tất cả chủ đề</option>{[...new Set(courses.map(c => c.category))].map(c => <option key={c}>{c}</option>)}</select></div>{visible.length ? <div className="course-grid">{visible.map(c => <CourseCard course={c} key={c.id}/>)}</div> : <EmptyState title="Chưa có khóa học phù hợp" description="Thử một từ khóa hoặc trình độ khác nhé."/>}</>;
}
