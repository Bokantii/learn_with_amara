-- AlterTable: track the last password change so a reset/change can evict older JWTs.
ALTER TABLE "users" ADD COLUMN "password_changed_at" TIMESTAMP(3);
