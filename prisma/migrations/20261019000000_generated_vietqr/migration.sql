-- Additive migration: existing order QR images remain available unchanged.
ALTER TABLE "BankTransferSettings" ADD COLUMN "bankCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Payment" ADD COLUMN "bankCode" TEXT, ADD COLUMN "qrCodeUrl" TEXT;
