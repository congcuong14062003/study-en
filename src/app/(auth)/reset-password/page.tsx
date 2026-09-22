import { Suspense } from "react";
import { AuthForm } from "@/components/account/auth-form";
export default function Page() {
    return <Suspense><AuthForm mode="reset-password"/></Suspense>;
}
