import Link from "next/link";
import { BookOpen } from "lucide-react";
export function Brand() {
    return <Link href="/" className="brand" aria-label="EnglishMaster trang chủ"><span className="brand-icon"><BookOpen size={23} strokeWidth={2.3}/></span><span>English<span className="brand-accent">Master</span><small>YOUR EVERYDAY ENGLISH</small></span></Link>;
}
