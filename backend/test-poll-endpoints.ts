/**
 * Manual test script for poll activity endpoints
 * Run with: npx tsx test-poll-endpoints.ts
 */

const API_BASE = 'http://localhost:3000/api';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  method: string,
  url: string,
  body?: any
): Promise<any> {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`${response.status}: ${data.message || data.error}`);
    }

    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
    return data;
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.log(`✗ ${name}: ${error.message}`);
    throw error;
  }
}

async function runTests() {
  console.log('Testing Poll Activity Endpoints\n');
  console.log('Note: This requires the backend server to be running');
  console.log('and a test event/activity to exist.\n');

  let eventId: string;
  let activityId: string;
  let participantId = 'test-participant-' + Date.now();

  try {
    // Step 1: Create a test event
    console.log('Step 1: Creating test event...');
    const eventResponse = await testEndpoint(
      'Create Event',
      'POST',
      `${API_BASE}/events`,
      {
        name: 'Poll Test Event',
        organizerId: 'test-organizer',
        visibility: 'private',
      }
    );
    eventId = eventResponse.eventId;
    console.log(`  Event ID: ${eventId}\n`);

    // Step 2: Create a poll activity
    console.log('Step 2: Creating poll activity...');
    const activityResponse = await testEndpoint(
      'Create Poll Activity',
      'POST',
      `${API_BASE}/events/${eventId}/activities`,
      {
        name: 'Test Poll',
        type: 'poll',
        allowMultipleVotes: false,
        showResultsLive: true,
      }
    );
    activityId = activityResponse.activityId;
    console.log(`  Activity ID: ${activityId}\n`);

    // Step 3: Configure the poll
    console.log('Step 3: Configuring poll...');
    await testEndpoint(
      'Configure Poll',
      'POST',
      `${API_BASE}/activities/${activityId}/configure-poll`,
      {
        question: 'What is your favorite programming language?',
        options: ['JavaScript', 'Python', 'TypeScript', 'Go'],
      }
    );
    console.log('  Poll configured\n');

    // Step 4: Start the poll
    console.log('Step 4: Starting poll...');
    await testEndpoint(
      'Start Poll',
      'POST',
      `${API_BASE}/activities/${activityId}/start-poll`
    );
    console.log('  Poll started\n');

    // Step 5: Submit a vote
    console.log('Step 5: Submitting vote...');
    await testEndpoint(
      'Submit Vote',
      'POST',
      `${API_BASE}/activities/${activityId}/vote`,
      {
        participantId,
        optionIds: ['option-2-*'], // TypeScript (will need to get actual option ID)
      }
    );
    console.log('  Vote submitted\n');

    // Step 6: Get poll results
    console.log('Step 6: Getting poll results...');
    const resultsResponse = await testEndpoint(
      'Get Poll Results',
      'GET',
      `${API_BASE}/activities/${activityId}/poll-results`
    );
    console.log('  Results:', JSON.stringify(resultsResponse.results, null, 2));
    console.log('');

    // Step 7: End the poll
    console.log('Step 7: Ending poll...');
    const endResponse = await testEndpoint(
      'End Poll',
      'POST',
      `${API_BASE}/activities/${activityId}/end-poll`
    );
    console.log('  Final Results:', JSON.stringify(endResponse.results, null, 2));
    console.log('');

    // Test error cases
    console.log('Step 8: Testing error cases...');

    // Try to vote again (should fail - duplicate vote)
    try {
      await testEndpoint(
        'Duplicate Vote (should fail)',
        'POST',
        `${API_BASE}/activities/${activityId}/vote`,
        {
          participantId,
          optionIds: ['option-0-*'],
        }
      );
    } catch (error) {
      console.log('  Expected error caught: duplicate vote\n');
    }

    // Try to start poll again (should fail - already completed)
    try {
      await testEndpoint(
        'Start Completed Poll (should fail)',
        'POST',
        `${API_BASE}/activities/${activityId}/start-poll`
      );
    } catch (error) {
      console.log('  Expected error caught: poll already completed\n');
    }

    console.log('\n=== Test Summary ===');
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${results.length}`);

    if (failed === 0) {
      console.log('\n✓ All tests passed!');
    } else {
      console.log('\n✗ Some tests failed:');
      results
        .filter((r) => !r.passed)
        .forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
    }
  } catch (error: any) {
    console.error('\n✗ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('Error: Backend server is not running on http://localhost:3000');
    console.error('Please start the server first with: npm run dev');
    process.exit(1);
  }

  await runTests();
}

main();
