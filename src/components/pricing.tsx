"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";
import { Navbar } from "./layout/navbar";
import { Footer } from "./layout/footer";
import { Card, Badge } from "./ui/card";
import { Button } from "./ui/button";
import { formatNumber } from "@/lib/utils";
import { useData } from "@/hooks/use-data";
import type { BillingSettings } from "@/lib/billing";
export function Pricing() {
  const [yearly, setYearly] = useState(false);
  const { data: config } = useData<BillingSettings>("/billing/config");
  return (
    <>
      <Navbar />
      <main className="container pricing-page" id="main-content">
        <div className="section-heading centered">
          <span className="eyebrow">ĐẦU TƯ NHỎ, CƠ HỘI LỚN</span>
          <h1>Chọn nhịp học phù hợp với bạn.</h1>
          <p>Bắt đầu miễn phí. Nâng cấp khi bạn muốn đi xa hơn.</p>
          <div className="pricing-switch">
            <button
              className={!yearly ? "active" : ""}
              onClick={() => setYearly(false)}
            >
              Hằng tháng
            </button>
            <button
              className={yearly ? "active" : ""}
              onClick={() => setYearly(true)}
            >
              Hằng năm
            </button>
          </div>
        </div>
        <div className="pricing-grid">
          <Card className="pricing-card">
            <span className="icon-box">
              <Sparkles />
            </span>
            <h2>Free</h2>
            <p>Một khởi đầu vững chắc.</p>
            <div className="price">
              0₫ <span>/ mãi mãi</span>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/register">
                Bắt đầu miễn phí <ArrowRight size={16} />
              </Link>
            </Button>
            <ul className="list-clean">
              {[
                "Khóa học tiếng Anh cơ bản",
                "Thư viện từ vựng và ngữ pháp",
                "Flashcard & ôn tập ngắt quãng",
                "Luyện nghe, nói, đọc và viết",
                "Lưu tiến độ, ghi chú và thành tích",
              ].map((t) => (
                <li key={t}>
                  <Check size={16} />
                  {t}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="pricing-card premium">
            <Badge className="premium-ribbon">CHO HÀNH TRÌNH XA HƠN</Badge>
            <span className="icon-box purple">
              <Crown />
            </span>
            <h2>Premium</h2>
            <p>Thêm phản hồi, thêm tự tin.</p>
            <div className="price">
              {config ? `${formatNumber(yearly ? config.yearlyAmount : config.monthlyAmount)}₫` : "Đang cập nhật"}
              <span>/ {yearly ? "12 tháng" : "tháng"}</span>
            </div>
            <p className="price-note">
              Chuyển khoản ngân hàng · Không tự động gia hạn
            </p>
            <Button className="w-full" asChild>
              <Link href="/billing">{config?.enabled ? "Đăng ký Premium" : "Xem gói & thanh toán"}<ArrowRight size={16} /></Link>
            </Button>
            <ul className="list-clean">
              {[
                "Tất cả nội dung của gói Free",
                "Hội thoại cùng AI Tutor",
                "Nhận phản hồi chi tiết cho bài viết",
                "Khóa học và nội dung nâng cao",
                "Phân tích học tập chuyên sâu",
              ].map((t) => (
                <li key={t}>
                  <Check size={16} />
                  {t}
                </li>
              ))}
            </ul>
            <p className="field-help">
              Cần đăng nhập để tạo đơn. Quét QR, chuyển đúng số tiền và mã đơn;
              Premium mở sau khi admin đối soát tiền thực nhận.
            </p>
          </Card>
        </div>
        <div className="pricing-note">
          <Check size={17} />
          <span>Giữ trọn tiến độ của bạn dù ở bất kỳ gói nào.</span>
        </div>
      </main>
      <Footer />
    </>
  );
}
