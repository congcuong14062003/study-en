import assert from "node:assert/strict";
import test from "node:test";
import { ApiError, checkOrigin } from "../src/lib/security";

test("checkOrigin accepts the public Vercel host that received the request", () => {
    const previous = process.env.NEXTAUTH_URL;
    process.env.NEXTAUTH_URL = "https://study-en-build-id.vercel.app";
    try {
        const request = new Request("https://study-en-build-id.vercel.app/api/auth/register", {
            method: "POST",
            headers: {
                host: "study-en-azure.vercel.app",
                origin: "https://study-en-azure.vercel.app",
                "x-forwarded-proto": "https",
            },
        });
        assert.doesNotThrow(() => checkOrigin(request));
    }
    finally {
        if (previous === undefined)
            delete process.env.NEXTAUTH_URL;
        else
            process.env.NEXTAUTH_URL = previous;
    }
});

test("checkOrigin rejects a foreign origin", () => {
    const request = new Request("https://study-en-build-id.vercel.app/api/auth/register", {
        method: "POST",
        headers: {
            host: "study-en-azure.vercel.app",
            origin: "https://attacker.example",
            "x-forwarded-proto": "https",
        },
    });
    assert.throws(() => checkOrigin(request), (error: unknown) => {
        return error instanceof ApiError && error.status === 403;
    });
});
