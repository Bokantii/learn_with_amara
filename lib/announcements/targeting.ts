import { prisma } from '../prisma';
import {
  resolveProgramGroupRecipientIds,
  resolveAllStudentRecipientIds,
} from '../notifications/recipients';

/**
 * Server-authoritative recipient resolution for an announcement's scope (SPEC
 * §11.11, Phase 2 Task 10). Program / group targeting reuses
 * `resolveProgramGroupRecipientIds` (NOTIFY_ENROLLMENT_STATUSES, students only);
 * individual targeting reaches the one chosen student. Recipients are always
 * resolved fresh from current data.
 */

type AnnouncementTarget = {
  scope: 'ALL' | 'PROGRAM' | 'GROUP' | 'STUDENT';
  programId: string | null;
  groupId: string | null;
  studentId: string | null;
};

export async function resolveAnnouncementRecipientIds(a: AnnouncementTarget): Promise<string[]> {
  switch (a.scope) {
    case 'ALL':
      return resolveAllStudentRecipientIds();

    case 'PROGRAM':
      return a.programId ? resolveProgramGroupRecipientIds(a.programId) : [];

    case 'GROUP': {
      if (!a.groupId) return [];
      const group = await prisma.group.findUnique({
        where: { id: a.groupId },
        select: { programId: true },
      });
      return group ? resolveProgramGroupRecipientIds(group.programId, a.groupId) : [];
    }

    case 'STUDENT': {
      if (!a.studentId) return [];
      const student = await prisma.user.findUnique({
        where: { id: a.studentId },
        select: { id: true, role: true },
      });
      return student && student.role === 'STUDENT' ? [student.id] : [];
    }
  }
}
