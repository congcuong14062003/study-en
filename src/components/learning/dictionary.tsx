"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Search } from "lucide-react";
import { useData } from "@/hooks/use-data";
import { Card, Badge } from "@/components/ui/card";
import { PageHeading } from "@/components/dashboard/dashboard";
import { LoadingSkeleton, ErrorState } from "@/components/ui/states";
import { AudioButton } from "./audio-player";
import { FavoriteButton } from "./favorite-button";
import type { Word } from "./vocabulary";
export function Dictionary() {
    const params = useSearchParams();
    const [q, setQ] = useState(params.get("q") || ""), [selected, setSelected] = useState<Word | null>(null), [history, setHistory] = useState<string[]>([]);
    const { data, loading, error, refresh } = useData<Word[]>("/vocabulary");
    useEffect(() => {
        try {
            setHistory(JSON.parse(localStorage.getItem("englishmaster-dictionary-history") || "[]"));
        }
        catch {
        }
    }, []);
    useEffect(() => {
        if (data && params.get("q")) {
            const found = data.find(w => w.word.toLowerCase() === params.get("q")?.toLowerCase());
            if (found)
                setSelected(found);
        }
    }, [data, params]);
    function select(w: Word) {
        setSelected(w);
        setQ(w.word);
        const next = [w.word, ...history.filter(h => h !== w.word)].slice(0, 8);
        setHistory(next);
        try {
            localStorage.setItem("englishmaster-dictionary-history", JSON.stringify(next));
        }
        catch {
        }
    }
    if (loading)
        return <LoadingSkeleton />;
    if (error || !data)
        return <ErrorState message={error || "Chưa tải được từ điển"} retry={refresh}/>;
    const results = data.filter(w => `${w.word} ${w.meaning}`.toLowerCase().includes(q.toLowerCase()));
    return <div className="content-narrow"><PageHeading title="Hiểu một từ. Dùng đúng cách." description="Từ điển Anh–Việt trong thư viện học tập của bạn."/><Card className="dictionary-search"><Search size={23}/><input className="input" value={q} onChange={e => {
            setQ(e.target.value);
            setSelected(null);
        }} placeholder="Tra từ tiếng Anh hoặc nghĩa tiếng Việt…" aria-label="Tra từ điển" autoComplete="off"/></Card>{!selected && <><div className="search-results">{results.slice(0, 8).map(w => <button className="dictionary-result" key={w.id} onClick={() => select(w)}><div><strong>{w.word}</strong><span>{w.ipa}</span></div><span>{w.meaning}</span></button>)}</div>{!results.length && <p className="notice">Từ này chưa có trong thư viện nội bộ. Hãy thử từ khác.</p>}{history.length > 0 && <div className="mt-4"><p className="mb-4">Tìm kiếm gần đây trên thiết bị này</p><div className="tabs-row">{history.map(h => <button className="tab-button" key={h} onClick={() => {
                        const w = data.find(w => w.word === h);
                        if (w)
                            select(w);
                    }}>{h}</button>)}</div></div>}</>}{selected && <Card className="dictionary-entry"><div className="flex-row justify-between"><Badge>{selected.level} · {selected.partOfSpeech}</Badge><FavoriteButton type="word" id={selected.id} title={selected.word} href={`/dictionary?q=${selected.word}`} label/></div><h1>{selected.word}</h1><p>{selected.ipa}</p><div className="flex-row mt-4"><AudioButton text={selected.word} lang="en-GB" label="British"/><AudioButton text={selected.word} lang="en-US" label="American"/></div><hr className="divider"/><h2>{selected.meaning}</h2><p className="mt-4">{selected.definition}</p><div className="word-example"><p>{selected.example}</p><span>{selected.translation}</span></div><div className="grid-2">{[["Từ đồng nghĩa", selected.synonyms], ["Từ trái nghĩa", selected.antonyms], ["Cụm từ thường gặp", selected.collocations], ["Họ từ", selected.wordFamily]].map(([label, words]) => <div key={String(label)}><h4>{label as string}</h4><p>{(words as string[]).join(" · ") || "Chưa có trong thư viện"}</p></div>)}</div></Card>}</div>;
}
