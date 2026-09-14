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
      status: 'ACTIVE',
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
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'instructor@iclp.com' },
    update: { role: 'INSTRUCTOR' },
    create: {
      email: 'instructor@iclp.com',
      name: 'Instructor User',
      passwordHash: adminPasswordHash,
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
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
    // Billing fixture (Task 9): enrolled but not yet activated and with no payment
    // on file — sees the dashboard shell + an empty billing page, but no course
    // content until an admin moves the enrollment PENDING -> ACTIVE.
    { email: 'pending.pay@example.com', name: 'Pending Payer', track: 'tcf-exam-prep', status: 'PENDING' as const },
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

  // The billing fixture also carries a 2nd PENDING enrollment (DELF) so the
  // multi-enrollment isolation test has stable data without mutating the roster.
  const pendingPayerId = students.get('pending.pay@example.com')!;
  await prisma.enrollment.upsert({
    where: {
      userId_programId: { userId: pendingPayerId, programId: programs.get('delf-dalf-track')! },
    },
    update: { status: 'PENDING' },
    create: {
      userId: pendingPayerId,
      programId: programs.get('delf-dalf-track')!,
      status: 'PENDING',
    },
  });

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
    { key: 'a5', title: 'TCF Reading Comprehension Check', track: 'tcf-exam-prep', dueDate: new Date('2026-03-20'), points: 20, type: 'Quiz', priority: 'medium' },
    // Dedicated to the announcements E2E "assignment graded" notification check.
    // HSK3 / priya.nair are referenced by no other spec, so grading this one
    // never disturbs another test's fixture expectations.
    { key: 'a6', title: 'HSK3 Character Writing Set 1', track: 'hsk3-prep', dueDate: new Date('2026-04-15'), points: 20, type: 'Practice', priority: 'medium' },
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
    // Dedicated pending submission the announcements E2E grades to assert the
    // "assignment graded" notification fires. Grading is one-way, so like the
    // admin-grading smoke test this path is exercised once per fresh seed.
    { studentEmail: 'priya.nair@example.com', assignmentKey: 'a6', submittedAt: new Date('2026-04-01'), status: 'PENDING' as const },
    {
      studentEmail: 'elena.rossi@example.com',
      assignmentKey: 'a3',
      submittedAt: new Date('2026-03-25'),
      status: 'GRADED' as const,
      score: 14,
      feedback: 'Good pronunciation, work on liaison.',
    },
    {
      // Gives an enrolled, dashboard-rendering student (aisha, TCF) real graded
      // work for the Results page and dashboard analytics. Uses a dedicated
      // program-level assignment (not the group-scoped a4, which other specs
      // expect to stay pending for her).
      studentEmail: 'aisha.bello@example.com',
      assignmentKey: 'a5',
      submittedAt: new Date('2026-03-24'),
      status: 'GRADED' as const,
      score: 18,
      feedback: 'Strong comprehension — review the inference questions in section 3.',
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

  // ─── Payments (Phase 2 Task 9) ─────────────────────────────────────────
  // Real manual payment records recorded by the admin, each linked to the
  // enrollment it settles. No fabricated invoices / due dates / card data.
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@iclp.com' } });
  const paymentSeeds = [
    { studentEmail: 'aisha.bello@example.com', track: 'tcf-exam-prep', amountCents: 30000, currency: 'cad', method: 'Bank transfer', reference: 'ICLP-2026-0142', paidAt: new Date('2026-01-14') },
    { studentEmail: 'elena.rossi@example.com', track: 'delf-dalf-track', amountCents: 30000, currency: 'cad', method: 'Interac e-Transfer', reference: 'ICLP-2026-0173', paidAt: new Date('2026-01-22') },
  ];
  for (const seed of paymentSeeds) {
    const studentId = students.get(seed.studentEmail)!;
    const programId = programs.get(seed.track)!;
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_programId: { userId: studentId, programId } },
      select: { id: true },
    });
    const existing = await prisma.payment.findFirst({
      where: { userId: studentId, reference: seed.reference },
    });
    if (!existing) {
      await prisma.payment.create({
        data: {
          userId: studentId,
          amountCents: seed.amountCents,
          currency: seed.currency,
          status: 'PAID',
          source: 'MANUAL',
          method: seed.method,
          reference: seed.reference,
          programId,
          enrollmentId: enrollment?.id ?? null,
          recordedById: adminUser?.id ?? null,
          paidAt: seed.paidAt,
        },
      });
    }
  }

  // ─── Account lifecycle fixtures (Phase 2 Task 11) ─────────────────────
  const lifecycleTcfId = programs.get('tcf-exam-prep')!;

  // An outstanding student invite: provisioned by an admin, never activated
  // (no password) — exercises the "cannot sign in yet" / "Invited" chip paths.
  await prisma.user.upsert({
    where: { email: 'invited.student@example.com' },
    update: {},
    create: {
      email: 'invited.student@example.com',
      name: 'Ingrid Invited',
      role: 'STUDENT',
      status: 'INVITED',
      passwordHash: null,
      enrollments: { create: { programId: lifecycleTcfId, status: 'PENDING' } },
    },
  });

  // An outstanding staff invite.
  await prisma.user.upsert({
    where: { email: 'invited.instructor@example.com' },
    update: {},
    create: {
      email: 'invited.instructor@example.com',
      name: 'Ivan Pending',
      role: 'INSTRUCTOR',
      status: 'INVITED',
      passwordHash: null,
    },
  });

  // A deactivated student WITH history — proves archiving keeps the record and
  // a later reactivation restores access with the data intact.
  const archivedStudent = await prisma.user.upsert({
    where: { email: 'archived.student@example.com' },
    update: {},
    create: {
      email: 'archived.student@example.com',
      name: 'Archie Archived',
      passwordHash: studentPasswordHashDefault,
      role: 'STUDENT',
      status: 'DEACTIVATED',
      deactivatedAt: new Date('2026-06-01'),
      deactivatedById: adminUser?.id ?? null,
      enrollments: { create: { programId: lifecycleTcfId, status: 'ACTIVE' } },
    },
  });
  {
    const a1Id = assignments.get('a1');
    if (a1Id) {
      const existing = await prisma.submission.findFirst({
        where: { studentId: archivedStudent.id, assignmentId: a1Id },
      });
      if (!existing) {
        await prisma.submission.create({
          data: {
            studentId: archivedStudent.id,
            assignmentId: a1Id,
            submittedAt: new Date('2026-05-01'),
            status: 'GRADED',
            score: 15,
            feedback: 'Solid work — kept on file after the account was archived.',
          },
        });
      }
    }
    const archivedEnrollment = await prisma.enrollment.findUnique({
      where: { userId_programId: { userId: archivedStudent.id, programId: lifecycleTcfId } },
      select: { id: true },
    });
    const existingPay = await prisma.payment.findFirst({
      where: { userId: archivedStudent.id, reference: 'ICLP-2026-0207' },
    });
    if (!existingPay) {
      await prisma.payment.create({
        data: {
          userId: archivedStudent.id,
          amountCents: 30000,
          currency: 'cad',
          status: 'PAID',
          source: 'MANUAL',
          method: 'Bank transfer',
          reference: 'ICLP-2026-0207',
          programId: lifecycleTcfId,
          enrollmentId: archivedEnrollment?.id ?? null,
          recordedById: adminUser?.id ?? null,
          paidAt: new Date('2026-02-01'),
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

  // ─── Announcements (Phase 2 Task 10) ──────────────────────────────────
  // Authored admin communication — no fake engagement metrics, no seeded
  // Notification rows (those are created on publish; the student feed reads
  // announcements directly).
  const adminId = (await prisma.user.findUnique({ where: { email: 'admin@iclp.com' } }))!.id;
  const announcementSeeds: {
    title: string;
    body: string;
    scope: 'ALL' | 'PROGRAM' | 'STUDENT';
    track?: string;
    studentEmail?: string;
    published: boolean;
  }[] = [
    { title: 'Welcome to the new ICLP dashboard', body: 'Your programs, live classes, results and billing now live in one place. Explore the sidebar and let us know what you think.', scope: 'ALL', published: true },
    { title: 'TCF Exam Preparation: revised weekly schedule', body: 'Starting next week, TCF prep sessions move 30 minutes earlier. Check Live Classes for the exact times.', scope: 'PROGRAM', track: 'tcf-exam-prep', published: true },
    { title: 'A note about your placement result', body: 'Hi Aisha — your instructor has some feedback on your last assessment. Book a slot when you can.', scope: 'STUDENT', studentEmail: 'aisha.bello@example.com', published: true },
    { title: 'Holiday break dates (draft)', body: 'The centre will be closed from Dec 23 to Jan 2. Draft — do not publish yet.', scope: 'ALL', published: false },
  ];
  for (const seed of announcementSeeds) {
    const existing = await prisma.announcement.findFirst({ where: { title: seed.title } });
    if (existing) continue;
    await prisma.announcement.create({
      data: {
        title: seed.title,
        body: seed.body,
        scope: seed.scope,
        createdById: adminId,
        publishedAt: seed.published ? new Date('2026-02-01') : null,
        programId: seed.track ? programs.get(seed.track)! : null,
        studentId: seed.studentEmail ? students.get(seed.studentEmail)! : null,
      },
    });
  }

  // ─── Placement assessment + French question bank (Phase 2 Task 7) ────────
  // Real diagnostic content (authored, like the seeded lessons/blog posts) — not
  // fake business data. Auto-graded single-choice only; the placement flow needs
  // no manual grading.
  type SeedQuestion = {
    skill: 'GRAMMAR' | 'VOCABULARY' | 'READING';
    cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
    prompt: string;
    explanation: string;
    options: { text: string; correct?: boolean }[];
  };

  const placementQuestions: SeedQuestion[] = [
    // A1
    {
      skill: 'GRAMMAR', cefrLevel: 'A1',
      prompt: 'Complète : « Je ___ français. »',
      explanation: '1re personne du singulier du verbe « être » : je suis.',
      options: [{ text: 'suis', correct: true }, { text: 'es' }, { text: 'est' }, { text: 'sont' }],
    },
    {
      skill: 'GRAMMAR', cefrLevel: 'A1',
      prompt: 'Choisis l’article correct : « ___ pomme ».',
      explanation: '« Pomme » est un nom féminin singulier : la pomme.',
      options: [{ text: 'La', correct: true }, { text: 'Le' }, { text: 'Les' }, { text: 'Un' }],
    },
    {
      skill: 'GRAMMAR', cefrLevel: 'A1',
      prompt: 'Complète : « Nous ___ étudiants. »',
      explanation: '1re personne du pluriel du verbe « être » : nous sommes.',
      options: [{ text: 'sommes', correct: true }, { text: 'sont' }, { text: 'êtes' }, { text: 'est' }],
    },
    {
      skill: 'VOCABULARY', cefrLevel: 'A1',
      prompt: 'Le contraire de « grand » est :',
      explanation: '« Petit » est l’antonyme le plus direct de « grand ».',
      options: [{ text: 'petit', correct: true }, { text: 'gros' }, { text: 'long' }, { text: 'haut' }],
    },
    {
      skill: 'VOCABULARY', cefrLevel: 'A1',
      prompt: '« Au revoir » sert à :',
      explanation: '« Au revoir » est une formule pour prendre congé.',
      options: [
        { text: 'prendre congé', correct: true },
        { text: 'dire bonjour' },
        { text: 'remercier' },
        { text: 's’excuser' },
      ],
    },
    {
      skill: 'READING', cefrLevel: 'A1',
      prompt: '« Marie a deux chats et un chien. » Combien d’animaux Marie a-t-elle ?',
      explanation: 'Deux chats + un chien = trois animaux.',
      options: [{ text: 'Trois', correct: true }, { text: 'Deux' }, { text: 'Un' }, { text: 'Quatre' }],
    },
    // A2
    {
      skill: 'GRAMMAR', cefrLevel: 'A2',
      prompt: 'Complète : « Hier, nous ___ au cinéma. »',
      explanation: '« Aller » se conjugue avec « être » au passé composé : nous sommes allés.',
      options: [
        { text: 'sommes allés', correct: true },
        { text: 'allons' },
        { text: 'avons allé' },
        { text: 'irons' },
      ],
    },
    {
      skill: 'GRAMMAR', cefrLevel: 'A2',
      prompt: 'Complète : « Il fait froid, ___ ton manteau. »',
      explanation: 'Impératif présent, 2e personne du singulier : mets.',
      options: [{ text: 'mets', correct: true }, { text: 'mettre' }, { text: 'mis' }, { text: 'mettes' }],
    },
    {
      skill: 'GRAMMAR', cefrLevel: 'A2',
      prompt: 'Complète : « Quand j’étais petit, je ___ souvent chez ma grand-mère. »',
      explanation: 'Habitude dans le passé → imparfait : j’allais.',
      options: [{ text: 'allais', correct: true }, { text: 'vais' }, { text: 'suis allé' }, { text: 'irai' }],
    },
    {
      skill: 'VOCABULARY', cefrLevel: 'A2',
      prompt: 'À la boulangerie, on achète surtout :',
      explanation: 'La boulangerie vend du pain et des viennoiseries.',
      options: [
        { text: 'du pain', correct: true },
        { text: 'des médicaments' },
        { text: 'des livres' },
        { text: 'de l’essence' },
      ],
    },
    {
      skill: 'GRAMMAR', cefrLevel: 'A2',
      prompt: 'Complète : « Je me lève ___ 7 heures. »',
      explanation: 'On indique l’heure précise avec « à » : à 7 heures.',
      options: [{ text: 'à', correct: true }, { text: 'en' }, { text: 'dans' }, { text: 'pour' }],
    },
    {
      skill: 'READING', cefrLevel: 'A2',
      prompt: '« Le train part à 9 h et arrive à 11 h 30. » Le trajet dure :',
      explanation: 'De 9 h à 11 h 30, il s’écoule 2 heures et 30 minutes.',
      options: [{ text: '2 h 30', correct: true }, { text: '2 h' }, { text: '1 h 30' }, { text: '3 h' }],
    },
    // B1
    {
      skill: 'GRAMMAR', cefrLevel: 'B1',
      prompt: 'Complète : « Il faut que tu ___ maintenant. »',
      explanation: 'Après « il faut que », on emploie le subjonctif : que tu partes.',
      options: [{ text: 'partes', correct: true }, { text: 'pars' }, { text: 'partiras' }, { text: 'partais' }],
    },
    {
      skill: 'GRAMMAR', cefrLevel: 'B1',
      prompt: 'Complète : « Si j’avais le temps, je ___ plus. »',
      explanation: 'Hypothèse « si » + imparfait → conditionnel présent : je voyagerais.',
      options: [
        { text: 'voyagerais', correct: true },
        { text: 'voyagerai' },
        { text: 'voyage' },
        { text: 'voyageais' },
      ],
    },
    {
      skill: 'GRAMMAR', cefrLevel: 'B1',
      prompt: 'Complète : « Les fleurs ___ tu m’as offertes sont magnifiques. »',
      explanation: '« que » reprend le COD : les fleurs que tu m’as offertes.',
      options: [{ text: 'que', correct: true }, { text: 'qui' }, { text: 'dont' }, { text: 'quand' }],
    },
    {
      skill: 'VOCABULARY', cefrLevel: 'B1',
      prompt: 'Un synonyme de « rapidement » est :',
      explanation: '« Vite » est le synonyme courant de « rapidement ».',
      options: [{ text: 'vite', correct: true }, { text: 'lentement' }, { text: 'à peine' }, { text: 'rarement' }],
    },
    // B2
    {
      skill: 'GRAMMAR', cefrLevel: 'B2',
      prompt: 'Complète : « Bien qu’il ___ fatigué, il a continué. »',
      explanation: '« bien que » est suivi du subjonctif : bien qu’il soit fatigué.',
      options: [{ text: 'soit', correct: true }, { text: 'est' }, { text: 'était' }, { text: 'sera' }],
    },
    {
      skill: 'GRAMMAR', cefrLevel: 'B2',
      prompt: 'Complète : « Elle est partie sans que je m’en ___ aperçu. »',
      explanation: '« sans que » entraîne le subjonctif : sans que je m’en sois aperçu.',
      options: [{ text: 'sois', correct: true }, { text: 'suis' }, { text: 'serais' }, { text: 'étais' }],
    },
    {
      skill: 'VOCABULARY', cefrLevel: 'B2',
      prompt: '« Un argument spécieux » est un argument :',
      explanation: '« Spécieux » qualifie un raisonnement trompeur sous une apparence de vérité.',
      options: [
        { text: 'trompeur mais séduisant', correct: true },
        { text: 'très solide' },
        { text: 'très ancien' },
        { text: 'mal formulé' },
      ],
    },
    {
      skill: 'READING', cefrLevel: 'B2',
      prompt: '« Loin de renoncer, elle redoubla d’efforts. » Cette phrase indique qu’elle :',
      explanation: '« Loin de renoncer » marque l’opposition : au contraire, elle a intensifié ses efforts.',
      options: [
        { text: 'a travaillé encore plus', correct: true },
        { text: 'a abandonné' },
        { text: 's’est reposée' },
        { text: 'a hésité' },
      ],
    },
    // C1
    {
      skill: 'GRAMMAR', cefrLevel: 'C1',
      prompt: 'Complète : « Eût-il su la vérité, il ___ autrement. »',
      explanation: '« Eût-il su » = « s’il avait su » → conditionnel passé : il aurait agi.',
      options: [
        { text: 'aurait agi', correct: true },
        { text: 'agirait' },
        { text: 'agissait' },
        { text: 'agit' },
      ],
    },
    {
      skill: 'VOCABULARY', cefrLevel: 'C1',
      prompt: '« Une remarque acerbe » est une remarque :',
      explanation: '« Acerbe » signifie mordant, blessant.',
      options: [{ text: 'mordante', correct: true }, { text: 'bienveillante' }, { text: 'hésitante' }, { text: 'incompréhensible' }],
    },
    {
      skill: 'VOCABULARY', cefrLevel: 'C1',
      prompt: 'Le mot « nonobstant » signifie :',
      explanation: '« Nonobstant » est une préposition soutenue synonyme de « malgré ».',
      options: [{ text: 'malgré', correct: true }, { text: 'grâce à' }, { text: 'à cause de' }, { text: 'pendant' }],
    },
    {
      skill: 'READING', cefrLevel: 'C1',
      prompt:
        '« Son discours, tout en circonlocutions, finit par lasser l’auditoire. » L’auteur reproche au discours d’être :',
      explanation: 'Une « circonlocution » est un détour de langage : le discours est jugé trop détourné.',
      options: [
        { text: 'trop détourné', correct: true },
        { text: 'trop direct' },
        { text: 'trop court' },
        { text: 'trop technique' },
      ],
    },
  ];

  let placement = await prisma.assessment.findFirst({
    where: { type: 'PLACEMENT', title: 'French Placement Test' },
  });
  if (!placement) {
    placement = await prisma.assessment.create({
      data: {
        type: 'PLACEMENT',
        title: 'French Placement Test',
        description:
          'A short diagnostic across grammar, vocabulary and reading. It estimates your CEFR level (A1–C1) and recommends a program to start with.',
        status: 'PUBLISHED',
        language: 'fr',
        questionCount: 12,
      },
    });
    for (const [index, q] of placementQuestions.entries()) {
      await prisma.question.create({
        data: {
          assessmentId: placement.id,
          type: 'SINGLE_CHOICE',
          skill: q.skill,
          cefrLevel: q.cefrLevel,
          order: index,
          prompt: q.prompt,
          explanation: q.explanation,
          options: {
            create: q.options.map((o, oi) => ({
              text: o.text,
              isCorrect: !!o.correct,
              order: oi,
            })),
          },
        },
      });
    }
  }

  console.log('Seeded demo@iclp.com (student), admin@iclp.com (admin), instructor@iclp.com (instructor), 5 programs, 7 students, 2 groups, 6 assignments (1 group-scoped), 7 submissions (3 graded), 1 module, 3 lessons (2 published, 1 draft), 1 lesson resource, 4 live classes (1 program-level, 1 group-level, 1 cancelled, 1 completed), 1 published placement assessment (24 French single-choice questions, A1–C1), 8 students (1 PENDING/unpaid billing fixture), 3 manual payments, 4 announcements (3 published, 1 draft), lifecycle fixtures: invited.student@example.com + invited.instructor@example.com (outstanding invites), archived.student@example.com (deactivated, with a graded submission + payment kept on file).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
