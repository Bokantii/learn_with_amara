# ICLP Web Platform — Product & Engineering Specification

**Product:** International Center for Language Proficiency (ICLP) Web Platform  
**Scope:** Web application only for this milestone. Mobile application is a later phase.  
**Status:** Existing product is partially implemented and contains production UI mixed with hardcoded/demo data.  
**Primary goal:** Finish the existing product without unnecessary redesign, replacing demo behavior with a coherent, secure, database-backed learning-management workflow.

---

## 1. Purpose

ICLP is a language-learning and exam-preparation platform serving students preparing for exams such as TCF, TEF, DELF/DALF and, over time, additional language programs such as Spanish and Chinese.

The web product has three connected surfaces:

1. **Public website** — marketing, programs, exam preparation, pricing, blog, about, legal pages, placement test, authentication.
2. **Student LMS** — enrolled programs, live classes, recorded lessons, assignments, results, progress, billing, notifications and settings.
3. **Admin/Instructor portal** — student enrollment, program/content management, groups, live classes, assignments, grading, attendance, payments and announcements.

The system must behave as one product backed by one coherent domain model. Do not implement these surfaces as unrelated hardcoded screens.

---

## 2. Non-negotiable engineering principles

1. **Preserve the existing UI unless a change is required by this specification.** Refactor behavior before redesigning visuals.
2. **Production business data must not be hardcoded in React components.** Static labels, enums and configuration are allowed; students, scores, courses, assignments, payments, dates, classes and progress must come from real records or legitimate empty states.
3. **Authentication is not authorization.** Every protected server action/route must verify the authenticated user's permissions on the server.
4. **Account is not enrollment.** Creating an account must never fabricate an enrollment or LMS data.
5. **Derived metrics should be derived from source records where practical.** Do not store fake aggregate values merely to populate cards.
6. **Admin actions drive student state.** Programs, lessons, assignments, classes, groups, grades and announcements created by staff must become visible to the correct students automatically.
7. **Student actions drive admin state.** Lesson progress, submissions, assessment attempts and attendance must update the staff view.
8. **Use existing project conventions before adding new abstractions.** Inspect the repository first.
9. **All user-facing async states require loading, success, error and empty-state handling.**
10. **No task is complete until type checking, linting, tests and production build pass.**

---

## 3. Existing repository assumptions

The repository currently contains at least:

- `app/` — Next.js application routes
- `components/` — reusable UI components
- `lib/` — shared/server/domain logic
- `e2e/` — Playwright E2E tests
- `emails/` — email templates or email-related components
- `prisma/schema.prisma`
- `prisma/migrations/`
- `prisma/seed.ts`
- `types/`
- `auth.ts`
- `playwright.config.ts`
- Sentry configuration

**Important:** Do not assume the Prisma database provider from this specification. Read `prisma/schema.prisma` before changing persistence code.

---

## 4. Product roles

### 4.1 USER
Authenticated account with no active student enrollment and no staff permissions.

Can:
- manage own basic account
- browse public programs
- take permitted public placement tests
- begin an enrollment/payment flow if implemented

Cannot:
- access student LMS data
- access admin/instructor routes

### 4.2 STUDENT
Authenticated user with at least one valid/active enrollment.

Can access only their own:
- programs
- lessons and lesson progress
- classes
- assignments/submissions
- assessment results
- attendance
- billing information allowed by policy
- notifications
- profile/settings

### 4.3 INSTRUCTOR
Staff user authorized to manage instructional resources within assigned scope.

Initial capabilities may include:
- view assigned students/groups/programs
- manage lessons/classes/assignments
- grade submissions
- manage attendance
- publish instructional announcements

### 4.4 ADMIN
Institution administrator.

Can manage:
- students and enrollments
- staff/instructor assignments when implemented
- programs/content
- groups
- classes
- assignments/grading
- attendance
- announcements
- payments/payment records
- relevant settings

### 4.5 Role security

- There is **no public "Sign up as Admin"** flow.
- Initial admin account(s) must be provisioned through a controlled seed/script/manual database process.
- Future staff accounts should be created or invited by an authorized admin.
- Client-side role checks are UX only. Server-side authorization is authoritative.
- A user must not gain staff access by editing cookies, query strings, local storage, request bodies or client state.

---

## 5. Authentication and post-login routing

### 5.1 Login flow

After successful authentication, resolve the user on the server and route according to authorization state:

- `ADMIN` -> `/admin`
- `INSTRUCTOR` -> staff/instructor destination supported by current architecture
- enrolled `STUDENT` -> `/dashboard`
- authenticated `USER` with no active enrollment -> enrollment/onboarding state, not a populated LMS dashboard

### 5.2 Sign-up flow

Public registration may create a normal user account. It must **not**:
- create fake programs
- create fake scores
- create fake assignments
- create fake payments
- grant admin permissions
- grant LMS access without the required enrollment state

### 5.3 OAuth

Google and Facebook auth buttons currently appear but are not working.

Requirements:
- Implement configured providers correctly, including error handling and account linking behavior supported by the existing auth library.
- If a provider cannot be correctly configured for production, do not leave a deceptive working-looking button. Hide or clearly disable it until configured.
- Never embed provider secrets in client code.

### 5.4 Password UX

All password and password-confirmation fields must have an accessible show/hide toggle.

Requirements:
- eye icon/toggle
- preserve cursor/focus where practical
- `aria-label="Show password"` / `aria-label="Hide password"`
- works on sign in, sign up, reset/change password and confirmation fields

### 5.5 Authentication performance

Current sign-in/user-data loading is perceived as slow.

Audit and improve:
- duplicate session/user fetches
- sequential fetch waterfalls
- unnecessary client-side requests after server rendering
- repeated Prisma queries
- oversized payloads
- blocking calls unrelated to first render

Add appropriate loading state, but treat loading UI as secondary to removing avoidable latency.

---

## 6. Enrollment model

Account creation and enrollment are separate concepts.

A student may have **multiple program enrollments**. Do not model a student with one `program` string.

Conceptual relationship:

`User -> StudentProfile (optional) -> Enrollment[] -> Program`

Enrollment should be capable of representing at least:
- program
- student
- status
- enrollment/start date
- optional completion/end date
- optional cohort/group association through separate membership records
- created/updated timestamps

Recommended statuses (adapt to existing conventions):
- `PENDING`
- `ACTIVE`
- `PAUSED`
- `COMPLETED`
- `CANCELLED`

Do not silently delete historical enrollment data when a student leaves a program.

---

## 7. Public website

### 7.1 Header

- Keep institution logo.
- Add institution name beside logo in a responsive manner where appropriate.
- Navigation must point to real pages/routes.
- `Get Started` in both header and hero must lead to a meaningful enrollment/program-selection/auth flow.
- EN/FR choice must persist across page navigation and reloads.

### 7.2 Footer / contact details

Use the following verified contact information:

- Email: `centerforlanguageproficiency@gmail.com`
- Canada phone/WhatsApp: `+1 (437) 291-8783`
- Nigeria phone/WhatsApp: `+2348130408788`
- Instagram: `https://www.instagram.com/centerforlanguageproficiency/`

Social requirements:
- Remove/hide Twitter/X until an official account exists.
- Remove/hide Facebook social link until an official page exists. This is separate from Facebook OAuth.
- Remove/hide YouTube until an official channel exists.
- LinkedIn may remain hidden until the official page is ready.
- Provide Instagram now.
- Provide WhatsApp actions using the verified numbers.

### 7.3 Copyright year

Do not hardcode `2025`.

Render the current year dynamically, e.g. at runtime/server render.

### 7.4 Social proof/student counts

Remove unverified claims such as:
- `50K+ students`
- `thousands of learners`

Do not replace them with invented numbers.

Until an authoritative count is provided, use non-numeric truthful copy such as:
- "A growing community of language learners"
- cohort-focused copy supported by the institution's actual operations

If a numeric metric is later used, source it from an admin-controlled verified value or reliable database calculation.

### 7.5 About page

Create a functioning `/about` page and link it from public navigation/footer.

The page should include a professional **Meet the Director** section for Amarachi Nwankpa.

Use the supplied background as source material, but present it as concise professional copy rather than a raw CV list. Relevant supplied details include:
- B.A. studies in Modern European Languages, Nnamdi Azikiwe University, Awka (2014–2018)
- language study including French, Spanish, German and Chinese
- teaching during National Youth Service at the Nigerian Army School of Electrical and Mechanical Engineering, Auchi
- French instruction experience at the Nigerian Army Language Institute, Ovim, Isuikwuato, Abia State
- prior home language tutoring
- French, Spanish and Government teaching experience at Bexley Montessori School, Awka
- Chinese/HSK-related certification through the Confucius Institute / Beijing Language and Culture University context supplied by the institution
- DELF B2
- DELE/Spanish credential information supplied by the institution
- additional professional certifications supplied by the institution

Homepage treatment: approximately 100–150 words plus CTA to full About page.  
About page: fuller but readable professional biography.

Do not embellish credentials beyond institution-provided facts.

### 7.6 Community

Current Community link is dummy.

For this milestone choose one of:
- implement a simple real `/community` informational page explaining community/group learning and how enrolled students access cohorts, or
- remove the public link until a real community experience exists.

Do not leave a dead route.

### 7.7 Terms of Service and Privacy Policy

Create real routes:
- `/terms`
- `/privacy`

They must contain institution-specific baseline policies, not lorem ipsum. Mark content for legal review before production launch. Do not represent generated text as legal counsel.

### 7.8 Newsletter

Current newsletter input leads nowhere.

MVP behavior:
- validate email
- obtain explicit subscription intent through submission
- store subscriber record securely if no external email provider is configured
- display success/error state
- prevent obvious duplicate subscriptions
- do not imply emails are being sent if no delivery provider is configured

If the project already has a real mailing provider, use it instead of inventing a second system.

### 7.9 Blog

Existing blog cards/links must lead to real blog detail pages.

Minimum:
- blog index
- slug-based article page
- real initial article content relevant to language learning/exam prep
- no dead cards
- SEO metadata for posts

Prefer the repository's existing content approach. Do not introduce a CMS solely for this requirement unless one already exists or the architecture clearly benefits from it.

---

## 8. Internationalization (EN/FR)

Current EN/FR toggle works only on limited surfaces.

Requirements:
- selected locale persists across route navigation
- selected locale persists across reloads using the current architecture's appropriate cookie/session/local preference mechanism
- public navigation, common UI and supported page content use the selected locale
- student/admin language preference should integrate with profile settings when authenticated
- avoid storing translated copies of purely dynamic user data unless needed
- missing translations must have a predictable fallback, not broken keys

Do not duplicate entire page components per locale unless the existing architecture requires it.

---

## 9. Exam preparation / placement test

### 9.1 Existing CTAs

`Choose Your Path`, `Start Your Preparation` and similar CTAs must lead to real routes/workflows.

### 9.2 Placement test

`Take a Practice Exam` should lead to a placement/diagnostic test experience.

For this milestone use a **question-bank-based test engine** rather than unconstrained AI generation on every attempt.

A question should be capable of storing:
- language
- CEFR level or internal difficulty
- skill/category
- prompt
- answer choices where applicable
- correct answer/rubric
- explanation where appropriate
- active/published state

The engine should:
- select an appropriate balanced set
- prevent answer leakage
- record an attempt
- calculate a deterministic result for auto-gradable sections
- show estimated level/result
- recommend an appropriate program/next step

AI-assisted generation may be added later behind staff review, but generated questions must not automatically enter production without validation.

---

## 10. Student LMS

The existing student UI should be reused wherever practical.

### 10.1 Student identity

Remove hardcoded names such as `Sarah Chen`.

Header/sidebar/profile must display the authenticated student's actual data.

Profile should support:
- first name
- last name
- email (with appropriate edit/verification rules)
- phone
- profile image
- optional bio
- language preference
- password/security settings where applicable

### 10.2 Dashboard metrics

Current hardcoded examples include:
- Overall Progress
- Study Hours
- Completed Lessons
- Average Score
- Weekly Progress
- Continue Learning
- Next Live Class
- My Groups
- Tasks Due
- Latest Mock Test
- Announcements

Replace all with real data or legitimate empty states.

#### Overall Progress
Derive from the student's active enrolled learning content using a documented formula. Prefer completion of assigned/published lessons rather than a manually-entered arbitrary percentage.

#### Study Hours
Derive from supported activity records. Define what counts (e.g. tracked lesson watch time, completed sessions). Do not pretend browser-open time is meaningful study time.

#### Completed Lessons
Count completion records against the relevant assigned/published lesson set.

#### Average Score
Derive from graded assessments/submissions included in the configured calculation. Document exclusions.

#### Continue Learning
Return recent incomplete, accessible lessons from active enrollments, ordered by recent activity/relevance.

#### Next Live Class
Return the nearest upcoming class the student is entitled to attend.

#### My Groups
Return actual group memberships.

#### Tasks Due
Return relevant incomplete assignments sorted by due date/priority.

#### Latest Mock Test
Return the latest completed qualifying assessment attempt.

#### Announcements
Return published announcements targeted to the student's program/group/student identity.

### 10.3 My Programs

Remove hardcoded program cards.

Display actual enrollments. A student may have multiple programs.

Each program card should derive:
- title
- language
- level/exam track
- enrollment status
- lesson completion
- progress
- optional target/end date where legitimately configured

`Continue Learning` opens the appropriate program/next lesson.

### 10.4 Program learning structure

Support a hierarchy conceptually equivalent to:

`Program -> Module -> Lesson -> resources/activities`

Programs may include:
- recorded video lessons
- text/resources
- assignments
- quizzes/assessments
- live classes

Instructor/admin determines content, lesson sequence and applicability.

### 10.5 Recorded Lessons

Current UI states (start, continue, completed/rewatch, locked) should become data-driven.

A lesson should support relevant fields such as:
- title
- description
- program/module
- order
- duration
- video source/reference
- thumbnail
- attachments/resources
- publish state
- prerequisites/access rules

Progress record should support:
- student
- lesson
- started timestamp
- most recent position if supported by player
- completion percentage or completion state
- completed timestamp

Locked state must derive from real prerequisite/access rules, not a hardcoded card.

### 10.6 Live Classes

Remove fictional instructors, dates and participant counts.

Admin/instructor creates classes with:
- title
- program and/or group targeting
- instructor
- start/end time
- timezone-aware date/time
- Zoom link
- status
- optional notes

Default/reusable Zoom link supplied by institution:
`https://us06web.zoom.us/j/79255568040?pwd=x7q9aFaZEGwmSQjLbn6DrXla7uWO6d.1`

Requirements:
- Admin may use the default Zoom link or override it per class.
- Students see only classes relevant to their enrollment/group.
- Upcoming and Past tabs are date/status driven.
- Joining opens the configured URL safely.
#### Class Status Changes

Students must always see the current authoritative state of a live class.

If an admin/instructor cancels a class:

- the class must display as cancelled where historical visibility is appropriate
- the student must not be presented with an active "Join Class" action
- the obsolete Zoom link must not be presented as an active class link
- the cancellation reason may be displayed where appropriate
- the admin's optional student-facing cancellation message should be displayed
- any associated in-app cancellation notification should link to the relevant class where appropriate

If an admin/instructor reschedules a class:

- the student must see the new authoritative date and time
- obsolete scheduling information must not remain presented as current
- the class should clearly indicate that it was rescheduled where useful
- the student should receive the configured rescheduling notification

Students must never be shown an obsolete schedule or actionable Zoom link after a class has been cancelled or rescheduled.

#### Class Reminders

Students enrolled in the relevant program/group may receive automated reminders for upcoming live classes.

The default reminder is one hour before the scheduled class.

A class reminder may include:

- class title
- instructor
- current date/time
- duration
- relevant program/group
- Zoom/meeting link
- optional instructor/admin message

Students who are no longer entitled to attend the class must not receive the reminder.

Cancelled classes must not generate normal upcoming-class reminders.

Reminder delivery should not be treated as the source of truth for class information. The current class record in ICLP remains authoritative.
### 10.7 Assignments

Assignments may target:
- one student
- a group/cohort
- a program/enrollment set

Support:
- title
- instructions
- assignment type/category
- due date
- priority
- points/weight when used
- attachments/resources where supported
- target audience
- publish status

Student view:
- pending/submitted states
- assignment detail
- submission status
- due date
- submission mechanism appropriate to assignment type (text/file/link as implemented)
- feedback/grade when released

Do not fabricate assignments when none exist.

### 10.8 Results

Remove hardcoded percentages, charts and mock-test records.

Student results should derive from actual attempts/grades.

Support skill dimensions relevant to an exam, e.g.:
- reading
- writing
- listening
- speaking

Charts render only when enough data exists. Provide meaningful empty state otherwise.

`View Details` must open a real detail view.  
`Download Report` must either generate a real report or be hidden until implemented; never provide a dead button.

### 10.9 Billing

Current student billing screen contains fictional subscriptions/card information and must not ship as demo data.

First inspect the institution's actual payment workflow and existing project payment integration.

MVP principles:
- show only real payment/subscription/plan records
- never store raw card numbers/CVV
- if using a payment processor, store processor references and safe display metadata only
- if payments are recorded manually by admin, label them accurately rather than pretending a card is on file
- show truthful empty state when no payment method/subscription exists

Do not impose a recurring-subscription model merely because the current UI contains monthly cards.

### 10.10 Settings

Replace hardcoded profile data.

Tabs should be functional or removed until functional:
- Profile
- Notifications
- Language
- Security

Profile image upload must enforce file type/size and use the project's supported storage mechanism.

---

## 11. Admin / Instructor portal

Current sidebar includes Overview, Students, Groups, Assignments, Grading and Payments. Extend capabilities without unnecessarily cluttering navigation.

The operational capabilities below must exist, either as primary navigation or nested detail screens.

### 11.1 Overview

Cards must be dynamic:
- Total Students
- Active Programs
- Assignments
- Needs Grading

`Needs Grading` list should show actual pending submissions.

### 11.2 Students

Current student table includes fake/demo records and a single program dropdown.

Requirements:
- list/search/filter real students
- open a student detail view
- avoid one-program-per-student assumption
- safe deactivate/archive flow rather than destructive deletion when records have history

Student detail should expose, as appropriate:
- overview
- enrollments/programs
- groups
- lesson progress
- assignments/submissions
- results
- attendance
- payments
- internal notes if implemented

Admin actions:
- enroll student in program
- pause/complete/cancel enrollment
- add/remove from group
- inspect progress
- assign individual work
- review results

### 11.3 Programs

Add staff capability to manage programs.

Program should support:
- name
- language
- level/exam track
- description
- active/published state
- modules
- lessons/content
- optional pricing/package relationship where appropriate

Admin can create/edit/archive programs. Avoid deleting programs with historical enrollments.

### 11.4 Modules and lessons

Admin/instructor can:
- create/reorder modules
- create/edit/reorder lessons
- publish/unpublish lessons
- attach video/resources
- set prerequisites/access sequencing where supported

Changes should propagate to entitled students without duplicate manual data entry.

### 11.5 Groups / cohorts

Current group cards should become fully functional.

Group supports:
- name
- program association where relevant
- members
- status
- optional schedule/notes

Admin can:
- create group
- rename/edit
- add/remove members
- archive group
- view group assignments/classes

Assignments and classes may target a group.

### 11.6 Live classes

Add an admin/staff live-class management surface.

Capabilities:
- schedule class
- assign program/group/students as supported
- select instructor
- set timezone-aware start/end
- use default Zoom link or override
- edit/cancel class
- reschedule class
- configure automated class reminders
- cancel a class with a structured cancellation reason
- add an optional custom student-facing cancellation message
- choose whether affected students should be notified immediately
- view reminder/notification delivery status
- view upcoming/past classes
- launch attendance session

Admins must be able to cancel and reschedule live classes, optionally provide a custom student-facing message, configure class reminders, and view notification delivery status.

### 11.7 Assignments

Current cards become database-backed.

Admin can:
- create/edit/publish/archive assignment
- target individual student, group or program audience
- set due date/priority/type/points
- view submission counts
- open submissions

### 11.8 Grading

Pending tab shows actual ungraded submissions.

Admin/instructor can:
- inspect submission
- enter score where applicable
- enter feedback
- save draft grade if needed
- release/publish grade to student

Student receives notification when grade/feedback is released.

Historical graded submissions remain accessible.

### 11.9 Assessments / mock tests

Support staff management of assessments used by the LMS/result system.

At minimum distinguish:
- placement/diagnostic test
- practice quiz
- mock exam
- graded assignment where applicable

Do not force every assessment into one simplistic score structure if speaking/writing requires human grading.

### 11.10 Attendance

Implement admin-side QR attendance generation now; mobile scanner is a later milestone.

#### Attendance session flow

1. Staff opens a scheduled live class.
2. Staff clicks `Start Attendance` / `Generate QR`.
3. Server creates a short-lived attendance session/token tied to that class.
4. Admin screen renders QR code and live status/count.
5. Token expires after configured interval or staff closes attendance.

Attendance QR must not merely expose a reusable raw class ID.

Conceptual records:

**AttendanceSession**
- id
- liveClassId
- createdBy
- token/hash or safe token reference
- startsAt
- expiresAt
- status

**AttendanceRecord**
- liveClassId/sessionId
- studentId
- checkedInAt
- status
- source
- unique constraint preventing duplicate check-in for the same attendance event

Statuses should support at least:
- `PRESENT`
- `LATE`
- `ABSENT`
- `EXCUSED`

Attendance is primarily a tracking feature, not an automatic punishment mechanism.

#### Mobile-later compatibility

The web backend must expose a secure check-in contract that a future authenticated mobile application can call after scanning the QR.

Server validation must include:
- authenticated user is a student
- attendance session exists and is open
- token is valid/unexpired
- student is entitled to attend the class
- duplicate check-in is prevented

Do not build the mobile scanner in this web milestone.

### 11.11 Announcements

Admin/instructor can publish announcements targeted to:
- all applicable students
- program
- group
- optionally individual students

Announcements appear on student dashboard and may produce notifications.

### 11.12 Payments

Current admin payment page must reflect real records, not demo status.

Support truthful visibility into:
- student
- related enrollment/program where applicable
- amount
- currency
- payment date
- payment status
- payment method category/provider reference where safe
- total paid
- last payment

Admin dashboard metrics such as monthly revenue and paying students must derive from actual payment records and the defined reporting period.

If payment collection is not yet integrated, support manual payment records only if this matches institutional workflow; clearly distinguish manual records from processor-confirmed transactions.

---

## 12. Communication and notifications

This milestone does **not** need a full chat/messaging product.

"Seamless communication" means event-driven updates across the admin/student workflow.

Examples:

Admin -> Student:
- enrollment activated/changed
- assignment published
- assignment graded
- class scheduled/updated/cancelled
- lesson published
- announcement published
- payment status changed when appropriate

Student -> Admin:
- assignment submitted
- assessment completed
- lesson/progress data updated
- attendance recorded

Notification record should support at least:
- recipient
- type
- title
- message
- related entity type/id or safe link target
- read timestamp
- created timestamp

Notification bell badge/dot must reflect unread state.

Mark-as-read behavior must persist.

Avoid notifying users about events they cannot access.

---

## 13. Student identity / institutional email

Do **not** build custom email hosting/mailboxes into this milestone.

Students authenticate with their normal email address.

If an institutional identity is useful, generate a unique **ICLP Student ID**, e.g. conceptually:
`ICLP-2026-0047`

Requirements:
- unique
- stable after issuance
- generated server-side
- visible to admin and optionally student

If institutional mailboxes are later required, integrate a managed provider such as an organizational email platform rather than implementing a mail server inside the LMS.

---

## 14. Data model — conceptual entities

Adapt names to the existing Prisma schema rather than duplicating equivalent models.

Likely domain entities include:

- User
- Account/Session (auth-library dependent)
- StudentProfile
- StaffProfile or role metadata
- Enrollment
- Program
- Module
- Lesson
- LessonResource
- LessonProgress
- Group
- GroupMembership
- LiveClass
- Assignment
- AssignmentTarget or equivalent audience mapping
- Submission
- Grade/Feedback or grading fields
- Assessment
- Question
- AssessmentAttempt
- AssessmentResponse
- AttendanceSession
- AttendanceRecord
- Announcement
- Notification
- Payment
- NewsletterSubscriber

### Schema rules

- Inspect existing models first.
- Reuse/extend rather than duplicate.
- Define relational integrity where supported by the configured database/provider.
- Add indexes for common lookups.
- Use unique constraints for identities and duplicate-sensitive workflows.
- Use enums/statuses intentionally.
- Prefer archival/status changes over destructive deletion for historical academic/financial records.
- Never place authorization decisions solely in a model returned to the client.

---

## 15. Derived data rules

Do not create arbitrary mutable fields merely because UI cards need numbers.

Preferred examples:

- `completedLessons` <- count of valid completion records
- `programProgress` <- completion over relevant assigned/published lessons
- `tasksDue` <- relevant incomplete assignments with due dates
- `needsGrading` <- submitted/ungraded submissions
- `averageScore` <- defined aggregate of qualifying released grades/attempts
- `nextLiveClass` <- nearest upcoming eligible live class
- `monthlyRevenue` <- qualifying payment records in the reporting month

If a derived metric is cached for performance, document the source-of-truth and invalidation strategy.

---

## 16. Hardcoded/demo data removal

Audit the entire repository for demo business data.

Known examples from current UI include or resemble:
- Sarah Chen
- Demo Student
- fictional students/instructors
- `example.com` student emails
- fictional scores such as `86.3%`
- fictional study hours such as `42.5`
- fictional course progress
- fictional classes/dates
- fictional assignments
- fictional subscriptions/prices inside student billing
- fictional Visa/Mastercard display values
- fictional participants
- old fixed dates/year values

For every finding classify as:
1. legitimate static UI/configuration
2. seed/test fixture
3. development-only demo data
4. production business data that must be fetched/derived

Demo seed data may remain in `prisma/seed.ts` or test fixtures if clearly isolated and never silently used as production fallback.

Do not use fake data to hide empty states.

---

## 17. Server/client boundary

Preferred flow:

`UI -> validated server action/API -> domain/service logic -> Prisma -> database`

Rules:
- do not query protected data directly from insecure client logic
- validate every mutation on the server
- enforce authorization near the server operation
- keep reusable domain/business logic out of page components
- avoid repeated data-access logic across routes
- return only fields the current UI needs
- revalidate/invalidate affected views after mutations using current Next.js conventions
- handle optimistic UI only when rollback/error behavior is safe

---

## 18. Validation and error handling

All forms/mutations require:
- client-friendly validation for UX
- authoritative server-side validation
- typed/structured errors where current architecture permits
- user-readable error state
- no raw stack traces/database errors exposed to users

Critical flows must handle duplicates/idempotency where relevant:
- assignment submission
- attendance check-in
- enrollment creation
- payment webhook/event handling if implemented
- newsletter subscription

---

## 19. Security requirements

At minimum review for:
- broken access control / IDOR
- role escalation
- horizontal access between students
- insecure admin mutations
- mass assignment
- unsafe file uploads
- unsafe redirects
- OAuth misconfiguration
- CSRF protections according to auth/framework behavior
- XSS in rich/user-provided content
- secrets in client bundles/repository
- attendance token replay/expiry
- payment data handling

Every protected resource lookup should answer both:
1. does the record exist?
2. is this authenticated actor allowed to access/change it?

Do not trust entity IDs merely because they came from a rendered page.

---

## 20. Accessibility

Maintain or improve accessibility while preserving visual design.

Required checks:
- semantic headings
- form labels/descriptions
- keyboard navigation
- visible focus
- accessible icons/buttons
- password visibility toggle labels
- dialog focus management
- sufficient non-color status cues
- table/card alternatives where appropriate on mobile
- error messages associated with fields

---

## 21. Responsive web requirements

This milestone is **responsive web**, not the future mobile app.

Requirements:
- public pages usable on common mobile widths
- student/admin navigation collapses appropriately
- no horizontal overflow caused by dashboards/tables
- cards/tables adapt without losing critical actions
- dialogs/forms remain usable on small screens

Do not build React Native/mobile application code in this milestone.

---

## 22. Observability

Existing Sentry configuration should be preserved and used appropriately.

For meaningful server failures:
- capture exceptions with safe context
- do not send secrets/passwords/payment-sensitive data
- distinguish expected validation errors from exceptional failures

Add useful server logs for operationally important failures without logging secrets.

---

## 23. Testing strategy

### Unit/domain tests
Prioritize business logic such as:
- progress calculations
- authorization helpers
- enrollment eligibility
- attendance token validation
- assessment scoring
- notification targeting

### Integration tests
Prioritize:
- Prisma-backed create/update/read flows
- authorization + resource ownership
- assignment submit/grade lifecycle
- enrollment -> dashboard visibility

### Playwright E2E
Existing `e2e/` infrastructure must be used for critical user journeys.

Required high-value scenarios include:

1. Public user signs up -> does not receive fake student dashboard.
2. Unenrolled authenticated user cannot access student LMS content.
3. Student cannot access `/admin`.
4. Admin login routes to admin portal.
5. Admin enrolls a student -> program appears for that student.
6. Admin publishes lesson -> entitled student can access it.
7. Student progress changes -> dashboard/program progress updates.
8. Admin creates group and adds student -> group appears for student.
9. Admin creates assignment -> targeted student sees it.
10. Student submits -> submission appears under grading.
11. Admin grades/releases -> student sees grade/feedback.
12. Admin schedules live class -> entitled student sees it and Zoom CTA uses configured URL.
13. Admin starts attendance -> QR/session created; expired/invalid token is rejected by server contract.
14. Cross-student ID access is rejected.
15. EN/FR selection persists across navigation/reload.

---

## 24. Performance requirements

Priorities:
- improve post-login time-to-useful-content
- avoid N+1 query patterns on dashboards
- fetch dashboard data in sensible parallel/aggregated form
- paginate large admin lists
- avoid shipping excessive server data to client components
- optimize images/video thumbnails
- do not eagerly load heavy charts when no data exists

Measure before introducing complex caching.

---

## 25. Email behavior

Use existing `emails/` architecture if present.

Potential transactional emails may include:
- account verification/reset
- enrollment confirmation
- class schedule/update
- assignment/grade notification
- payment receipt/status where applicable

Do not add an external email provider without checking current code/configuration.

Notifications inside the app remain required even if email delivery is unavailable.

---

## 26. Implementation order

### Phase A — Audit and foundations
- inspect repository and current Prisma/auth structure
- inventory routes and hardcoded/demo data
- establish roles/authorization helpers
- separate account from enrollment
- fix post-login routing
- improve auth loading performance
- implement persistent locale

### Phase B — Public website completion
- real header/footer links
- contact/social corrections
- dynamic year
- About / Meet the Director
- Terms / Privacy
- Community decision/implementation
- newsletter persistence/integration
- functioning blogs
- Get Started flow
- placement test foundation

### Phase C — Core academic domain
- Programs
- Enrollments
- Modules/Lessons
- Lesson progress
- Groups
- Live classes
- Assignments/Submissions
- Grading/Results

### Phase D — Student dynamic migration
- remove Sarah/demo state
- wire Dashboard
- My Programs
- Live Classes
- Recorded Lessons
- Assignments
- Results
- Settings
- truthful Billing

### Phase E — Admin operational completion
- dynamic Overview
- Students detail/enrollments
- Programs/content management
- Groups
- Live Classes
- Assignments
- Grading
- Announcements
- Payments

### Phase F — Attendance
- staff QR generation
- short-lived secure session
- attendance records/admin views
- future-mobile-compatible check-in contract

### Phase G — quality/security
- E2E critical flows
- accessibility audit
- security review
- performance pass
- Sentry/observability pass
- production build verification

---

## 27. Definition of Done

A feature is not done because its screen renders.

It is done when:
- it satisfies this spec's behavior
- it uses real persistence or a truthful empty state
- authorization is enforced server-side
- no known fake fallback data leaks into production
- mutations update relevant student/admin views
- loading/error/empty states exist
- responsive behavior is acceptable
- accessibility basics pass
- tests cover critical behavior
- TypeScript/typecheck passes
- lint passes
- relevant automated tests pass
- production build passes
- reviewer/security findings are resolved or documented

---

## 28. Claude Code implementation instruction

Before implementing any item in this specification:

1. Read `CLAUDE.md`.
2. Read the relevant section of `SPEC.md`.
3. Inspect existing routes/components/services/schema.
4. Identify what already works.
5. Reuse and extend instead of rebuilding.
6. State assumptions when the repository does not answer a product question.
7. Prefer the smallest coherent change that advances the real system.
8. Never replace real architecture with a new parallel implementation merely because it is easier.

The existing product is a partially built application, not a greenfield mockup.
### Automated Class Reminders

Live classes support automated student reminders.

By default, the system should send an email reminder to relevant students one hour before a scheduled live class. The architecture should support additional configurable reminder times in the future, such as 24 hours before or 10 minutes before.

Recipients must NOT be permanently captured when the class is created. At reminder execution time, the system must resolve the students who are currently enrolled in the program, cohort, or group associated with the class.

Before sending any scheduled reminder, the system must re-fetch the LiveClass from the database and verify its current state.

A normal class reminder must only be sent when the class is still eligible to occur.

The reminder should include:

- Class title
- Instructor
- Date
- Start time
- Duration
- Program/group where appropriate
- Zoom/meeting link
- Optional message from the instructor/admin

The system must prevent duplicate reminder delivery.

Every reminder attempt should have a persisted delivery record containing enough information to determine:

- notification type
- class
- recipient
- channel
- scheduled time
- sent time
- delivery status
- failure information where applicable

Email is the initial delivery channel.

The notification architecture must be extensible so that future versions can support:

- in-app notifications
- mobile push notifications
- additional communication channels
### Class Cancellation and Rescheduling

A live class must have an explicit lifecycle rather than being treated as a static calendar entry.

At minimum, support:

- SCHEDULED
- CANCELLED
- COMPLETED

Rescheduling should be represented explicitly through the class workflow and/or class event history so that previous and new scheduling information can be audited.

#### Cancellation

An authorized admin/instructor can cancel a scheduled class.

The cancellation workflow should allow the admin to provide:

1. A structured cancellation reason
2. An optional custom message for students

Initial cancellation reasons may include:

- NETWORK_ISSUES
- INSTRUCTOR_UNAVAILABLE
- EMERGENCY
- SCHEDULING_CONFLICT
- OTHER

Example custom message:

> Unfortunately, today's class has been cancelled due to network issues. We will communicate the replacement date shortly.

When a class is cancelled:

1. Persist the cancellation state.
2. Persist the reason and custom message.
3. Invalidate pending normal reminders for the cancelled occurrence.
4. Determine the currently affected students.
5. Send a cancellation notification if the admin chooses to notify students.
6. Record the resulting notification attempts.

A cancelled class must never subsequently generate its original "class starting soon" reminder.

#### Rescheduling

An authorized admin/instructor can change the scheduled date/time of a class.

When a class is rescheduled:

1. Persist the new schedule.
2. Preserve sufficient history to identify that the class was rescheduled.
3. Invalidate reminders associated with the obsolete schedule.
4. Notify affected students of the schedule change where configured.
5. Generate reminder scheduling for the new class time.
6. Ensure obsolete reminder jobs cannot send notifications even if they execute.

The system must always verify the current database state immediately before sending a scheduled notification rather than trusting stale job data.

## Notification System

ICLP requires a centralized notification system rather than feature-specific email logic scattered throughout the application.

Features should request notifications through a shared notification service.

Initial notification types include:

- CLASS_REMINDER
- CLASS_CANCELLED
- CLASS_RESCHEDULED
- ASSIGNMENT_CREATED
- ASSIGNMENT_DUE
- SUBMISSION_GRADED
- ANNOUNCEMENT

The architecture should allow future notification types such as:

- PAYMENT_DUE
- PAYMENT_RECEIVED
- NEW_RECORDED_LESSON
- PROGRAM_UPDATE

### Delivery Channels

Initial supported channel:

- EMAIL

Planned channels:

- IN_APP
- PUSH

The notification domain should be designed so adding another delivery channel does not require redesigning the feature that generated the notification.

For example:

Live Class
    -> Notification Service
        -> Email Provider

Future:

Live Class
    -> Notification Service
        -> Email
        -> In-App
        -> Push

### Notification Reliability

Notification processing must:

- prevent duplicate sends
- persist notification attempts
- record successful and failed deliveries
- tolerate retries safely
- verify relevant domain state before time-sensitive notifications are delivered
- avoid sending notifications to users who are no longer eligible recipients
- never expose one student's private information to another student

Scheduled notifications must be idempotent.

A retry must not result in the same logical notification being delivered multiple times accidentally.

### Notification History

The system should maintain sufficient history for administrators to determine what happened.

Examples:

- Class reminder sent
- Class cancelled
- Cancellation email sent
- Class rescheduled
- Assignment notification sent
- Notification failed

Where useful, records should contain:

- event/notification type
- associated entity
- actor
- recipient
- timestamp
- delivery channel
- delivery status
- relevant metadata

## Known Deferred Issues

Real gaps identified during implementation, explicitly deferred rather than silently dropped. Each should be scoped as its own task before being considered resolved.

1. **Admin-created students have no credentials.** `addStudentAction` (admin Students page) creates a `User` row without setting `passwordHash`, so a student added directly by an admin currently has no way to sign in via Credentials — only Google/Facebook OAuth would work, and only if the email happens to match. Needs either a generated temporary password shown to the admin, or a proper invitation/set-password-via-email flow before this path is usable in production. Identified 2026-08-26 while building Phase 2 Task 1 (Programs/Enrollments); not fixed as part of that task.

2. **Removing a student is a destructive hard delete.** `removeStudentAction` calls `prisma.user.delete()`, which cascades (`onDelete: Cascade`) to permanently erase the student's enrollments, submissions, and payment history. This conflicts with the "preserve historical academic/financial data" principle (§2.5, §11.2) — removal should be a safe deactivate/archive flow instead. Pre-existing before Phase 1; still unresolved.

3. **Students with only COMPLETED enrollments see the onboarding empty state.** `hasActiveEnrollment()` (`lib/authz.ts`, added in Phase 1) checks `status: 'ACTIVE'` only. A student who has finished every program they were ever enrolled in (all enrollments `COMPLETED`, none `ACTIVE`) is routed to the "you're not enrolled yet" onboarding screen instead of a view of their program history. Needs a product decision on what "no active enrollment" should mean for a student with only completed/cancelled history, then a corresponding fix to the dashboard-layout gating logic. Identified 2026-08-26 during the Phase 2 Task 1 `EnrollmentStatus` extension; not fixed as part of that task.

This history should support future administrative auditing and troubleshooting.