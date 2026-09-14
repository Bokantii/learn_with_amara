-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- CreateEnum
CREATE TYPE "PaymentSource" AS ENUM ('STRIPE', 'MANUAL');

-- AlterTable: enrollments — admin-approved lifecycle
ALTER TABLE "enrollments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "enrollments" ADD COLUMN "ended_at" TIMESTAMP(3);
ALTER TABLE "enrollments" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "enrollments" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable: payments — provider source, program/enrollment link, audit fields
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PAID';
ALTER TABLE "payments" ALTER COLUMN "due_date" DROP NOT NULL;
ALTER TABLE "payments" ADD COLUMN "source" "PaymentSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "payments" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "payments" ADD COLUMN "reference" TEXT;
ALTER TABLE "payments" ADD COLUMN "method" TEXT;
ALTER TABLE "payments" ADD COLUMN "note" TEXT;
ALTER TABLE "payments" ADD COLUMN "program_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "enrollment_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "recorded_by_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "payments" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "payments" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");
CREATE INDEX "payments_enrollment_id_idx" ON "payments"("enrollment_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
