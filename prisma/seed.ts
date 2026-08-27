import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

async function main() {
  const studentPasswordHash = await bcrypt.hash('demo1234', 10);
  const adminPasswordHash = await bcrypt.hash('admin1234', 10);

  await prisma.user.upsert({
    where: { email: 'demo@iclp.com' },
    update: {},
    create: {
      email: 'demo@iclp.com',
      name: 'Demo Student',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@iclp.com' },
    update: {},
    create: {
      email: 'admin@iclp.com',
      name: 'Admin User',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const programSeeds = [
    { track: 'tcf-exam-prep', name: 'TCF Exam Preparation' },
    { track: 'tef-canada-prep', name: 'TEF Canada Preparation' },
    { track: 'delf-dalf-track', name: 'DELF/DALF Track' },
    { track: 'business-spanish', name: 'Business Spanish' },
    { track: 'hsk3-prep', name: 'HSK 3 Preparation' },
  ];

  const programs = new Map<string, string>(); // track -> id
  for (const seed of programSeeds) {
    const existing = await prisma.program.findFirst({ where: { track: seed.track } });
    const program =
      existing ?? (await prisma.program.create({ data: { name: seed.name, track: seed.track } }));
    programs.set(seed.track, program.id);
  }

  const studentSeeds = [
    { email: 'aisha.bello@example.com', name: 'Aisha Bello', track: 'tcf-exam-prep', status: 'ACTIVE' as const },
    { email: 'marcus.chen@example.com', name: 'Marcus Chen', track: 'tef-canada-prep', status: 'ACTIVE' as const },
    { email: 'elena.rossi@example.com', name: 'Elena Rossi', track: 'delf-dalf-track', status: 'ACTIVE' as const },
    { email: 'david.kim@example.com', name: 'David Kim', track: 'business-spanish', status: 'PAUSED' as const },
    { email: 'priya.nair@example.com', name: 'Priya Nair', track: 'hsk3-prep', status: 'ACTIVE' as const },
    { email: 'lucas.martin@example.com', name: 'Lucas Martin', track: 'tcf-exam-prep', status: 'ACTIVE' as const },
    // Enrolled in tcf-exam-prep like aisha/lucas, but deliberately not added to TCF Morning
    // Cohort (g1) below — a same-program, non-group-member fixture for group-scoped
    // entitlement tests (e2e/liveclasses.spec.ts).
    { email: 'noah.park@example.com', name: 'Noah Park', track: 'tcf-exam-prep', status: 'ACTIVE' as const },
  ];

  const studentPasswordHashDefault = await bcrypt.hash('student1234', 10);
  const students = new Map<string, string>(); // email -> userId
  for (const seed of studentSeeds) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        email: seed.email,
        name: seed.name,
        passwordHash: studentPasswordHashDefault,
        role: 'STUDENT',
      },
    });
    students.set(seed.email, user.id);

    await prisma.enrollment.upsert({
      where: { userId_programId: { userId: user.id, programId: programs.get(seed.track)! } },
      update: { status: seed.status },
      create: {
        userId: user.id,
        programId: programs.get(seed.track)!,
        status: seed.status,
      },
    });
  }

  const groupSeeds = [
    { key: 'g1', name: 'TCF Morning Cohort', track: 'tcf-exam-prep' },
    { key: 'g2', name: 'TEF Weekend Intensive', track: 'tef-canada-prep' },
  ];

  const groups = new Map<string, string>(); // key -> id
  for (const seed of groupSeeds) {
    const existing = await prisma.group.findFirst({ where: { name: seed.name } });
    const group =
      existing ??
      (await prisma.group.create({
        data: { name: seed.name, programId: programs.get(seed.track)! },
      }));
    groups.set(seed.key, group.id);
  }

  const groupMemberSeeds = [
    { groupKey: 'g1', studentEmail: 'aisha.bello@example.com' },
    { groupKey: 'g1', studentEmail: 'lucas.martin@example.com' },
    { groupKey: 'g2', studentEmail: 'marcus.chen@example.com' },
  ];

  for (const seed of groupMemberSeeds) {
    const userId = students.get(seed.studentEmail)!;
    const groupId = groups.get(seed.groupKey)!;
    await prisma.groupMembership.upsert({
      where: { userId_groupId: { userId, groupId } },
      update: {},
      create: { userId, groupId },
    });
  }

  const assignmentSeeds: {
    key: string;
    title: string;
    track: string;
    groupKey?: string;
    dueDate: Date;
    points: number;
    type: string;
    priority: string;
  }[] = [
    { key: 'a1', title: 'TCF Listening Practice Set 3', track: 'tcf-exam-prep', dueDate: new Date('2026-04-05'), points: 20, type: 'Practice', priority: 'medium' },
    { key: 'a2', title: 'TEF Written Expression Mock', track: 'tef-canada-prep', dueDate: new Date('2026-04-08'), points: 30, type: 'Mock Test', priority: 'high' },
    { key: 'a3', title: 'DELF B1 Oral Prep Exercise', track: 'delf-dalf-track', dueDate: new Date('2026-04-10'), points: 15, type: 'Exercise', priority: 'low' },
    { key: 'a4', title: 'TCF Morning Cohort Speaking Drill', track: 'tcf-exam-prep', groupKey: 'g1', dueDate: new Date('2026-04-12'), points: 10, type: 'Exercise', priority: 'medium' },
  ];

  const assignments = new Map<string, string>(); // key -> id
  for (const seed of assignmentSeeds) {
    const existing = await prisma.assignment.findFirst({ where: { title: seed.title } });
    const assignment =
      existing ??
      (await prisma.assignment.create({
        data: {
          title: seed.title,
          programId: programs.get(seed.track)!,
          groupId: seed.groupKey ? groups.get(seed.groupKey)! : undefined,
          dueDate: seed.dueDate,
          points: seed.points,
          type: seed.type,
          priority: seed.priority,
        },
      }));
    assignments.set(seed.key, assignment.id);
  }

  const submissionSeeds = [
    { studentEmail: 'aisha.bello@example.com', assignmentKey: 'a1', submittedAt: new Date('2026-03-28'), status: 'PENDING' as const },
    { studentEmail: 'marcus.chen@example.com', assignmentKey: 'a2', submittedAt: new Date('2026-03-29'), status: 'PENDING' as const },
    { studentEmail: 'lucas.martin@example.com', assignmentKey: 'a1', submittedAt: new Date('2026-03-30'), status: 'PENDING' as const },
    {
      studentEmail: 'elena.rossi@example.com',
      assignmentKey: 'a3',
      submittedAt: new Date('2026-03-25'),
      status: 'GRADED' as const,
      score: 14,
      feedback: 'Good pronunciation, work on liaison.',
    },
  ];

  for (const seed of submissionSeeds) {
    const studentId = students.get(seed.studentEmail)!;
    const assignmentId = assignments.get(seed.assignmentKey)!;
    const existing = await prisma.submission.findFirst({ where: { studentId, assignmentId } });
    if (!existing) {
      await prisma.submission.create({
        data: {
          studentId,
          assignmentId,
          submittedAt: seed.submittedAt,
          status: seed.status,
          score: 'score' in seed ? seed.score : undefined,
          feedback: 'feedback' in seed ? seed.feedback : undefined,
        },
      });
    }
  }

  const tcfProgramId = programs.get('tcf-exam-prep')!;
  const existingModule = await prisma.module.findFirst({
    where: { programId: tcfProgramId, title: 'Grammar Fundamentals' },
  });
  const grammarModule =
    existingModule ??
    (await prisma.module.create({
      data: {
        programId: tcfProgramId,
        title: 'Grammar Fundamentals',
        description: 'Core French grammar for the TCF exam.',
        order: 0,
      },
    }));

  const lessonSeeds = [
    {
      title: 'The Subjunctive Mood',
      description: 'When and how to use the subjunctive in spoken and written French.',
      order: 0,
      durationMinutes: 45,
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      published: true,
    },
    {
      title: 'Present Tense Conjugation',
      description: 'Regular and irregular verb conjugation in the present tense.',
      order: 1,
      durationMinutes: 35,
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      published: true,
    },
    {
      title: 'Advanced Verb Tenses (Draft)',
      description: 'Passé composé vs. imparfait — still being recorded.',
      order: 2,
      durationMinutes: null,
      videoUrl: null,
      published: false,
    },
  ];

  const lessonIdBySeedTitle = new Map<string, string>();
  for (const seed of lessonSeeds) {
    const existing = await prisma.lesson.findFirst({
      where: { moduleId: grammarModule.id, title: seed.title },
    });
    const lesson =
      existing ??
      (await prisma.lesson.create({
        data: { moduleId: grammarModule.id, ...seed },
      }));
    lessonIdBySeedTitle.set(seed.title, lesson.id);
  }

  const subjunctiveLessonId = lessonIdBySeedTitle.get('The Subjunctive Mood')!;
  const existingResource = await prisma.lessonResource.findFirst({
    where: { lessonId: subjunctiveLessonId, title: 'Subjunctive Conjugation Chart' },
  });
  if (!existingResource) {
    await prisma.lessonResource.create({
      data: {
        lessonId: subjunctiveLessonId,
        type: 'pdf',
        title: 'Subjunctive Conjugation Chart',
        url: 'https://example.com/resources/subjunctive-chart.pdf',
        order: 0,
      },
    });
  }

  const liveClassSeeds = [
    {
      title: 'TCF Speaking Practice',
      description: 'Open speaking practice session for all TCF Exam Preparation students.',
      instructorName: 'Amarachi Nwankpa',
      track: 'tcf-exam-prep',
      groupKey: undefined as string | undefined,
      startsAt: new Date('2026-09-05T16:00:00Z'),
      endsAt: new Date('2026-09-05T17:30:00Z'),
      status: 'SCHEDULED' as const,
    },
    {
      title: 'Morning Cohort Grammar Review',
      description: 'Weekly grammar review, TCF Morning Cohort only.',
      instructorName: 'Amarachi Nwankpa',
      track: 'tcf-exam-prep',
      groupKey: 'g1',
      startsAt: new Date('2026-09-08T13:00:00Z'),
      endsAt: new Date('2026-09-08T14:00:00Z'),
      status: 'SCHEDULED' as const,
    },
    {
      title: 'TEF Weekend Writing Workshop',
      description: null,
      instructorName: 'Jean Laurent',
      track: 'tef-canada-prep',
      groupKey: undefined as string | undefined,
      startsAt: new Date('2026-09-02T15:00:00Z'),
      endsAt: new Date('2026-09-02T16:00:00Z'),
      status: 'CANCELLED' as const,
      cancellationReason: 'NETWORK_ISSUES' as const,
      cancellationMessage:
        "Today's class has been cancelled because the instructor is experiencing network issues.",
    },
    {
      title: 'DELF B1 Oral Comprehension',
      description: null,
      instructorName: 'Sophie Martin',
      track: 'delf-dalf-track',
      groupKey: undefined as string | undefined,
      startsAt: new Date('2026-08-20T14:00:00Z'),
      endsAt: new Date('2026-08-20T15:00:00Z'),
      status: 'COMPLETED' as const,
    },
  ];

  for (const seed of liveClassSeeds) {
    const existing = await prisma.liveClass.findFirst({ where: { title: seed.title } });
    if (!existing) {
      await prisma.liveClass.create({
        data: {
          programId: programs.get(seed.track)!,
          groupId: seed.groupKey ? groups.get(seed.groupKey)! : undefined,
          title: seed.title,
          description: seed.description,
          instructorName: seed.instructorName,
          startsAt: seed.startsAt,
          endsAt: seed.endsAt,
          status: seed.status,
          cancellationReason: 'cancellationReason' in seed ? seed.cancellationReason : undefined,
          cancellationMessage: 'cancellationMessage' in seed ? seed.cancellationMessage : undefined,
        },
      });
    }
  }

  console.log('Seeded demo@iclp.com (student), admin@iclp.com (admin), 5 programs, 7 students, 2 groups, 4 assignments (1 group-scoped), 4 submissions, 1 module, 3 lessons (2 published, 1 draft), 1 lesson resource, 4 live classes (1 program-level, 1 group-level, 1 cancelled, 1 completed).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
