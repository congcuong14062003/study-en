import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";
import { db } from "../src/lib/db";
import { addPremiumMonths, vietQrUrl, type TransferOrder } from "../src/lib/billing";

async function main() {
  const local = ["localhost", "127.0.0.1", "[::1]"];
  const base = new URL(process.env.BILLING_TEST_BASE_URL || "http://localhost:3000");
  assert.ok(local.includes(new URL(process.env.DATABASE_URL || "").hostname));
  assert.ok(local.includes(base.hostname) && base.protocol === "http:");
  const secret = process.env.NEXTAUTH_SECRET;
  assert.ok(secret);
  assert.equal((await fetch(new URL("/api/billing/config", base))).status, 200);
  const suffix = randomUUID();
  const users: string[] = [], images = new Set<string>(), references: string[] = [];
  async function user(role: "USER" | "ADMIN") {
    const created = await db.user.create({ data: { email: `billing-test-${role}-${randomUUID()}@example.invalid`, role, name: "Temporary billing integration check" } });
    users.push(created.id);
    const token = await encode({ secret: secret!, maxAge: 600, token: { sub: created.id, id: created.id, role, sessionVersion: 0, deadline: Date.now() + 600000 } });
    return { id: created.id, cookie: `next-auth.session-token=${token}` };
  }
  try {
    const admin = await user("ADMIN"), learner = await user("USER"), outsider = await user("USER");
    async function request(path: string, cookie: string, method = "GET", body?: unknown, expected = 200) {
      const headers = new Headers({ Origin: base.origin });
      if (cookie) headers.set("Cookie", cookie);
      if (!(body instanceof FormData) && body !== undefined) headers.set("Content-Type", "application/json");
      const response = await fetch(new URL(`/api/billing/${path}`, base), {
        method, headers, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body), signal: AbortSignal.timeout(30000),
      });
      assert.equal(response.status, expected, `${method} ${path} should return ${expected}, got ${response.status}.`);
      if (response.headers.get("content-type")?.includes("application/json")) return response.json();
      return response;
    }
    await request("orders", "", "GET", undefined, 401);
    await request("admin", learner.cookie, "GET", undefined, 403);
    const settings = (await request("admin", admin.cookie)).settings;
    await request("admin/config", admin.cookie, "PATCH", { ...settings, enabled: true, bankCode: "" }, 400);
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0pUAAAAASUVORK5CYII=", "base64");
    function form() { const value = new FormData(); value.set("file", new File([png], "test.png", { type: "image/png" })); return value; }
    await request("admin/qr", learner.cookie, "POST", form(), 403);
    await request("admin/qr", admin.cookie, "POST", form(), 405);
    // Keep one legacy uploaded QR fixture to ensure old orders still work.
    const qr = await db.paymentImage.create({ data: { kind: "qr", contentType: "image/png", data: png } }); images.add(qr.id);
    await request(`images/${qr.id}`, "");
    async function order(owner: string, period = "monthly") {
      const providerId = `TEST${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
      references.push(providerId);
      const receiver = { bankCode: "970415", accountName: "TEST ONLY", accountNumber: "000000" };
      return db.payment.create({ data: { userId: owner, providerId, method: "bank_transfer", status: "awaiting_transfer", period, amount: 199000, bankName: "Integration fixture, not a real payment", ...receiver,
        ...(period === "yearly" ? { qrCodeUrl: vietQrUrl(receiver, { amount: 199000, reference: providerId }) } : { bankCode: null, qrImageId: qr.id }),
      } });
    }
    const first = await order(learner.id);
    assert.equal((await request("orders", learner.cookie, "POST", { period: "yearly", amount: 1 })).id, first.id);
    await request(`orders/${first.id}/report`, outsider.cookie, "POST", {}, 404);
    const invalid = new FormData(); invalid.set("file", new File(["<svg />"], "fake.png", { type: "image/png" }));
    await request(`orders/${first.id}/receipt`, learner.cookie, "POST", invalid, 400);
    const receipt = await request(`orders/${first.id}/receipt`, learner.cookie, "POST", form()); images.add(receipt.receiptId);
    await request(`images/${receipt.receiptId}`, "", "GET", undefined, 404);
    await request(`images/${receipt.receiptId}`, outsider.cookie, "GET", undefined, 404);
    await request(`images/${receipt.receiptId}`, learner.cookie);
    await request(`images/${receipt.receiptId}`, admin.cookie);
    await request(`orders/${first.id}/report`, learner.cookie, "POST", { transferNote: "Temporary test only" });
    await request(`orders/${first.id}/report`, learner.cookie, "POST", {}); // Idempotent report.
    assert.equal(await db.subscription.findUnique({ where: { userId: learner.id } }), null, "Reporting payment never unlocks Premium.");
    await request(`orders/${first.id}/receipt`, learner.cookie, "POST", form(), 409);
    await request(`orders/${first.id}/cancel`, learner.cookie, "POST", {}, 409);
    const approval = { decision: "approve", bankTransactionId: `BANK-${suffix}`, confirmedReceived: true, receivedAmount: first.amount };
    await request(`admin/review/${first.id}`, learner.cookie, "POST", approval, 403);
    await request(`admin/review/${first.id}`, admin.cookie, "POST", { ...approval, confirmedReceived: false }, 400);
    await request(`admin/review/${first.id}`, admin.cookie, "POST", { ...approval, receivedAmount: 1 }, 409);
    const paid: TransferOrder = await request(`admin/review/${first.id}`, admin.cookie, "POST", approval);
    assert.equal(paid.status, "paid");
    assert.ok(paid.premiumUntil);
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: learner.id } })).role, "PREMIUM");
    const repeat = await request(`admin/review/${first.id}`, admin.cookie, "POST", approval);
    assert.equal(repeat.premiumUntil, paid.premiumUntil);
    const own = await request("orders", learner.cookie);
    assert.equal(own.subscription.plan, "PREMIUM");
    assert.equal(own.orders[0].bankTransactionId, undefined, "Do not leak internal bank reconciliation references.");
    const renewal = await order(learner.id, "yearly");
    const renewalData = (await request("orders", learner.cookie)).orders.find((value: TransferOrder) => value.id === renewal.id);
    assert.ok(renewalData.qrCodeUrl);
    assert.equal(new URL(renewalData.qrCodeUrl).searchParams.get("addInfo"), renewal.providerId);
    assert.equal(new URL(renewalData.qrCodeUrl).searchParams.get("amount"), "199000");
    await request(`orders/${renewal.id}/report`, learner.cookie, "POST", {});
    await request(`admin/review/${renewal.id}`, admin.cookie, "POST", approval, 409);
    const renewalApproval = { ...approval, bankTransactionId: `${approval.bankTransactionId}-2` };
    const renewed = await Promise.all([request(`admin/review/${renewal.id}`, admin.cookie, "POST", renewalApproval), request(`admin/review/${renewal.id}`, admin.cookie, "POST", renewalApproval)]);
    assert.equal(renewed[0].premiumUntil, renewed[1].premiumUntil);
    assert.equal(renewed[0].premiumUntil, addPremiumMonths(new Date(paid.premiumUntil!), 12).toISOString());
    const rejected = await order(outsider.id);
    await request(`orders/${rejected.id}/report`, outsider.cookie, "POST", {});
    await request(`admin/review/${rejected.id}`, admin.cookie, "POST", { decision: "reject", reviewNote: "Không có giao dịch khớp trong kiểm thử." });
    assert.equal(await db.subscription.findUnique({ where: { userId: outsider.id } }), null);
    const cancelled = await order(outsider.id);
    await request(`orders/${cancelled.id}/cancel`, outsider.cookie, "POST", {});
    await request(`orders/${cancelled.id}/cancel`, outsider.cookie, "POST", {});
    await request(`orders/${cancelled.id}/report`, outsider.cookie, "POST", {}, 409);
    await request(`orders/${rejected.id}/report`, outsider.cookie, "POST", { transferNote: "Recheck fixture only" });
    await request(`admin/review/${rejected.id}`, admin.cookie, "POST", approval, 409);
    await request(`admin/review/${rejected.id}`, admin.cookie, "POST", { ...approval, bankTransactionId: `${approval.bankTransactionId}-3` });
    assert.equal((await db.subscription.findUniqueOrThrow({ where: { userId: outsider.id } })).plan, "PREMIUM");
    const catalog = await request("admin?q=TEST", admin.cookie);
    assert.ok(catalog.orders.some((o: TransferOrder) => o.id === first.id));
    console.log("Billing HTTP integration passed: private receipts, roles, image upload validation, payment report without activation, approved/denied/cancelled orders, duplicate-reference prevention, concurrent idempotent approvals, and calendar renewal.");
  } finally {
    // Remove only exact fixture users/images and notifications containing generated test references.
    if (references.length) await db.notification.deleteMany({ where: { OR: references.map((reference) => ({ body: { contains: reference } })) } });
    await db.rateLimit.deleteMany({ where: { key: { in: users.flatMap((id) => [`billing:${id}`, `billing-qr:${id}`, `billing-receipt:${id}`]) } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.paymentImage.deleteMany({ where: { id: { in: [...images] } } });
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Billing HTTP integration failed."); process.exitCode = 1; }).finally(() => db.$disconnect());
