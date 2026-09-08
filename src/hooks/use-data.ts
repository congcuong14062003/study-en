"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/utils";
export function useData<T>(path: string | null) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(Boolean(path));
    const [error, setError] = useState<string | null>(null);
    const [version, setVersion] = useState(0);
    const refresh = useCallback(() => setVersion(v => v + 1), []);
    useEffect(() => {
        if (!path)
            return;
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        api<T>(path, { signal: controller.signal }).then(setData).catch(e => {
            if (!controller.signal.aborted)
                setError(e.message);
        }).finally(() => {
            if (!controller.signal.aborted)
                setLoading(false);
        });
        return () => controller.abort();
    }, [path, version]);
    return { data, setData, loading, error, refresh };
}
