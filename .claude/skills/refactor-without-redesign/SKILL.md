# Refactor Without Redesign

Use this skill when converting an existing prototype or hardcoded screen into a production-backed feature.

## Primary rule

Preserve the current visual design and user experience unless a change is required for correctness, accessibility, responsiveness, or SPEC.md.

## Workflow

1. Inspect the existing page and its reusable components.
2. Identify what is currently hardcoded.
3. Identify the proper source of truth.
4. Preserve:
   - spacing
   - layout
   - typography
   - existing responsive behavior
   - card structures
   - navigation
   - established design system
5. Replace mock state with real queries/mutations.
6. Add real:
   - loading state
   - empty state
   - error state
7. Remove demo data from production paths.
8. Reuse existing components rather than creating visually duplicate replacements.

## Avoid

Do not:

- rebuild an entire screen unnecessarily
- rename unrelated components
- replace the design system
- introduce a second implementation beside the first
- alter global styles for a local feature
- rewrite working components merely for preference

## Example

Bad:

Replace the existing Recorded Lessons page with a completely new card design.

Good:

Keep the cards, progress bars, buttons, status badges, and responsive grid while sourcing lessons and progress from real records.

## Verification

Compare the resulting page to the previous UI and verify that functional changes did not cause unnecessary visual regressions.