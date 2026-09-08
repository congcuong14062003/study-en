import Link from "next/link";
import { ArrowRight, BookOpen, Lightbulb, Target } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { blogPosts } from "@/lib/blog";
export const metadata = { title: "Góc học tập" };
export default function Page() {
    return <><Navbar /><main className="container landing-section" id="main-content"><div className="section-heading centered"><span className="eyebrow">A LITTLE INSPIRATION</span><h1>Góc nhỏ cho những bước tiến lớn.</h1><p>Những ý tưởng thực tế để học tiếng Anh đều đặn và hiệu quả hơn.</p></div><div className="course-grid">{blogPosts.map((p, i) => {
        const Icon = [BookOpen, Lightbulb, Target][i];
        return <Link href={`/blog/${p.id}`} key={p.id} className="course-card card"><div className={`course-cover ${["blue", "purple", "orange"][i]}`}><span className="badge">CÁCH HỌC</span><Icon size={85} strokeWidth={1}/><span className="cover-type">{p.cover}</span></div><div className="course-card-body"><span className="field-help">{p.minutes} phút đọc · EnglishMaster</span><h3>{p.title}</h3><p>{p.description}</p><span className="text-link">Đọc bài viết <ArrowRight size={15}/></span></div></Link>;
    })}</div></main><Footer /></>;
}
