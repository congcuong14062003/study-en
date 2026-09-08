import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { passwordSchema } from "../src/lib/validation";
const db = new PrismaClient();
async function main() {
    const email = z.email().parse(process.env.ADMIN_EMAIL);
    const password = passwordSchema.parse(process.env.ADMIN_PASSWORD);
    const name = process.env.ADMIN_NAME || "EnglishMaster Admin";
    const passwordHash = await hash(password, 12);
    await db.user.upsert({ where: { email }, create: { email, name, passwordHash, role: "ADMIN", profile: { create: { onboardingComplete: true, placementComplete: true } }, progress: { create: {} }, subscription: { create: {} } }, update: { role: "ADMIN", passwordHash, sessionVersion: { increment: 1 } } });
    console.log("Administrator created or updated. Existing sessions revoked.");
}
main().catch(e => {
    console.error(e instanceof Error ? e.message : "Cannot create administrator");
    process.exitCode = 1;
}).finally(() => db.$disconnect());
