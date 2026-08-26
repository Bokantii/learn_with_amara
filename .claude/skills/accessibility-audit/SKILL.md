# Accessibility Audit

Use this skill when reviewing or modifying interactive UI.

## Inspect

- semantic HTML
- form labels
- keyboard navigation
- focus states
- button names
- dialogs
- tabs
- error messaging
- color-independent state communication
- image alternative text
- icon-only controls
- heading order

## Password fields

Password visibility toggles must:

- use a real button
- provide an accessible name
- expose Show password / Hide password state
- work with keyboard input
- not remove the input label

## Interactive icons

Icons such as:

- notifications
- delete
- edit
- QR attendance
- show password

must not be the sole accessible description.

## Forms

Every input must have a programmatic label.

Validation errors should be understandable and associated with the relevant field.

## Do not

Do not change the visual design unnecessarily during accessibility fixes.

## Output

Report issues by severity:

- blocker
- major
- moderate
- minor

When asked to fix them, make focused changes and retest.