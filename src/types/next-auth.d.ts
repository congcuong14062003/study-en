import "next-auth";
import "next-auth/jwt";
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role: string;
            sessionVersion: number;
        };
    }
    interface User {
        role?: string;
        sessionVersion?: number;
        remember?: boolean;
    }
}
declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        sessionVersion: number;
        deadline?: number;
    }
}
