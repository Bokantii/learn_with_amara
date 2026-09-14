-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ANNOUNCEMENT';
ALTER TYPE "NotificationType" ADD VALUE 'ASSIGNMENT_PUBLISHED';
ALTER TYPE "NotificationType" ADD VALUE 'ASSIGNMENT_GRADED';
ALTER TYPE "NotificationType" ADD VALUE 'ENROLLMENT_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'ASSESSMENT_GRADED';
ALTER TYPE "NotificationType" ADD VALUE 'LESSON_PUBLISHED';

-- CreateEnum
CREATE TYPE "AnnouncementScope" AS ENUM ('ALL', 'PROGRAM', 'GROUP', 'STUDENT');

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scope" "AnnouncementScope" NOT NULL,
    "program_id" TEXT,
    "group_id" TEXT,
    "student_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcements_published_at_archived_at_idx" ON "announcements"("published_at", "archived_at");
CREATE INDEX "announcements_program_id_idx" ON "announcements"("program_id");
CREATE INDEX "announcements_group_id_idx" ON "announcements"("group_id");
CREATE INDEX "announcements_student_id_idx" ON "announcements"("student_id");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
