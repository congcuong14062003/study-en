import { cn } from "@/lib/utils";
export function Card({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("card", className)} {...props}/>;
}
export function Badge({ className, ...props }: React.ComponentProps<"span">) {
    return <span className={cn("badge", className)} {...props}/>;
}
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("skeleton", className)} {...props}/>;
}
