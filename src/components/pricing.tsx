"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "./layout/navbar";
import { Footer } from "./layout/footer";
import { Card, Badge } from "./ui/card";
import { Button } from "./ui/button";
import { api } from "@/lib/utils";
export function Pricing() {
    const [yearly, setYearly] = useState(false), [busy, setBusy] = useState(false);
    async function interest() {
        setBusy(true);
        try {
            await api("/subscription/interest", { method: "POST", body: JSON.stringify({ period: yearly ? "yearly" : "monthly" }) });
            toast.success("Đã lưu sự quan tâm của bạn. Bạn có thể tiếp tục học với gói Free.");
        }
        catch (e) {
            toast.error((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return <><Navbar /><main className="container pricing-page" id="main-content"><div className="section-heading centered"><span className="eyebrow">ĐẦU TƯ NHỎ, CƠ HỘI LỚN</span><h1>Chọn nhịp học phù hợp với bạn.</h1><p>Bắt đầu miễn phí. Nâng cấp khi bạn muốn đi xa hơn.</p><div className="pricing-switch"><button className={!yearly ? "active" : ""} onClick={() => setYearly(false)}>Hằng tháng</button><button className={yearly ? "active" : ""} onClick={() => setYearly(true)}>Hằng năm <Badge>Tiết kiệm 25%</Badge></button></div></div><div className="pricing-grid"><Card className="pricing-card"><span className="icon-box"><Sparkles /></span><h2>Free</h2><p>Một khởi đầu vững chắc.</p><div className="price">0₫ <span>/ mãi mãi</span></div><Button variant="outline" className="w-full" asChild><Link href="/register">Bắt đầu miễn phí <ArrowRight size={16}/></Link></Button><ul className="list-clean">{["Khóa học tiếng Anh cơ bản", "Thư viện từ vựng và ngữ pháp", "Flashcard & ôn tập ngắt quãng", "Luyện nghe, nói, đọc và viết", "Lưu tiến độ, ghi chú và thành tích"].map(t => <li key={t}><Check size={16}/>{t}</li>)}</ul></Card><Card className="pricing-card premium"><Badge className="premium-ribbon">CHO HÀNH TRÌNH XA HƠN</Badge><span className="icon-box purple"><Crown /></span><h2>Premium</h2><p>Thêm phản hồi, thêm tự tin.</p><div className="price">{yearly ? "149.000₫" : "199.000₫"}<span>/ tháng</span></div><p className="price-note">{yearly ? "1.788.000₫ / năm" : "Thanh toán theo tháng"} · Mức giá dự kiến</p><Button className="w-full" disabled={busy} onClick={interest}>{busy ? "Đang lưu…" : "Đăng ký quan tâm"}<ArrowRight size={16}/></Button><ul className="list-clean">{["Tất cả nội dung của gói Free", "Hội thoại cùng AI Tutor", "Nhận phản hồi chi tiết cho bài viết", "Khóa học và nội dung nâng cao", "Phân tích học tập chuyên sâu"].map(t => <li key={t}><Check size={16}/>{t}</li>)}</ul><p className="field-help">Premium chưa mở thanh toán. Không thu phí khi đăng ký quan tâm. Cần đăng nhập để lưu lựa chọn.</p></Card></div><div className="pricing-note"><Check size={17}/><span>Giữ trọn tiến độ của bạn dù ở bất kỳ gói nào.</span></div></main><Footer /></>;
}
