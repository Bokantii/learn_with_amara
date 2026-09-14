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

**Implemented (2026-09-10, Phase 2 Task 11) — account lifecycle.** `User.status` is
`INVITED | ACTIVE | DEACTIVATED`. An admin provisions a student (`/admin/students`) or staff member
(`/admin/staff`, ADMIN-only; role = ADMIN or INSTRUCTOR) as `INVITED` with **no password**; a
single-use, hashed-at-rest `AccountToken` (`lib/account/token.ts`, 7-day TTL) is emailed — or, when
email is unconfigured, the one-time link is shown once to the admin. Setting a password via
`/invite/[token]` flips the account to `ACTIVE`. Deactivation (`lib/account/lifecycle.ts`) flips
`status` + audit fields only — it never deletes an enrollment, submission, grade, payment,
attendance or notification row — kills the user's `Session` rows, and is reversible
(`Reactivate`). Guards: an admin cannot deactivate their own account or the last `ACTIVE` admin;
each mutation is `adminActionClient`. `auth.ts#authorize` refuses a non-ACTIVE credentials login and
the `signIn` callback refuses a non-ACTIVE OAuth login; `lib/authz.ts#getSessionUser` re-reads
`status`/`role` per request (memoised with React `cache`) so a mid-session deactivation or role
change takes effect on the next request. Password reset: `/reset-password` (request, no account
enumeration — always the same confirmation) → `/reset-password/[token]` (1-hour TTL).

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

The `/reset-password/[token]` and `/invite/[token]` set-password forms
(`components/SetPasswordForm.tsx`) and the Settings → Security "Change Password" card
(`app/dashboard/settings/ChangePasswordCard.tsx`) carry the show/hide toggle on every field
(Phase 2 Task 11). Settings' Profile / Notifications / Language / 2FA tabs remain static
placeholders — deferred to their own de-fake task.

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

**Decision (2026-09-09, Phase 2 Task 9) — admin-approved activation (model B).** A new enrollment is
created `PENDING` and an admin moves it to `ACTIVE` explicitly. Recording a payment (Stripe or
manual) links it to the enrollment but **never** auto-activates. The legal transition matrix lives
in `lib/enrollment/status.ts#ENROLLMENT_TRANSITIONS` and is enforced by
`assertTransition` in `updateEnrollmentStatusAction` (and mirrored in the admin Select):
`PENDING→{ACTIVE,CANCELLED}`, `ACTIVE→{PAUSED,COMPLETED,CANCELLED}`,
`PAUSED→{ACTIVE,COMPLETED,CANCELLED}`, `COMPLETED→{ACTIVE}`, `CANCELLED→{PENDING,ACTIVE}`. Course
content access (`hasProgramAccess`, lesson / recorded-lesson / assignment / practice-test reads) is
`ACTIVE` or `COMPLETED` only (`CONTENT_ACCESS_ENROLLMENT_STATUSES`) — a PENDING or PAUSED enrollment
is visible but not usable, and payment status is never treated as proof of access.

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

**Implemented — Phase 2 Task 8 (2026-09-08).** `/dashboard/results` is a server component backed by
`lib/results/queries.ts#getStudentResults(userId)` (all queries scoped to the session user — no id
from the client). It shows graded `Submission` rows (score / points / feedback), `GRADED` /
`AWAITING_REVIEW` `AssessmentAttempt` results (each linking to the ownership-checked
`/assessments/result/[attemptId]`), the latest placement CEFR **estimate** (labelled as an ICLP
estimate, not an official score), and a truthful empty state when there is no graded work. Analytics
in `lib/results/analytics.ts` (pure, unit-tested): assignment average from real grades only
(`null` → empty state, never `0`); a score-trend chart gated at `TREND_MIN_POINTS = 3` graded
assignments; a per-skill radar gated at `SKILL_MIN_AXES = 3` distinct skills, aggregated from
auto-graded single-choice responses via `perSkillBreakdown`; objective (auto) vs manual scoring kept
separate. `Download Report` is removed (no dead CTA) — a report/export is deferred (see Known
Deferred Issues). The dashboard `/dashboard` **Assignment average** card, **Latest Assessment
Result** card, and **Assignment score trend** chart use the same helper; the remaining §10.2
dashboard metrics are still hardcoded and deferred.

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

**Implemented — Phase 2 Task 9 (2026-09-09).** `/dashboard/billing` is a server component backed by
`lib/billing/queries.ts#getStudentBilling(userId)` (session-scoped; no per-payment id route). It
shows a real payment-history table (date · program · amount + currency via `formatMoney` · method /
source badge — Card = Stripe-confirmed, Manual = admin-recorded · status · reference) and a
read-only enrollments summary, with a truthful empty state and none of the old fake subscriptions /
card-on-file / invoices / due dates. A PENDING or PAUSED student can still reach billing (the
dashboard shell gate is now `hasVisibleEnrollment`). No recurring / card-on-file model. Card-on-file
and a self-serve recurring plan are explicitly out of scope (see Known Deferred Issues).

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

**Status (Phase 2 Task 11):** the destructive hard-delete is gone — `removeStudentAction` was
replaced with `setStudentDeactivatedAction` (Deactivate / Reactivate, `AlertDialog` confirm), a
per-row `Invited / Active / Deactivated` chip, a "Resend invite" / "Copy invite link" action for
INVITED rows, and a "Show deactivated" toggle (archived rows hidden by default). A dedicated
`/admin/students/[id]` detail route with the full breakdown below is still deferred
(Known Deferred Issue #19, now narrowed to "detail route only").

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

**Implemented — Phase 2 Task 10 (2026-09-09).** `Announcement` model + `/admin/announcements`
(admin-only): create a draft, **publish** (→ delivers), **edit** title/body (no re-send),
**archive / unarchive** (hidden from students, kept for the record + its delivered notifications),
**delete** (drafts only — a published announcement is archived, never deleted). Scopes: `ALL` /
`PROGRAM` / `GROUP` / `STUDENT`; the `(scope, target)` pairing is validated server-side.
`lib/announcements/targeting.ts#resolveAnnouncementRecipientIds` resolves recipients from current
data: `PROGRAM` / `GROUP` use `NOTIFY_ENROLLMENT_STATUSES` (ACTIVE + COMPLETED — same as live-class
push); `GROUP` also requires current membership; `ALL` = student accounts with ≥1 NOTIFY enrollment;
`STUDENT` = the one named student. On publish, `sendAnnouncementNotification` fans out through the
central `dispatchNotification` (`type = ANNOUNCEMENT`, IN_APP + EMAIL, synchronous, deduped by
`ANNOUNCEMENT:<id>:<userId>`). Students see their feed at `/dashboard/announcements` (targeting
recomputed server-side, no per-announcement route) and the 3 most recent on the dashboard card
(replacing the hardcoded array). Instructor authoring stays deferred (no instructor↔program
relation — see Known Deferred Issue #9).

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

**Implemented — Phase 2 Task 9 (2026-09-09).** `/admin/payments` uses
`getPaymentsOverview()` (real this-month revenue, paying vs non-paying, 6-month series) and lists
every `Payment` with a Card/Manual source badge. Admins **record** a manual payment
(`recordPaymentAction`, `source = MANUAL`, linked to the student + optionally an enrollment,
`recordedById` audit) and **mark refunded** (`updatePaymentStatusAction`) — never delete. Stripe
payments arrive via the webhook as `source = STRIPE`. `Payment` gained `programId` / `enrollmentId`
/ `source` / `method` / `reference` / `recordedById` / `note` / timestamps; `dueDate` is nullable and
no longer fabricated. Known limitation: the revenue card/chart sum `amountCents` across currencies
(pre-existing) — a per-currency breakdown is deferred.

---

## 12. Communication and notifications

This milestone does **not** need a full chat/messaging product.

"Seamless communication" means event-driven updates across the admin/student workflow.

Examples:

Admin -> Student:
- enrollment activated/changed — ✅ Task 10 (`sendEnrollmentChangedNotification`)
- assignment published — ✅ Task 10 (`sendAssignmentPublishedNotification`, program∩group NOTIFY students)
- assignment graded — ✅ Task 10 (`saveGradeAction` migrated off raw Resend to `sendAssignmentGradedNotification`; in-app + email, deduped by submission + score)
- class scheduled/updated/cancelled — ✅ Task 5 (live-class reminder / reschedule / cancellation)
- lesson published — ✅ Task 10 (`sendLessonPublishedNotification`, first publish only, program NOTIFY students)
- assessment result finalized — ✅ Task 10 (`finalizeAttemptAction` → `sendAssessmentGradedNotification`, skips anonymous attempts)
- announcement published — ✅ Task 10 (see §11.11)
- payment status changed — deferred (no clear student-visible trigger in the manual/Stripe flow yet)

Student -> Admin: deferred — see Known Deferred Issue #7 (the admin bell is a truthful empty state).
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

1. ~~**Admin-created students have no credentials.**~~ **Resolved 2026-09-10 (Phase 2 Task 11).** `addStudentAction` now calls `createInvitedUser` (`lib/account/lifecycle.ts`): the account is `status: INVITED` with no password, and a single-use hashed `AccountToken` (7-day TTL) is emailed as an `/invite/[token]` link (shown once to the admin when email is unconfigured). Setting a password there activates the account. `auth.ts#authorize` rejects a non-ACTIVE login. Staff use the same flow via `/admin/staff`.

2. ~~**Removing a student is a destructive hard delete.**~~ **Resolved 2026-09-10 (Phase 2 Task 11).** `removeStudentAction` (and the `prisma.user.delete()` call) is gone. `setStudentDeactivatedAction` → `deactivateUser` / `reactivateUser` flips `User.status` to `DEACTIVATED` / `ACTIVE` and writes `deactivatedAt` / `deactivatedById` — no enrollment, submission, grade, payment, attendance or notification row is ever deleted. A deactivated account cannot sign in (checked at `authorize` and re-checked per request in `getSessionUser`) and is reversible. The `/admin/students/[id]` detail route is still deferred — see #19.

3. ~~**Students with only COMPLETED enrollments see the onboarding empty state.**~~ **Resolved 2026-09-09 (Phase 2 Task 9).** The dashboard-shell gate (`app/dashboard/layout.tsx`) now uses `hasVisibleEnrollment()` (`lib/authz.ts` — any enrollment in `VISIBLE_ENROLLMENT_STATUSES`, i.e. anything but `CANCELLED`), so a PENDING / PAUSED / COMPLETED-only student gets the dashboard (billing, my programs, results) rather than the "not enrolled" screen. Course *content* is gated separately by `hasProgramAccess` (`ACTIVE` / `COMPLETED`). A student with zero enrollments or only `CANCELLED` ones still sees the onboarding state.

4. **Notification preferences in Settings are non-functional.** `app/dashboard/settings/page.tsx` renders a static list of notification toggles (`Email Notifications`, `Live Class Reminders`, …) with hardcoded `defaultOn` values; nothing is persisted and the notification service (`lib/notifications/`) sends to every recipient in the NOTIFY set regardless. Wiring a real per-user, per-type/channel opt-out (a preferences model honoured in `resolveLiveClassRecipients` / `dispatchNotification`) is its own task. Identified 2026-08-29 during Phase 2 Task 5 (Notifications).

   *Decision (2026-08-29):* live-class **push** notifications (email + in-app bell) go only to `ACTIVE` / `COMPLETED` enrollees — the `NOTIFY_ENROLLMENT_STATUSES` set in `lib/live-class-entitlement.ts`. This is deliberately narrower than dashboard **visibility** (`VISIBLE_ENROLLMENT_STATUSES`, everything except `CANCELLED`): a `PENDING` or `PAUSED` student can see a class if they log in, but should not have class reminders / Zoom links pushed to their inbox.

5. **Live class times are rendered in UTC only.** Reminder/cancellation/reschedule emails and the in-app notification bell format class times with `timeZone: 'UTC'` because `LiveClass` has no timezone field (a Phase 2 Task 3 limitation). A Lagos or Toronto student sees e.g. "3:00 PM UTC". Needs a `timezone` (or per-student display-tz) on `LiveClass` plus locale-aware formatting. Identified 2026-08-29 during Phase 2 Task 5.

6. **Communication sends run synchronously inside the admin action.** `cancelLiveClassAction` / `updateLiveClassAction` (Task 5) and now `publishAnnouncementAction` + the Task 10 event hooks (`saveGradeAction`, `createAssignmentAction`, `setLessonPublishedAction`, `updateEnrollmentStatusAction`, `finalizeAttemptAction`) `await` the recipient fan-out (in-app write + Resend call per student, bounded concurrency 6, wrapped in `notifySafely`) before returning. Safe and fast for the current roster, but an `ALL`-students announcement to a large cohort risks the server-action time budget and a partially-sent batch with no in-request resumption (the reminder scheduler's bounded retry only re-drives rows that reached `FAILED`/stale-`PENDING`). Move to `after()` or a job queue when cohorts grow. Identified 2026-08-29 during Phase 2 Task 5; extended 2026-09-09 during Phase 2 Task 10.

7. **No admin-directed (Student → Admin) notifications yet.** The notification bell is wired into the admin layout but only students receive notifications in this milestone, so the admin bell is a permanent truthful-empty state. SPEC §12 "Student -> Admin" events (submission received, assessment completed, attendance recorded) are a later task. The in-app bell is also not real-time — it refreshes on navigation, not via polling/SSE. Identified 2026-08-29 during Phase 2 Task 5.

8. **Task 5 review follow-ups (non-blocking).** From the `security-reviewer` / `code-reviewer` pass on Phase 2 Task 5, deferred rather than dropped:
   - Cron endpoint (`app/api/cron/live-class-reminders/route.ts`): switch `GET` → `POST`; add a rate-limit / in-flight lock; hash both sides of the bearer compare so the early length check doesn't leak the secret length.
   - ~~Project-wide `handleServerError` on the `next-safe-action` client~~ **Done 2026-09-10 (Task 11):** `lib/safe-action.ts` now forwards an `ActionError` (`lib/action-error.ts`) message to `result.serverError` and logs + genericises anything else. Task 11's own guard failures throw `ActionError`; older actions still `throw new Error(...)` (still masked) — migrate opportunistically.
   - Sentry `beforeSend` scrub for recipient email addresses that Resend echoes into provider error strings (the DB `failureReason` is already reduced to a fixed set; Sentry still gets the raw error).
   - `markLiveClassCompletedAction` has no `status === 'SCHEDULED'` guard (unlike the now-guarded update/cancel actions).
   - Moving a class to a different program/group sends no communication to the old or new cohort.
   - `app/dashboard/liveclasses/page.tsx` and `lib/live-class-entitlement.ts` now share the entitlement status constants and the resolve-by-class helper, but the page still runs its own list-by-user query; a full merge into one helper is a later cleanup.

9. **INSTRUCTOR attendance access is platform-wide.** Phase 2 Task 6 introduced `staffActionClient` (ADMIN | INSTRUCTOR) for the QR-attendance management surface (`/attendance/manage`, the four session/override actions). `LiveClass` has only a free-text `instructorName` column — no `instructor` → `User` relation — so "this instructor owns this class" cannot be enforced. Any INSTRUCTOR account can therefore start/close attendance sessions, read the roster (student name + email), and set status overrides for **every** class in every program. Accepted for this milestone as the deliberate trust level (SPEC §4.3 / §11.6 — instructors "manage attendance"); provision INSTRUCTOR accounts with the same care as ADMIN. Proper scoping needs an instructor↔class (or ↔program/group) relation plus per-class checks in every `staffActionClient` action and both manage pages, and is its own task. Identified 2026-09-01 by the Task 6 `security-reviewer` pass (finding H1). **Narrowed 2026-09-10 (Task 11):** an INSTRUCTOR can now be provisioned and deactivated from `/admin/staff`, and a deactivation revokes attendance access on the next request (`getSessionUser` gate) — but the *scoping* gap above (any active instructor manages every class) is unchanged.

10. **QR attendance token is class-wide for its 15-minute window.** One `AttendanceSession` token covers the whole class; check-in validates token + auth + entitlement + `SCHEDULED` + no existing record, with nothing binding the check-in to physical presence. An entitled student who obtains the link out of band (screenshot, classmate, photo of the projector) can check in remotely within the window, recorded indistinguishably from a real scan. Mitigations (rotating sub-tokens refreshed on the manage screen, shorter window, not rendering the raw URL as text) are deferred. Identified 2026-09-01 by the Task 6 `security-reviewer` pass (finding M1).

11. **Rate-limit fail-open and client-controlled IP (session-security pass).** ~~Staff role is read from the JWT, not the database~~ — **resolved 2026-09-10 (Task 11):** `lib/authz.ts#getSessionUser` re-reads `role` and `status` from the database on every request (memoised per render with React `cache`), so a demotion, promotion or deactivation takes effect on the next request rather than at token expiry; `deactivateUser` also deletes the account's `Session` rows. Still open for that pass: `lib/rate-limit.ts` fails **open** when Upstash env is unset, so auth-adjacent limiters (login, sign-up, attendance check-in) have no brute-force ceiling in an unconfigured environment — consider failing closed / asserting the env at boot in production (Task 7's anonymous `startAssessmentAction` already fails closed in production when unconfigured). And `getClientIp` (`lib/rate-limit.ts`) takes the leftmost `x-forwarded-for` value, which a client controls on any non-Vercel proxy topology — an attacker rotates the header to mint unlimited rate-limit buckets; prefer a platform-trusted header / trusted-proxy parse. Identified 2026-09-01 (M3, L5) and extended 2026-09-08 by the Task 7 revision `security-reviewer` pass (L1, L2).

12. **Anonymous placement attempts accumulate.** Phase 2 Task 7's public placement flow creates `AssessmentAttempt` rows with `userId = null` + `claimTokenHash` for anyone who takes the test without signing in — no fake `User`/`Enrollment` rows, but the attempt rows (and their `AssessmentAttemptQuestion` / `AssessmentResponse` children) are never pruned. One anonymous attempt is tracked per browser via the `placement_attempt` cookie; starting a new one orphans the old. A future maintenance job should delete anonymous attempts that are still `IN_PROGRESS` past a TTL (e.g. 7 days) and optionally age out old submitted anonymous results. Identified 2026-09-08 during the Task 7 public-access revision.

13. **No "claim an anonymous placement result into my account" path.** If someone takes the placement test anonymously and later creates an account or signs in, their result is not associated with the new account and does not appear in `/assessments/history` — they would need to retake it while signed in. Deliberately deferred to keep the public flow minimal (no signup/claim step). A lightweight follow-up: a "Save this result to my account" action that verifies the `placement_attempt` cookie hash against `AssessmentAttempt.claimTokenHash` (and `userId IS NULL`) before setting `userId`. Identified 2026-09-08 during the Task 7 public-access revision.

14. ~~**Dashboard §10.2 metrics are still partly hardcoded.**~~ **Resolved 2026-09-13 (V1 Launch Gate item 1).** `app/dashboard/page.tsx` now computes **Overall Progress** and **Completed Lessons** from real `Lesson`/`LessonProgress` counts scoped to the student's content-access enrollments (the same calculation `/dashboard/myprograms` already used per-program, aggregated here); **Next Live Class** queries the student's actual soonest upcoming `SCHEDULED` class (same entitlement rule as `/dashboard/liveclasses`); **Tasks Due** queries real pending assignments (same query `/dashboard/assignments` uses, with the assignment's real `priority` column). **Study Hours** had no real data source (no activity/time-tracking model exists) so it was replaced with **Active Programs** (a real enrollment count) rather than fabricated further. **Continue Learning** was removed outright — no "resume where you left off" data exists to derive it from, and building that is a new feature, not a launch-gate tweak. Originally identified 2026-09-08 during Phase 2 Task 8; narrowed 2026-09-09 during Phase 2 Task 10.

15. **No student-facing Results report/export.** Phase 2 Task 8 removed the dead `Download Report` button from `/dashboard/results` rather than shipping a fake one. A real export (server-generated PDF or a printable results view) is deferred to its own task. Identified 2026-09-08 during Phase 2 Task 8.

16. ~~**Assignment grade score has no upper bound.**~~ **Resolved 2026-09-13 (V1 Launch Gate item 2).** `saveGradeAction` (`app/admin/grading/actions.ts`) now `findUnique`s the submission's `assignment.points` before writing and throws (`ActionError`) when `score > points` — a grader typo (e.g. 25 on a 20-point assignment) is rejected with the real ceiling in the message, not silently stored. (The zod schema itself still can't express this — the ceiling is data-dependent — so the check stays in the action body; Task 8's `pct()` display-side clamp in `lib/results/queries.ts` is unaffected and now backed by a real invariant instead of just papering over it.) Covered by `e2e/admin-grading.spec.ts`'s new "rejects a score above the assignment's points" test (data-dependent on a pending submission existing, same limitation as the pre-existing grading smoke test in that file). Identified 2026-09-08 during the Phase 2 Task 8 code review.

17. **No `checkout planId` ↔ DB `Program` mapping; Stripe payments aren't linked to an enrollment.** The public checkout (`app/checkout/actions.ts`) sends a `lib/programmes.ts` / `lib/pricing.ts` catalogue id (`group-french-a0-a2`, `tcfTefBeginner`) as `planId`; `Program` has no price/plan column, so `app/api/stripe/webhook/route.ts` records the `Payment` with `source = STRIPE` but leaves `programId` / `enrollmentId` null — an admin links it by hand on `/admin/payments`. A future task adds a `Program.plan` (or `Payment.checkoutPlanId` + resolver) so a Stripe payment reliably attaches to its program/enrollment; even then, activation stays admin-approved (§6 decision B) unless a separate product decision changes that. Identified 2026-09-09 during Phase 2 Task 9.

18. **`/admin/payments` has no single cross-currency revenue figure.** After the Task 9 code review, `getPaymentsOverview()` keeps this-month revenue **per currency** (never summed across currencies) and the 6-month chart plots the single highest-volume currency, labelled with its code. A true consolidated figure would need a reporting currency + an FX rate captured at payment time; that is deferred. Identified 2026-09-09 during Phase 2 Task 9.

19. **No admin student-detail route.** SPEC §11.2 asks for a `/admin/students/[id]` detail view (overview / enrollments / groups / progress / submissions / results / attendance / payments / notes). Tasks 9–11 surfaced payments, enrollment lifecycle and account status inside the existing `/admin/students` table + Manage dialog instead. The dedicated per-student page with the full breakdown is still its own task. (The student **hard-delete** half of this issue was closed by Task 11 — see #2.) Identified 2026-09-09 during Phase 2 Task 9; narrowed 2026-09-10 during Phase 2 Task 11.

20. **A CANCELLED-only student cannot reach `/dashboard/billing`.** The dashboard shell (`app/dashboard/layout.tsx`) renders `OnboardingEmptyState` when `hasVisibleEnrollment` is false, and `VISIBLE_ENROLLMENT_STATUSES` excludes `CANCELLED` — so a student who paid and was later cancelled can't see their own payment history. It was worse before (ACTIVE-only gate). Needs a product decision: either give billing its own auth gate independent of the shell, or add `CANCELLED` to what the shell shows. Identified 2026-09-09 during the Phase 2 Task 9 code review.

21. **`updatePaymentStatusAction` (Mark refunded) records no actor/timestamp.** The refund is guarded (`PAID → REFUNDED` only, existence-checked, confirmation dialog) but `Payment` has no `refundedById` / `refundedAt` — the audit trail only shows the row is now `REFUNDED`, not who did it or when. Add those columns with the next `Payment` migration. Identified 2026-09-09 during the Phase 2 Task 9 code review.

22. **Announcement / communication-event behaviours intentionally left minimal (Task 10).** (a) Editing an announcement *after* it is published updates the stored record and the student feed but does **not** re-notify anyone who already received it — deliberate, to avoid re-pinging a whole cohort over a typo fix. (b) Per-user notification opt-out is still not implemented (see #4) — every eligible recipient of an announcement / event gets it. (c) `Notification` rows are not pruned when an announcement is archived or deleted; the archived record + its delivery history are kept on purpose. (d) The admin delivery tally shows `reached` = IN_APP `SENT` (the authoritative "sent to N students") plus, of those, how many did not get the email (`emailSkipped` when delivery is unconfigured, `emailFailed` on a provider error). (e) `ASSIGNMENT_GRADED` dedupe key is `submissionId:score`, so a grade corrected `85 → 90 → 85` does not re-notify on the revert to the original value (the student already saw "85"); `ENROLLMENT_CHANGED` keys on `updatedAt` so every real transition notifies. (f) ~~`Announcement.createdBy` is `onDelete: Cascade`~~ — **fixed 2026-09-10 (Task 11):** `createdById` is now nullable with `onDelete: SetNull`, and `listAdminAnnouncements` renders a missing author as "A former admin". (Admin accounts are archived, never deleted, so this stays latent — but the schema is now consistent either way.) Identified 2026-09-09 during Phase 2 Task 10.

23. **Account-lifecycle follow-ups intentionally left minimal (Task 11).** (a) Settings → Profile / Notifications / Language / 2FA tabs are still static placeholders — only the Security → Change Password card is wired; a full Settings de-fake (and the notification opt-out of #4) is its own task. (b) `AccountToken` rows are pruned only opportunistically — `mintToken` deletes a user's prior unconsumed token of the same purpose, `consumeAccountToken` deletes siblings on use, and `deactivateUser` deletes all of the user's tokens — so expired/consumed rows for accounts that never re-request accumulate; a periodic sweep (`DELETE FROM account_tokens WHERE expires_at < now() - interval '30 days'`) is deferred. (c) Accepting an invite lands on `/SignIn` rather than auto-signing-in (public `signIn()` from a server component is awkward; the extra sign-in step is acceptable). (d) OAuth is **not** an invite-claim path — an INVITED account whose email matches a Google/Facebook login is refused by the `signIn` callback; the invitee must use the emailed link. (e) `getSessionUser` now costs one extra indexed PK lookup per protected request (deduped per render by React `cache`) — a deliberate correctness-over-latency trade for immediate deactivation/role changes (SPEC §5.5). (f) A password reset or in-app change stamps `User.passwordChangedAt`; `getSessionUser` rejects a JWT whose `iat` predates it, so the user is signed out of every session (including the one that changed it — the Change Password card says so) and must sign in again — the stateless-JWT equivalent of session revocation. (g) The `/invite/[token]` and `/reset-password/[token]` tokens ride in the URL path (browser history / server logs); single-use + short TTL + the default `Referrer-Policy` contain this, but an explicit `Referrer-Policy: no-referrer` on those two routes and scrubbing tokens from access logs is deferred hardening. (h) The password-reset rate-limit key uses `getClientIp` (leftmost `x-forwarded-for`), spoofable on a non-sanitising proxy — same root issue as #11. Identified 2026-09-10 during Phase 2 Task 11.

24. **V1 Launch Gate follow-ups (non-blocking).** From the `security-reviewer` / `code-reviewer` pass on the Launch Gate: (a) the new "rejects a score above the assignment's points" test (`e2e/admin-grading.spec.ts`, #16 above) shares the same seeded-pending-submission it grades against with the pre-existing smoke test in that file, and that pool only shrinks over repeated runs — once it's exhausted both tests skip (`test.skip`, same accepted pattern as the original test) rather than fail; a deterministic unit test on an extracted pure bound-check would give non-decaying coverage. (b) `app/checkout/actions.ts#getOrigin()` builds the redirect origin from `x-forwarded-host`/`x-forwarded-proto` directly, pre-dating (and not going through) `lib/app-url.ts#getAppOrigin()` (Task 11), which exists specifically because forwarded headers are attacker-influenceable behind a misconfigured proxy; unifying it is a follow-up, not introduced by the Launch Gate. (c) `e2e/pricing.spec.ts`'s checkout-handoff test now asserts the manual-enrollment notice (accurate today, since `STRIPE_SECRET_KEY` is unset) — it will need a branch on `isStripeConfigured` once Stripe is actually turned on for a given environment, or it will fail (not skip). (d) `prisma/create-admin.ts` takes the admin password as a plain-text environment value on the command line (shell history / process-list exposure) — acceptable for a one-time, human-run ops script per `docs/LAUNCH_GATE.md`'s guidance to rotate it immediately afterward, but worth a proper secrets-manager-backed flow if this becomes a repeated operation. Identified 2026-09-13 during the V1 Launch Gate review.

This history should support future administrative auditing and troubleshooting.