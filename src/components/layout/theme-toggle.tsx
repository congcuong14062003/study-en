"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    return <Button variant="ghost" size="icon" aria-label="Đổi giao diện sáng tối" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}><Sun size={19} className="dark-only"/><Moon size={19} className="light-only"/></Button>;
}
