"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/lib/pagination";

type PageToken = number | "start-gap" | "end-gap";

function pageTokens(page: number, totalPages: number): PageToken[] {
    if (totalPages <= 7)
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    const pages = [...new Set([1, 2, page - 1, page, page + 1, totalPages - 1, totalPages])]
        .filter(value => value >= 1 && value <= totalPages)
        .sort((a, b) => a - b);
    const tokens: PageToken[] = [];
    pages.forEach((value, index) => {
        const previous = pages[index - 1];
        if (previous && value - previous > 1)
            tokens.push(previous === 1 ? "start-gap" : "end-gap");
        tokens.push(value);
    });
    return tokens;
}

export function Pagination({
    meta,
    onPageChange,
    onPageSizeChange,
    pageSizes = [12, 24, 48],
}: {
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    pageSizes?: number[];
}) {
    const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
    const sizePickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!sizeMenuOpen)
            return;
        function close(event: PointerEvent) {
            if (!sizePickerRef.current?.contains(event.target as Node))
                setSizeMenuOpen(false);
        }
        function closeWithEscape(event: KeyboardEvent) {
            if (event.key === "Escape")
                setSizeMenuOpen(false);
        }
        document.addEventListener("pointerdown", close);
        document.addEventListener("keydown", closeWithEscape);
        return () => {
            document.removeEventListener("pointerdown", close);
            document.removeEventListener("keydown", closeWithEscape);
        };
    }, [sizeMenuOpen]);

    if (!meta.total)
        return null;

    function changePage(page: number) {
        if (page === meta.page || page < 1 || page > meta.totalPages)
            return;
        onPageChange(page);
        document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return <nav className="pagination" aria-label="Phân trang">
        <p className="pagination-summary">Hiển thị <strong>{meta.from}–{meta.to}</strong> trong tổng số <strong>{meta.total}</strong> kết quả</p>
        <div className="pagination-size">
            <span>Hiển thị</span>
            <div className="pagination-size-picker" ref={sizePickerRef}>
                <button type="button" className="pagination-size-trigger" aria-label="Số kết quả mỗi trang" aria-haspopup="listbox" aria-expanded={sizeMenuOpen} onClick={() => setSizeMenuOpen(open => !open)}>
                    <span>{meta.pageSize}</span><ChevronDown size={14}/>
                </button>
                {sizeMenuOpen && <div className="pagination-size-menu" role="listbox" aria-label="Chọn số kết quả mỗi trang">
                    {pageSizes.map(size => <button type="button" role="option" aria-selected={size === meta.pageSize} className={size === meta.pageSize ? "active" : ""} key={size} onClick={() => {
                        onPageSizeChange(size);
                        setSizeMenuOpen(false);
                    }}><span>{size}</span>{size === meta.pageSize && <Check size={14}/>}</button>)}
                </div>}
            </div>
            <span>kết quả</span>
        </div>
        <div className="pagination-pages">
            <button type="button" onClick={() => changePage(meta.page - 1)} disabled={meta.page <= 1} aria-label="Trang trước"><ChevronLeft size={16}/></button>
            {pageTokens(meta.page, meta.totalPages).map(token => typeof token === "number"
                ? <button type="button" key={token} className={token === meta.page ? "active" : ""} aria-current={token === meta.page ? "page" : undefined} onClick={() => changePage(token)}>{token}</button>
                : <span className="pagination-gap" key={token}>…</span>)}
            <button type="button" onClick={() => changePage(meta.page + 1)} disabled={meta.page >= meta.totalPages} aria-label="Trang sau"><ChevronRight size={16}/></button>
        </div>
    </nav>;
}
