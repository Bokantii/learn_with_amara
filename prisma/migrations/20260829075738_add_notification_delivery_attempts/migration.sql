-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "notifications_status_type_channel_idx" ON "notifications"("status", "type", "channel");
