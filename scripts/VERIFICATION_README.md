# Migration Verification Script

## Overview

The `verify-migration.ts` script provides comprehensive verification of the activities migration to ensure data integrity and completeness. It validates that all events have corresponding activities, all questions reference valid activityIds, and no data loss occurred during migration.

## Features

- ✅ Verifies all events have corresponding activities
- ✅ Verifies all questions reference valid activityIds
- ✅ Detects orphaned questions (referencing non-existent activities)
- ✅ Checks for missing activeActivityId fields on events
- ✅ Validates data integrity (no data loss)
- ✅ Generates detailed verification reports
- ✅ Supports verbose and JSON output modes

## Usage

### Basic Verification

Run the verification script after migration:

```bash
npm run verify:migration
```

### Verbose Mode

Get detailed output showing each verification step:

```bash
npm run verify:migration -- --verbose
```

### JSON Output

Get machine-readable JSON output for automation:

```bash
npm run verify:migration -- --json
```

### With Local DynamoDB

When running against local DynamoDB:

```bash
DYNAMODB_ENDPOINT=http://localhost:8000 npm run verify:migration
```

### With AWS DynamoDB

Set the appropriate AWS region and credentials:

```bash
AWS_REGION=us-east-1 npm run verify:migration
```

## Verification Checks

### 1. Events Have Activities

Verifies that every event has at least one associated activity. Events without activities are reported as errors.

**Error Type:** `MISSING_ACTIVITIES`

### 2. Questions Have Valid ActivityIds

Verifies that all questions have an `activityId` field and that it references a valid activity.

**Error Types:**
- `MISSING_ACTIVITY_ID` - Question missing activityId field
- `INVALID_ACTIVITY_REFERENCE` - Question references non-existent activity

### 3. Events Have ActiveActivityId Field

Verifies that all events have the `activeActivityId` field (even if null). Missing fields are reported as warnings.

**Warning Type:** `MISSING_ACTIVE_ACTIVITY_ID_FIELD`

### 4. Data Integrity

Checks for potential data loss or inconsistencies:
- Quiz activities without questions
- Mismatched question counts between activity config and database

**Warning Types:**
- `QUIZ_WITHOUT_QUESTIONS` - Quiz activity has no questions
- `QUESTION_COUNT_MISMATCH` - Activity config doesn't match database

## Report Structure

The verification script generates a comprehensive report with the following sections:

### Summary

```
Total Events:                    10
Total Activities:                10
Total Questions:                 50

Events with Activities:          10
Events without Activities:       0

Questions with activityId:       50
Questions without activityId:    0
Orphaned Questions:              0

Events with activeActivityId:    10
Events without activeActivityId: 0
```

### Errors

Critical issues that indicate migration problems:
- Events without activities
- Questions without activityId
- Questions referencing invalid activities

### Warnings

Non-critical issues that may need attention:
- Events missing activeActivityId field
- Quiz activities without questions
- Question count mismatches

### Details

Detailed information about each issue:
- List of events without activities
- List of questions without activityId
- List of orphaned questions
- List of invalid activity references

## Report Files

Reports are automatically saved to the `backups/` directory with timestamps:

```
backups/verification-report-2025-11-29T18-53-06-065Z.json
```

## Exit Codes

- `0` - Verification passed (no errors)
- `1` - Verification failed (errors found)

## Example Output

### Successful Verification

```
============================================================
MIGRATION VERIFICATION REPORT
============================================================

Timestamp: 2025-11-29T18:53:06.065Z
Status: ✓ PASSED

------------------------------------------------------------
SUMMARY
------------------------------------------------------------
Total Events:                    10
Total Activities:                10
Total Questions:                 50

Events with Activities:          10
Events without Activities:       0

Questions with activityId:       50
Questions without activityId:    0
Orphaned Questions:              0

Events with activeActivityId:    10
Events without activeActivityId: 0

============================================================
✓ VERIFICATION PASSED
All migration checks completed successfully.
============================================================
```

### Failed Verification

```
============================================================
MIGRATION VERIFICATION REPORT
============================================================

Timestamp: 2025-11-29T18:53:06.065Z
Status: ✗ FAILED

------------------------------------------------------------
SUMMARY
------------------------------------------------------------
Total Events:                    10
Total Activities:                8
Total Questions:                 50

Events with Activities:          8
Events without Activities:       2

Questions with activityId:       45
Questions without activityId:    5
Orphaned Questions:              0

Events with activeActivityId:    10
Events without activeActivityId: 0

------------------------------------------------------------
ERRORS (7)
------------------------------------------------------------

MISSING_ACTIVITIES (2):
  ✗ Event evt-123 (My Event) has no activities
  ✗ Event evt-456 (Another Event) has no activities

MISSING_ACTIVITY_ID (5):
  ✗ Question q-1 missing activityId field
  ✗ Question q-2 missing activityId field
  ✗ Question q-3 missing activityId field
  ✗ Question q-4 missing activityId field
  ✗ Question q-5 missing activityId field

============================================================
✗ VERIFICATION FAILED
Found 7 error(s) and 0 warning(s).
Please review the errors above and fix any issues.
============================================================
```

## Integration with Migration Workflow

The verification script should be run as part of the migration workflow:

1. **Before Migration** - Run with `--verbose` to understand current state
2. **After Migration** - Run to verify migration success
3. **Automated Testing** - Use `--json` output for CI/CD pipelines

## Troubleshooting

### ResourceNotFoundException

If you see this error, ensure:
- DynamoDB tables exist
- Correct endpoint is configured (local vs AWS)
- AWS credentials are set (for AWS DynamoDB)

### No Events Found

If verification shows 0 events:
- Check that you're connecting to the correct DynamoDB instance
- Verify table names match your configuration
- Ensure migration has been run

### Errors After Migration

If verification fails after migration:
1. Review the detailed error report
2. Check the saved JSON report in `backups/`
3. Consider running rollback if critical errors exist
4. Re-run migration after fixing issues

## Related Scripts

- `migrate-to-activities.ts` - Main migration script
- `test-activities-migration.ts` - Migration testing script
- `rollback-migration.ts` - Rollback script

## Requirements Validation

This script validates **Requirement 8.2** from the design document:

> WHEN converting quizzes THEN the Event System SHALL preserve all question data, answers, and configuration

The verification ensures:
- All events have activities (8.1)
- All questions reference valid activities (8.2)
- No data loss occurred (8.2, 8.3)
- Migration state is consistent (8.4)
