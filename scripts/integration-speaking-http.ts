import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";
import { db } from "../src/lib/db";
import { speakingSamples } from "../prisma/speaking-samples";
async function main() {
  const base = new URL(process.env.SPEAKING_TEST_BASE_URL || "http://localhost:3101");
  const hosts = ["localhost", "127.0.0.1", "[::1]"];
  assert.ok(hosts.includes(base.hostname) && base.protocol === "http:");
  assert.ok(hosts.includes(new URL(process.env.DATABASE_URL || "").hostname), "Only local database allowed");
  const secret = process.env.NEXTAUTH_SECRET; assert.ok(secret);
  let userId: string | undefined;
  try {
    const user = await db.user.create({ data: { email: `speaking-http-${randomUUID()}@example.invalid`, name: "Temporary speaking test", profile: { create: { onboardingComplete: true, placementComplete: true } }, progress: { create: {} }, subscription: { create: {} } } });
    userId = user.id;
    const jwt = await encode({ secret, maxAge: 600, token: { sub: user.id, id: user.id, role: "USER", sessionVersion: 0, deadline: Date.now() + 600000 } });
    const cookie = `next-auth.session-token=${jwt}`;
    async function request(path: string, options: RequestInit = {}, expected = 200, auth = true) {
      const response = await fetch(new URL(`/api/${path}`, base), { ...options, headers: { ...(auth ? { Cookie: cookie } : {}), Origin: base.origin, ...options.headers }, signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, expected, `${path}: ${response.status}`);
      return response;
    }
    await request("speech/assessment", {}, 401, false);
    await request("speech/assessment", { method: "POST", headers: { Origin: "https://untrusted.invalid" } }, 403);
    const status = await (await request("speech/assessment")).json();
    assert.equal(typeof status.configured, "boolean");
    assert.equal(status.maxSeconds, 28); assert.equal(status.dailyLimit, 20);
    assert.deepEqual(Object.keys(status).sort(), ["configured", "dailyLimit", "maxSeconds"]);
    // Invalid body can never invoke the paid provider, even on a configured local installation.
    const response = await request("speech/assessment", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }, status.configured ? 415 : 503);
    assert.ok((await response.json()).error);
    for (const language of ["en", "zh"]) {
      await request("learning-language", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language }) });
      const rows = await (await request("speaking")).json();
      assert.ok(rows.every((row: { language: string }) => row.language === language));
      const expected = speakingSamples.filter((sample) => sample.language === language);
      for (const sample of expected) {
        const found = rows.find((row: { id: string }) => row.id === sample.id);
        assert.ok(found, `Missing ${sample.id}: run db:seed:speaking first`);
        assert.equal(found.translation, sample.translation); assert.equal(found.category, sample.category);
      }
      const meaning = await (await request("speaking/translation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: expected[0].text }) })).json();
      assert.equal(meaning.source, "saved"); assert.equal(meaning.translation, expected[0].translation);
    }
    assert.equal(await db.studySession.count({ where: { userId } }), 0);
    assert.equal(await db.aIConversation.count({ where: { userId } }), 0);
    console.log("Speaking HTTP passed: all 220 samples, categories/translations, language isolation, authenticated Azure status, foreign-origin rejection, disabled-provider handling; no paid AI calls.");
  } finally {
    if (userId) {
      await db.user.deleteMany({ where: { id: userId } });
      await db.rateLimit.deleteMany({ where: { key: { in: [`mutation:${userId}`, `speech:assessment:burst:${userId}`, `speech:assessment:day:${userId}`] } } });
    }
    await db.$disconnect();
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Speaking HTTP failed"); process.exitCode = 1; });
