-- AlterTable
ALTER TABLE "disaster_reports" ADD COLUMN     "is_sos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "resolved_by" TEXT,
ADD COLUMN     "user_id" TEXT,
ALTER COLUMN "responder_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "donor_user_id" TEXT,
    "donor_name" TEXT,
    "donor_email" TEXT,
    "recipient_type" TEXT NOT NULL,
    "recipient_id" TEXT,
    "recipient_name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "payment_method" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "receipt_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "donation_id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "gateway_tx_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "payment_details" JSONB,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donations_transaction_id_key" ON "donations"("transaction_id");

-- CreateIndex
CREATE INDEX "donations_donor_user_id_idx" ON "donations"("donor_user_id");

-- CreateIndex
CREATE INDEX "donations_recipient_id_idx" ON "donations"("recipient_id");

-- CreateIndex
CREATE INDEX "donations_payment_status_idx" ON "donations"("payment_status");

-- CreateIndex
CREATE INDEX "donations_createdAt_idx" ON "donations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_donation_id_key" ON "transactions"("donation_id");

-- CreateIndex
CREATE INDEX "transactions_gateway_tx_id_idx" ON "transactions"("gateway_tx_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "disaster_reports_user_id_idx" ON "disaster_reports"("user_id");

-- CreateIndex
CREATE INDEX "disaster_reports_responder_id_idx" ON "disaster_reports"("responder_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "donations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
