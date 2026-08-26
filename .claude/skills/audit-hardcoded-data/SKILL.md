# Audit Hardcoded Data

Use this skill when locating mock, demo, placeholder, or hardcoded business data.

## Goal

Identify data that should originate from the database, authenticated user, configuration, or admin actions rather than component literals.

## Search for

Look for:

- hardcoded student names
- fake instructors
- example.com emails
- fake scores
- fake payment cards
- fake subscriptions
- hardcoded lesson progress
- hardcoded class dates
- hardcoded enrollment status
- hardcoded assignments
- fake announcements
- hardcoded student counts
- hardcoded program counts
- hardcoded current year
- placeholder phone numbers
- fake social media links
- arrays embedded in UI components that represent business entities

Known historical placeholder examples may include:

- Sarah Chen
- Marie Dubois
- Jean Laurent
- Sophie Martin
- 86.3%
- 42.5 study hours
- 24/32 lessons
- fictional Visa/Mastercard records

Do not rely only on these examples. Search broadly.

## Classify each finding

### A. Legitimate static UI content

Examples:
- navigation labels
- section headings
- button labels

Leave these alone.

### B. Configuration

Examples:
- support email
- reusable Zoom fallback URL
- institution phone numbers

Move to appropriate centralized configuration when needed.

### C. Seed/demo data

Data that may remain in seed.ts for development but must not appear automatically in production.

### D. Production domain data

Must come from persisted records or derived business logic.

Examples:
- assignments
- enrollments
- scores
- lesson progress
- payments
- class schedules

## Required output

Produce a table containing:

- file
- line/location
- hardcoded value
- category
- correct source of truth
- recommended action
- priority

Do not modify code unless explicitly asked.