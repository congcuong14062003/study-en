"use client";
import Link from "next/link";
import { BookOpen, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "./button";
import { Card, Skeleton } from "./card";
export function LoadingSkeleton() {
    return <div aria-label="Đang tải nội dung" role="status"><Skeleton className="mb-4" style={{ width: 220, height: 30 }}/><div className="loading-grid">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} style={{ height: 210 }}/>)}</div></div>;
}
export function EmptyState({ title = "Chưa có nội dung", description = "Bắt đầu khám phá và tạo nên hành trình của bạn.", href = "/courses", action = "Khám phá khóa học" }: {
    title?: string;
    description?: string;
    href?: string;
    action?: string;
}) {
    return <Card className="empty-state"><span className="icon-box"><BookOpen /></span><h2>{title}</h2><p>{description}</p><Button asChild><Link href={href}>{action}</Link></Button></Card>;
}
export function ErrorState({ message, retry }: {
    message: string;
    retry?: () => void;
}) {
    return <Card className="empty-state"><span className="icon-box orange"><AlertCircle /></span><h2>Chưa thể tải nội dung</h2><p>{message}</p>{retry ? <Button onClick={retry}><RefreshCw size={16}/> Thử lại</Button> : <Button asChild><Link href="/login">Đăng nhập</Link></Button>}</Card>;
}
