"use client";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
export function Progress({ value = 0, className, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
    return <ProgressPrimitive.Root className={cn("progress", className)} value={value} {...props}><ProgressPrimitive.Indicator className="progress-fill" style={{ transform: `translateX(-${100 - Math.max(0, Math.min(100, value || 0))}%)` }}/></ProgressPrimitive.Root>;
}
