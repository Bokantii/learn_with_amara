import { prisma } from '../prisma';
import {
  entitledUserIdsForLiveClass,
  VISIBLE_ENROLLMENT_STATUSES,
} from '../live-class-entitlement';

/**
 * ABSENT is compute-only (per the locked-in plan decision): it is never
 * written to the database, only produced here by diffing entitled students
 * against existing `AttendanceRecord`s at read time. This keeps the roster
 * truthful even as enrollment/group membership changes after the class, and
 * means closing a session never has to "materialize" absences.
 */

export interface AttendanceRosterRow {
  studentUserId: string;
  name: string;
  email: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  checkedInAt: Date | null;
  source: 'QR_WEB' | 'ADMIN_OVERRIDE' | null;
  hasRecord: boolean;
}

export async function getAttendanceRoster(liveClassId: string): Promise<AttendanceRosterRow[]> {
  const liveClass = await prisma.liveClass.findUniqueOrThrow({
    where: { id: liveClassId },
    select: { programId: true, groupId: true },
  });

  const [entitledIds, records] = await Promise.all([
    entitledUserIdsForLiveClass(liveClass, VISIBLE_ENROLLMENT_STATUSES),
    prisma.attendanceRecord.findMany({
      where: { liveClassId },
      select: { studentUserId: true, status: true, checkedInAt: true, source: true },
    }),
  ]);

  const recordByStudentId = new Map(records.map((r) => [r.studentUserId, r]));

  // Everyone currently entitled, PLUS anyone who already has a record for this
  // class (a student who checked in and later dropped the program still counts —
  // attendance history must not silently disappear, SPEC §7 / §11.10).
  const studentIds = [...new Set([...entitledIds, ...recordByStudentId.keys()])];
  if (studentIds.length === 0) return [];

  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, name: true, email: true },
  });

  return students.map((student) => {
    const record = recordByStudentId.get(student.id);
    if (record) {
      return {
        studentUserId: student.id,
        name: student.name,
        email: student.email,
        status: record.status,
        checkedInAt: record.checkedInAt,
        source: record.source,
        hasRecord: true,
      };
    }
    return {
      studentUserId: student.id,
      name: student.name,
      email: student.email,
      status: 'ABSENT' as const,
      checkedInAt: null,
      source: null,
      hasRecord: false,
    };
  });
}

export async function setAttendanceOverride(input: {
  liveClassId: string;
  studentUserId: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  overriddenByUserId: string;
  note?: string;
}): Promise<void> {
  const { liveClassId, studentUserId, status, overriddenByUserId, note } = input;

  await prisma.attendanceRecord.upsert({
    where: { liveClassId_studentUserId: { liveClassId, studentUserId } },
    create: {
      liveClassId,
      studentUserId,
      status,
      source: 'ADMIN_OVERRIDE',
      checkedInAt: null,
      overriddenBy: overriddenByUserId,
      overrideNote: note ?? null,
    },
    update: {
      status,
      // A manual override supersedes a QR scan for audit purposes — the roster's
      // "manual" tag keys off `source`, so it must flip even when overriding an
      // existing QR_WEB row. `checkedInAt` is left intact as the original scan time.
      source: 'ADMIN_OVERRIDE',
      overriddenBy: overriddenByUserId,
      overrideNote: note ?? null,
    },
  });
}
