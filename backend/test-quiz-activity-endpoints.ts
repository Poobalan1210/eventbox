/**
 * Test script for quiz activity API endpoints
 * Tests the new activity-based question management endpoints
 */

const BASE_URL = 'http://localhost:3001/api';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function testEndpoint(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.error(`✗ ${name}: ${error.message}`);
  }
}

async function runTests() {
  console.log('Testing Quiz Activity API Endpoints\n');

  let eventId: string;
  let activityId: string;
  let questionId: string;

  // Test 1: Create an event
  await testEndpoint('Create event', async () => {
    const response = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Event for Quiz Activity',
        organizerId: 'test-organizer',
        visibility: 'private',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }

    const data = await response.json();
    eventId = data.eventId;
    console.log(`  Created event: ${eventId}`);
  });

  // Test 2: Create a quiz activity
  await testEndpoint('Create quiz activity', async () => {
    const response = await fetch(`${BASE_URL}/events/${eventId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Quiz Activity',
        type: 'quiz',
        scoringEnabled: true,
        speedBonusEnabled: true,
        streakTrackingEnabled: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create activity: ${response.statusText}`);
    }

    const data = await response.json();
    activityId = data.activityId;
    console.log(`  Created activity: ${activityId}`);
  });

  // Test 3: Add a question to the quiz activity
  await testEndpoint('Add question to quiz activity', async () => {
    const response = await fetch(`${BASE_URL}/activities/${activityId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'What is 2 + 2?',
        options: [
          { id: 'opt1', text: '3' },
          { id: 'opt2', text: '4' },
          { id: 'opt3', text: '5' },
          { id: 'opt4', text: '6' },
        ],
        correctOptionId: 'opt2',
        timerSeconds: 30,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add question: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    questionId = data.questionId;
    console.log(`  Added question: ${questionId}`);
  });

  // Test 4: Get all questions for the activity
  await testEndpoint('Get questions for quiz activity', async () => {
    const response = await fetch(`${BASE_URL}/activities/${activityId}/questions`);

    if (!response.ok) {
      throw new Error(`Failed to get questions: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.questions || data.questions.length !== 1) {
      throw new Error(`Expected 1 question, got ${data.questions?.length || 0}`);
    }
    console.log(`  Retrieved ${data.questions.length} question(s)`);
  });

  // Test 5: Update the question
  await testEndpoint('Update question in quiz activity', async () => {
    const response = await fetch(`${BASE_URL}/activities/${activityId}/questions/${questionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'What is 3 + 3?',
        options: [
          { id: 'opt1', text: '5' },
          { id: 'opt2', text: '6' },
          { id: 'opt3', text: '7' },
          { id: 'opt4', text: '8' },
        ],
        correctOptionId: 'opt2',
        timerSeconds: 25,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update question: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('Update did not return success');
    }
    console.log(`  Updated question successfully`);
  });

  // Test 6: Try to add question to non-quiz activity (should fail)
  await testEndpoint('Reject adding question to non-quiz activity', async () => {
    // First create a poll activity
    const pollResponse = await fetch(`${BASE_URL}/events/${eventId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Poll',
        type: 'poll',
        question: 'Test poll question?',
        options: ['Option 1', 'Option 2'],
      }),
    });

    const pollData = await pollResponse.json();
    const pollActivityId = pollData.activityId;

    // Try to add a question to the poll activity
    const response = await fetch(`${BASE_URL}/activities/${pollActivityId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'This should fail',
        options: [
          { id: 'opt1', text: 'A' },
          { id: 'opt2', text: 'B' },
        ],
        correctOptionId: 'opt1',
      }),
    });

    if (response.ok) {
      throw new Error('Should have rejected adding question to poll activity');
    }

    if (response.status !== 400) {
      throw new Error(`Expected 400 status, got ${response.status}`);
    }

    console.log(`  Correctly rejected with status 400`);
  });

  // Test 7: Delete the question
  await testEndpoint('Delete question from quiz activity', async () => {
    const response = await fetch(`${BASE_URL}/activities/${activityId}/questions/${questionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete question: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('Delete did not return success');
    }
    console.log(`  Deleted question successfully`);
  });

  // Test 8: Verify question was deleted
  await testEndpoint('Verify question was deleted', async () => {
    const response = await fetch(`${BASE_URL}/activities/${activityId}/questions`);

    if (!response.ok) {
      throw new Error(`Failed to get questions: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.questions.length !== 0) {
      throw new Error(`Expected 0 questions, got ${data.questions.length}`);
    }
    console.log(`  Verified question list is empty`);
  });

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary');
  console.log('='.repeat(50));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
