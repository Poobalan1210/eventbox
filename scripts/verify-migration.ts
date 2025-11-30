#!/usr/bin/env ts-node
/**
 * Migration Verification Script
 * 
 * This script verifies that the activities migration completed successfully by:
 * 1. Verifying all events have corresponding activities
 * 2. Verifying all questions reference valid activityIds
 * 3. Verifying no data loss occurred
 * 4. Generating a comprehensive migration report
 * 
 * Usage:
 *   npm run verify:migration              # Run verification
 *   npm run verify:migration -- --verbose # Run with detailed output
 *   npm run verify:migration -- --json    # Output report as JSON
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  ScanCommand,
  QueryCommand,
  GetCommand
} from '@aws-sdk/lib-dynamodb';
import * as fs from 'fs';
import * as path from 'path';

// Configure DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Table names
const EVENTS_TABLE = process.env.EVENTS_TABLE || 'Events';
const QUESTIONS_TABLE = process.env.QUESTIONS_TABLE || 'Questions';
const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE || 'Activities';
const POLL_VOTES_TABLE = process.env.POLL_VOTES_TABLE || 'PollVotes';
const RAFFLE_ENTRIES_TABLE = process.env.RAFFLE_ENTRIES_TABLE || 'RaffleEntries';

interface VerificationReport {
  timestamp: string;
  success: boolean;
  summary: {
    totalEvents: number;
    totalActivities: number;
    totalQuestions: number;
    eventsWithActivities: number;
    eventsWithoutActivities: number;
    questionsWithActivityId: number;
    questionsWithoutActivityId: number;
    orphanedQuestions: number;
    eventsWithActiveActivityId: number;
    eventsWithoutActiveActivityId: number;
  };
  errors: VerificationError[];
  warnings: VerificationWarning[];
  details: {
    eventsWithoutActivities: EventDetail[];
    questionsWithoutActivityId: QuestionDetail[];
    orphanedQuestions: QuestionDetail[];
    invalidActivityReferences: InvalidReference[];
  };
}

interface VerificationError {
  type: string;
  message: string;
  details?: any;
}

interface VerificationWarning {
  type: string;
  message: string;
  details?: any;
}

interface EventDetail {
  eventId: string;
  name: string;
  status: string;
}

interface QuestionDetail {
  questionId: string;
  eventId: string;
  activityId?: string;
  text: string;
}

interface InvalidReference {
  questionId: string;
  eventId: string;
  activityId: string;
  reason: string;
}

const verbose = process.argv.includes('--verbose');
const jsonOutput = process.argv.includes('--json');

/**
 * Log message if verbose mode is enabled
 */
function verboseLog(message: string): void {
  if (verbose && !jsonOutput) {
    console.log(message);
  }
}

/**
 * Get all events from the database
 */
async function getAllEvents(): Promise<any[]> {
  verboseLog('Scanning Events table...');
  
  const command = new ScanCommand({
    TableName: EVENTS_TABLE,
  });

  const result = await docClient.send(command);
  return result.Items || [];
}

/**
 * Get all activities from the database
 */
async function getAllActivities(): Promise<any[]> {
  verboseLog('Scanning Activities table...');
  
  const command = new ScanCommand({
    TableName: ACTIVITIES_TABLE,
  });

  const result = await docClient.send(command);
  return result.Items || [];
}

/**
 * Get all questions from the database
 */
async function getAllQuestions(): Promise<any[]> {
  verboseLog('Scanning Questions table...');
  
  const command = new ScanCommand({
    TableName: QUESTIONS_TABLE,
  });

  const result = await docClient.send(command);
  return result.Items || [];
}

/**
 * Get activities for a specific event
 */
async function getActivitiesForEvent(eventId: string): Promise<any[]> {
  const command = new QueryCommand({
    TableName: ACTIVITIES_TABLE,
    IndexName: 'eventId-order-index',
    KeyConditionExpression: 'eventId = :eventId',
    ExpressionAttributeValues: {
      ':eventId': eventId,
    },
  });

  const result = await docClient.send(command);
  return result.Items || [];
}

/**
 * Verify that all events have corresponding activities
 */
async function verifyEventsHaveActivities(
  events: any[],
  activities: any[]
): Promise<{
  eventsWithActivities: number;
  eventsWithoutActivities: EventDetail[];
  errors: VerificationError[];
}> {
  verboseLog('\nVerifying all events have activities...');
  
  const eventsWithoutActivities: EventDetail[] = [];
  const errors: VerificationError[] = [];
  let eventsWithActivities = 0;

  // Create a map of eventId to activities
  const activityMap = new Map<string, any[]>();
  for (const activity of activities) {
    if (!activityMap.has(activity.eventId)) {
      activityMap.set(activity.eventId, []);
    }
    activityMap.get(activity.eventId)!.push(activity);
  }

  for (const event of events) {
    const eventActivities = activityMap.get(event.eventId) || [];
    
    if (eventActivities.length === 0) {
      eventsWithoutActivities.push({
        eventId: event.eventId,
        name: event.name || 'Unnamed Event',
        status: event.status || 'unknown',
      });
      
      errors.push({
        type: 'MISSING_ACTIVITIES',
        message: `Event ${event.eventId} (${event.name}) has no activities`,
        details: { eventId: event.eventId, eventName: event.name },
      });
      
      verboseLog(`  ✗ Event ${event.eventId} has no activities`);
    } else {
      eventsWithActivities++;
      verboseLog(`  ✓ Event ${event.eventId} has ${eventActivities.length} activity(ies)`);
    }
  }

  return {
    eventsWithActivities,
    eventsWithoutActivities,
    errors,
  };
}

/**
 * Verify that all questions reference valid activityIds
 */
async function verifyQuestionsHaveActivityIds(
  questions: any[],
  activities: any[]
): Promise<{
  questionsWithActivityId: number;
  questionsWithoutActivityId: QuestionDetail[];
  orphanedQuestions: QuestionDetail[];
  invalidReferences: InvalidReference[];
  errors: VerificationError[];
  warnings: VerificationWarning[];
}> {
  verboseLog('\nVerifying all questions have valid activityIds...');
  
  const questionsWithoutActivityId: QuestionDetail[] = [];
  const orphanedQuestions: QuestionDetail[] = [];
  const invalidReferences: InvalidReference[] = [];
  const errors: VerificationError[] = [];
  const warnings: VerificationWarning[] = [];
  let questionsWithActivityId = 0;

  // Create a set of valid activityIds
  const validActivityIds = new Set(activities.map(a => a.activityId));

  for (const question of questions) {
    if (!question.activityId) {
      questionsWithoutActivityId.push({
        questionId: question.questionId,
        eventId: question.eventId,
        text: question.text || 'No text',
      });
      
      errors.push({
        type: 'MISSING_ACTIVITY_ID',
        message: `Question ${question.questionId} missing activityId field`,
        details: { 
          questionId: question.questionId, 
          eventId: question.eventId,
          text: question.text 
        },
      });
      
      verboseLog(`  ✗ Question ${question.questionId} missing activityId`);
    } else if (!validActivityIds.has(question.activityId)) {
      orphanedQuestions.push({
        questionId: question.questionId,
        eventId: question.eventId,
        activityId: question.activityId,
        text: question.text || 'No text',
      });
      
      invalidReferences.push({
        questionId: question.questionId,
        eventId: question.eventId,
        activityId: question.activityId,
        reason: 'Activity does not exist',
      });
      
      errors.push({
        type: 'INVALID_ACTIVITY_REFERENCE',
        message: `Question ${question.questionId} references non-existent activity ${question.activityId}`,
        details: { 
          questionId: question.questionId, 
          eventId: question.eventId,
          activityId: question.activityId 
        },
      });
      
      verboseLog(`  ✗ Question ${question.questionId} references invalid activity ${question.activityId}`);
    } else {
      questionsWithActivityId++;
      verboseLog(`  ✓ Question ${question.questionId} has valid activityId ${question.activityId}`);
    }
  }

  return {
    questionsWithActivityId,
    questionsWithoutActivityId,
    orphanedQuestions,
    invalidReferences,
    errors,
    warnings,
  };
}

/**
 * Verify that events have activeActivityId field
 */
async function verifyEventsHaveActiveActivityIdField(
  events: any[]
): Promise<{
  eventsWithActiveActivityId: number;
  eventsWithoutActiveActivityId: number;
  warnings: VerificationWarning[];
}> {
  verboseLog('\nVerifying events have activeActivityId field...');
  
  const warnings: VerificationWarning[] = [];
  let eventsWithActiveActivityId = 0;
  let eventsWithoutActiveActivityId = 0;

  for (const event of events) {
    if (event.activeActivityId === undefined) {
      eventsWithoutActiveActivityId++;
      
      warnings.push({
        type: 'MISSING_ACTIVE_ACTIVITY_ID_FIELD',
        message: `Event ${event.eventId} missing activeActivityId field`,
        details: { eventId: event.eventId, eventName: event.name },
      });
      
      verboseLog(`  ⚠ Event ${event.eventId} missing activeActivityId field`);
    } else {
      eventsWithActiveActivityId++;
      verboseLog(`  ✓ Event ${event.eventId} has activeActivityId field (value: ${event.activeActivityId || 'null'})`);
    }
  }

  return {
    eventsWithActiveActivityId,
    eventsWithoutActiveActivityId,
    warnings,
  };
}

/**
 * Verify data integrity - check for data loss
 */
async function verifyDataIntegrity(
  events: any[],
  activities: any[],
  questions: any[]
): Promise<{
  warnings: VerificationWarning[];
}> {
  verboseLog('\nVerifying data integrity...');
  
  const warnings: VerificationWarning[] = [];

  // Check for events with no questions
  for (const event of events) {
    const eventQuestions = questions.filter(q => q.eventId === event.eventId);
    const eventActivities = activities.filter(a => a.eventId === event.eventId);
    
    if (eventQuestions.length === 0 && eventActivities.length > 0) {
      const quizActivities = eventActivities.filter(a => a.type === 'quiz');
      if (quizActivities.length > 0) {
        warnings.push({
          type: 'QUIZ_WITHOUT_QUESTIONS',
          message: `Event ${event.eventId} has quiz activity but no questions`,
          details: { 
            eventId: event.eventId, 
            eventName: event.name,
            activityCount: eventActivities.length 
          },
        });
        
        verboseLog(`  ⚠ Event ${event.eventId} has quiz activity but no questions`);
      }
    }
  }

  // Check for activities with mismatched question counts
  for (const activity of activities) {
    if (activity.type === 'quiz' && activity.questions) {
      const dbQuestions = questions.filter(q => q.activityId === activity.activityId);
      
      if (activity.questions.length !== dbQuestions.length) {
        warnings.push({
          type: 'QUESTION_COUNT_MISMATCH',
          message: `Activity ${activity.activityId} has ${activity.questions.length} questions in config but ${dbQuestions.length} in database`,
          details: { 
            activityId: activity.activityId,
            configCount: activity.questions.length,
            dbCount: dbQuestions.length 
          },
        });
        
        verboseLog(`  ⚠ Activity ${activity.activityId} question count mismatch: ${activity.questions.length} vs ${dbQuestions.length}`);
      }
    }
  }

  return { warnings };
}

/**
 * Generate and save verification report
 */
function generateReport(
  events: any[],
  activities: any[],
  questions: any[],
  verificationResults: any
): VerificationReport {
  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    success: verificationResults.errors.length === 0,
    summary: {
      totalEvents: events.length,
      totalActivities: activities.length,
      totalQuestions: questions.length,
      eventsWithActivities: verificationResults.eventsWithActivities,
      eventsWithoutActivities: verificationResults.eventsWithoutActivities.length,
      questionsWithActivityId: verificationResults.questionsWithActivityId,
      questionsWithoutActivityId: verificationResults.questionsWithoutActivityId.length,
      orphanedQuestions: verificationResults.orphanedQuestions.length,
      eventsWithActiveActivityId: verificationResults.eventsWithActiveActivityId,
      eventsWithoutActiveActivityId: verificationResults.eventsWithoutActiveActivityId,
    },
    errors: verificationResults.errors,
    warnings: verificationResults.warnings,
    details: {
      eventsWithoutActivities: verificationResults.eventsWithoutActivities,
      questionsWithoutActivityId: verificationResults.questionsWithoutActivityId,
      orphanedQuestions: verificationResults.orphanedQuestions,
      invalidActivityReferences: verificationResults.invalidReferences,
    },
  };

  return report;
}

/**
 * Save report to file
 */
function saveReport(report: VerificationReport): string {
  const reportsDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = report.timestamp.replace(/[:.]/g, '-');
  const reportFile = path.join(reportsDir, `verification-report-${timestamp}.json`);
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  return reportFile;
}

/**
 * Print report to console
 */
function printReport(report: VerificationReport): void {
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION VERIFICATION REPORT');
  console.log('='.repeat(60));
  console.log(`\nTimestamp: ${report.timestamp}`);
  console.log(`Status: ${report.success ? '✓ PASSED' : '✗ FAILED'}`);
  
  console.log('\n' + '-'.repeat(60));
  console.log('SUMMARY');
  console.log('-'.repeat(60));
  console.log(`Total Events:                    ${report.summary.totalEvents}`);
  console.log(`Total Activities:                ${report.summary.totalActivities}`);
  console.log(`Total Questions:                 ${report.summary.totalQuestions}`);
  console.log(`\nEvents with Activities:          ${report.summary.eventsWithActivities}`);
  console.log(`Events without Activities:       ${report.summary.eventsWithoutActivities}`);
  console.log(`\nQuestions with activityId:       ${report.summary.questionsWithActivityId}`);
  console.log(`Questions without activityId:    ${report.summary.questionsWithoutActivityId}`);
  console.log(`Orphaned Questions:              ${report.summary.orphanedQuestions}`);
  console.log(`\nEvents with activeActivityId:    ${report.summary.eventsWithActiveActivityId}`);
  console.log(`Events without activeActivityId: ${report.summary.eventsWithoutActiveActivityId}`);
  
  if (report.errors.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log(`ERRORS (${report.errors.length})`);
    console.log('-'.repeat(60));
    
    const errorsByType = new Map<string, VerificationError[]>();
    for (const error of report.errors) {
      if (!errorsByType.has(error.type)) {
        errorsByType.set(error.type, []);
      }
      errorsByType.get(error.type)!.push(error);
    }
    
    for (const [type, errors] of errorsByType) {
      console.log(`\n${type} (${errors.length}):`);
      for (const error of errors.slice(0, 5)) {
        console.log(`  ✗ ${error.message}`);
      }
      if (errors.length > 5) {
        console.log(`  ... and ${errors.length - 5} more`);
      }
    }
  }
  
  if (report.warnings.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log(`WARNINGS (${report.warnings.length})`);
    console.log('-'.repeat(60));
    
    const warningsByType = new Map<string, VerificationWarning[]>();
    for (const warning of report.warnings) {
      if (!warningsByType.has(warning.type)) {
        warningsByType.set(warning.type, []);
      }
      warningsByType.get(warning.type)!.push(warning);
    }
    
    for (const [type, warnings] of warningsByType) {
      console.log(`\n${type} (${warnings.length}):`);
      for (const warning of warnings.slice(0, 5)) {
        console.log(`  ⚠ ${warning.message}`);
      }
      if (warnings.length > 5) {
        console.log(`  ... and ${warnings.length - 5} more`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (report.success) {
    console.log('✓ VERIFICATION PASSED');
    console.log('All migration checks completed successfully.');
  } else {
    console.log('✗ VERIFICATION FAILED');
    console.log(`Found ${report.errors.length} error(s) and ${report.warnings.length} warning(s).`);
    console.log('Please review the errors above and fix any issues.');
  }
  
  console.log('='.repeat(60) + '\n');
}

/**
 * Main verification function
 */
async function verify(): Promise<void> {
  try {
    if (!jsonOutput) {
      console.log('=== Migration Verification ===\n');
      console.log(`Events Table: ${EVENTS_TABLE}`);
      console.log(`Activities Table: ${ACTIVITIES_TABLE}`);
      console.log(`Questions Table: ${QUESTIONS_TABLE}`);
      console.log(`Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);
    }

    // Fetch all data
    const events = await getAllEvents();
    const activities = await getAllActivities();
    const questions = await getAllQuestions();

    if (!jsonOutput) {
      console.log(`Found ${events.length} events, ${activities.length} activities, ${questions.length} questions\n`);
    }

    // Run verification checks
    const eventsCheck = await verifyEventsHaveActivities(events, activities);
    const questionsCheck = await verifyQuestionsHaveActivityIds(questions, activities);
    const activeActivityCheck = await verifyEventsHaveActiveActivityIdField(events);
    const integrityCheck = await verifyDataIntegrity(events, activities, questions);

    // Combine all results
    const verificationResults = {
      eventsWithActivities: eventsCheck.eventsWithActivities,
      eventsWithoutActivities: eventsCheck.eventsWithoutActivities,
      questionsWithActivityId: questionsCheck.questionsWithActivityId,
      questionsWithoutActivityId: questionsCheck.questionsWithoutActivityId,
      orphanedQuestions: questionsCheck.orphanedQuestions,
      invalidReferences: questionsCheck.invalidReferences,
      eventsWithActiveActivityId: activeActivityCheck.eventsWithActiveActivityId,
      eventsWithoutActiveActivityId: activeActivityCheck.eventsWithoutActiveActivityId,
      errors: [
        ...eventsCheck.errors,
        ...questionsCheck.errors,
      ],
      warnings: [
        ...questionsCheck.warnings,
        ...activeActivityCheck.warnings,
        ...integrityCheck.warnings,
      ],
    };

    // Generate report
    const report = generateReport(events, activities, questions, verificationResults);

    // Save report to file
    const reportFile = saveReport(report);
    
    // Print report
    printReport(report);

    if (!jsonOutput) {
      console.log(`Report saved to: ${reportFile}\n`);
    }

    // Exit with appropriate code
    process.exit(report.success ? 0 : 1);
  } catch (error) {
    console.error('\n✗ Verification failed:', error);
    process.exit(1);
  }
}

// Run verification
verify().catch(console.error);
