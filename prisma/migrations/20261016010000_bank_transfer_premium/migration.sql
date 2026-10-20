CREATE TABLE "PaymentImage" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentImage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BankTransferSettings" (
  "id" TEXT NOT NULL DEFAULT 'bank-transfer',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "bankName" TEXT NOT NULL DEFAULT '',
  "accountName" TEXT NOT NULL DEFAULT '',
  "accountNumber" TEXT NOT NULL DEFAULT '',
  "instructions" TEXT NOT NULL DEFAULT '',
  "monthlyAmount" INTEGER NOT NULL DEFAULT 199000,
  "yearlyAmount" INTEGER NOT NULL DEFAULT 1788000,
  "qrImageId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "BankTransferSettings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BankTransferSettings_qrImageId_fkey" FOREIGN KEY ("qrImageId") REFERENCES "PaymentImage"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
ALTER TABLE "Payment"
  ADD COLUMN "method" TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN "period" TEXT,
  ADD COLUMN "bankName" TEXT,
  ADD COLUMN "accountName" TEXT,
  ADD COLUMN "accountNumber" TEXT,
  ADD COLUMN "instructions" TEXT,
  ADD COLUMN "qrImageId" TEXT,
  ADD COLUMN "receiptId" TEXT,
  ADD COLUMN "transferNote" TEXT,
  ADD COLUMN "reportedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedBy" TEXT,
  ADD COLUMN "reviewNote" TEXT,
  ADD COLUMN "bankTransactionId" TEXT,
  ADD COLUMN "premiumUntil" TIMESTAMP(3),
  ADD CONSTRAINT "Payment_qrImageId_fkey" FOREIGN KEY ("qrImageId") REFERENCES "PaymentImage"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Payment_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "PaymentImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Payment_receiptId_key" ON "Payment"("receiptId");
CREATE UNIQUE INDEX "Payment_bankTransactionId_key" ON "Payment"("bankTransactionId");
CREATE INDEX "Payment_method_status_createdAt_idx" ON "Payment"("method", "status", "createdAt");
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");
-- Serialised user mutations plus this index prevent accidental duplicate checkout.
CREATE UNIQUE INDEX "Payment_one_open_transfer_per_user" ON "Payment"("userId")
  WHERE "method" = 'bank_transfer' AND "status" IN ('awaiting_transfer', 'pending_review');
