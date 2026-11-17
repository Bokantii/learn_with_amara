-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "AccountTokenPurpose" AS ENUM ('INVITE', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "deactivated_at" TIMESTAMP(3),
  ADD COLUMN "deactivated_by_id" TEXT;

-- Backfill: a pre-existing password-less, non-OAuth account was an unusable
-- admin-created stub — mark it INVITED so the new invite flow can adopt it.
UPDATE "users"
   SET "status" = 'INVITED'
 WHERE "passwordHash" IS NULL
   AND "id" NOT IN (SELECT "user_id" FROM "accounts");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deactivated_by_id_fkey" FOREIGN KEY ("deactivated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "account_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "purpose" "AccountTokenPurpose" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_tokens_token_hash_key" ON "account_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "account_tokens_user_id_purpose_idx" ON "account_tokens"("user_id", "purpose");

-- AddForeignKey
ALTER TABLE "account_tokens" ADD CONSTRAINT "account_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: an announcement outlives the admin who authored it (Known Deferred Issue #22f).
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_created_by_id_fkey";
ALTER TABLE "announcements" ALTER COLUMN "created_by_id" DROP NOT NULL;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
