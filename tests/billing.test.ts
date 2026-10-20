import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { billingSettingsSchema, defaultBillingSettings, paymentReviewSchema, addPremiumMonths, premiumExtension, paymentImageType, vietQrUrl } from "../src/lib/billing";
import { db } from "../src/lib/db";
import { createTransferOrder } from "../src/services/billing";

function stubTransaction(t: TestContext, tx: unknown) {
  // Prisma exposes proxy methods; Node's descriptor-based mock.method cannot replace them.
  const original = db.$transaction;
  db.$transaction = (async (fn: (client: unknown) => unknown) => fn(tx)) as typeof db.$transaction;
  t.after(() => { db.$transaction = original; });
}

test("checkout requires bank code and receiver details, but never an uploaded QR; prices are integer VND", () => {
  assert.ok(billingSettingsSchema.safeParse(defaultBillingSettings).success);
  assert.equal(billingSettingsSchema.safeParse({ ...defaultBillingSettings, enabled: true }).success, false);
  assert.equal(billingSettingsSchema.safeParse({ ...defaultBillingSettings, monthlyAmount: 1.5 }).success, false);
  assert.equal(billingSettingsSchema.safeParse({ ...defaultBillingSettings, yearlyAmount: -1 }).success, false);
  assert.ok(billingSettingsSchema.safeParse({ ...defaultBillingSettings, enabled: true, bankName: "Bank", bankCode: "970415", accountName: "Owner", accountNumber: "123456" }).success);
  assert.equal(billingSettingsSchema.safeParse({ ...defaultBillingSettings, enabled: true, bankName: "Bank", accountName: "Owner", accountNumber: "123456", qrImageId: "old-image" }).success, false);
});

test("VietQR uses fixed HTTPS origin and encodes account name, exact amount and transfer reference", () => {
  const receiver = { bankCode: " icb ", accountNumber: "1133 6666 8888", accountName: "CÔNG TY A & B" };
  const qr = new URL(vietQrUrl(receiver, { amount: 199000, reference: "EM123ABC" })!);
  assert.equal(qr.origin, "https://img.vietqr.io");
  assert.equal(qr.pathname, "/image/ICB-113366668888-compact.svg");
  assert.equal(qr.searchParams.get("accountName"), receiver.accountName);
  assert.equal(qr.searchParams.get("amount"), "199000");
  assert.equal(qr.searchParams.get("addInfo"), "EM123ABC");
  const preview = new URL(vietQrUrl(receiver)!);
  assert.equal(preview.searchParams.has("amount"), false);
  assert.equal(preview.searchParams.has("addInfo"), false);
});
test("VietQR refuses incomplete receivers, URL injection, invalid amounts and unsafe transfer references", () => {
  const receiver = { bankCode: "970415", accountNumber: "123456", accountName: "Owner" };
  assert.equal(vietQrUrl({ ...receiver, bankCode: "" }), null);
  assert.equal(vietQrUrl({ ...receiver, bankCode: "VCB/../../bad" }), null);
  assert.equal(vietQrUrl({ ...receiver, accountNumber: "123?extra=true" }), null);
  assert.equal(vietQrUrl({ ...receiver, accountNumber: "12345678901234567890" }), null);
  for (const amount of [-1, 0, 1.1, Infinity, 10000000000000]) assert.equal(vietQrUrl(receiver, { amount, reference: "EM123" }), null);
  assert.equal(vietQrUrl(receiver, { amount: 199000, reference: "EM&amount=1" }), null);
});
test("approving requires explicit confirmation and a bank reference; rejecting requires an explanation", () => {
  assert.equal(paymentReviewSchema.safeParse({ decision: "approve", bankTransactionId: "reference" }).success, false);
  assert.equal(paymentReviewSchema.safeParse({ decision: "reject", reviewNote: "" }).success, false);
  const decision = paymentReviewSchema.parse({ decision: "approve", bankTransactionId: " abc123 ", confirmedReceived: true, receivedAmount: 199000 });
  assert.ok(decision.decision === "approve");
  assert.equal(decision.bankTransactionId, "ABC123");
});
test("calendar month extensions clamp month ends and preserve time, including leap years", () => {
  assert.equal(addPremiumMonths(new Date("2026-01-31T09:15:00Z"), 1).toISOString(), "2026-02-28T09:15:00.000Z");
  assert.equal(addPremiumMonths(new Date("2024-02-29T09:15:00Z"), 12).toISOString(), "2025-02-28T09:15:00.000Z");
});
test("renewals extend a still-active term, restart expired terms, and never truncate lifetime Premium", () => {
  const now = new Date("2026-10-16T00:00:00Z");
  assert.equal(premiumExtension(null, "monthly", now)?.toISOString(), "2026-11-16T00:00:00.000Z");
  const sub = { plan: "PREMIUM", status: "active", currentPeriodEnd: new Date("2026-12-31T00:00:00Z") };
  assert.equal(premiumExtension(sub, "yearly", now)?.toISOString(), "2027-12-31T00:00:00.000Z");
  assert.equal(premiumExtension({ ...sub, currentPeriodEnd: new Date("2025-01-01Z") }, "monthly", now)?.toISOString(), "2026-11-16T00:00:00.000Z");
  assert.equal(premiumExtension({ ...sub, currentPeriodEnd: null }, "monthly", now), null);
});
test("uploaded images use byte signatures rather than trusting names or MIME types", () => {
  assert.equal(paymentImageType(new TextEncoder().encode('<svg onload="alert(1)"></svg>')), null);
  assert.equal(paymentImageType(new TextEncoder().encode("not an image")), null);
  assert.equal(paymentImageType(new Uint8Array([137,80,78,71,13,10,26,10])), "image/png");
  assert.equal(paymentImageType(new Uint8Array([255,216,255,0])), "image/jpeg");
});
test("order creation resumes the existing pending order even if prices or selected period changed", async (t) => {
  const order = { id: "existing", amount: 199000, period: "monthly", status: "pending_review" };
  const tx = { $queryRaw: async () => [], payment: { findFirst: async () => order } };
  stubTransaction(t, tx);
  assert.equal(await createTransferOrder("learner", "yearly"), order);
});
test("new orders snapshot receiver, QR and server-owned prices; disabled checkout creates nothing", async (t) => {
  let enabled = true;
  let saved: Record<string, unknown> = {};
  const tx = {
    $queryRaw: async () => [],
    payment: { findFirst: async () => null, create: async ({ data }: { data: Record<string, unknown> }) => { saved = data; return data; } },
    bankTransferSettings: { findUnique: async () => ({ ...defaultBillingSettings, enabled, bankCode: "970415", bankName: "Receiver bank", accountNumber: "123456", accountName: "Owner" }) },
    subscription: { findUnique: async () => null },
  };
  stubTransaction(t, tx);
  await createTransferOrder("learner", "yearly");
  assert.equal(saved.amount, 1788000);
  assert.equal(saved.qrImageId, undefined);
  assert.equal(saved.bankCode, "970415");
  const qr = new URL(saved.qrCodeUrl as string);
  assert.equal(qr.searchParams.get("amount"), "1788000");
  assert.equal(qr.searchParams.get("addInfo"), saved.providerId);
  assert.equal(qr.pathname, "/image/970415-123456-compact.svg");
  assert.equal(saved.bankName, "Receiver bank");
  assert.match(saved.providerId as string, /^EM[A-F0-9]{12}$/);
  enabled = false;
  await assert.rejects(() => createTransferOrder("learner", "monthly"), /chưa được mở/);
});
