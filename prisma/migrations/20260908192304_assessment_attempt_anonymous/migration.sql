-- Anonymous public placement attempts: `user_id` becomes optional, and an
-- attempt is instead owned via `claim_token_hash` (sha256 of a token held in an
-- httpOnly cookie). No fake User rows are created for anonymous users.

-- AlterTable
ALTER TABLE "assessment_attempts" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "assessment_attempts" ADD COLUMN "claim_token_hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "assessment_attempts_claim_token_hash_key" ON "assessment_attempts"("claim_token_hash");
