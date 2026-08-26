# Write Tests

Use this skill when adding or updating tests for an ICLP feature.

## Test the behavior, not implementation details.

Prioritize high-value workflows.

## For server/business logic test

- valid request
- invalid input
- unauthorized access
- missing resource
- duplicate/conflicting operation
- expected persisted result

## For UI test

Verify:

- loading state
- populated state
- empty state
- error state
- key interactions

## For end-to-end workflows

Use Playwright for important cross-layer flows.

Examples:

### Enrollment

Admin enrolls user
→ student logs in
→ assigned program appears

### Assignment

Admin creates assignment
→ student sees assignment
→ student submits
→ admin sees submission
→ admin grades
→ student sees grade

### Authorization

Regular user visits /admin
→ access denied

### Attendance

Admin opens attendance session
→ valid enrolled student checks in
→ duplicate check-in rejected
→ expired token rejected

## Testing rules

Do not mock everything if doing so removes the behavior being tested.

Use isolated test data.

Do not depend on production data.

Ensure tests can be repeated.

## Before completion

Run the relevant test command and report actual results.