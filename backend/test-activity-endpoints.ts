/**
 * Manual test script for activity endpoints
 * Run with: npx tsx test-activity-endpoints.ts
 */

const BASE_URL = 'http://localhost:3001';

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
  } catch (error) {
    results.push({ name, passed: false, error: (error as Error).message });
    console.log(`✗ ${name}: ${(error as Error).message}`);
  }
}

async function main() {
  console.log('Testing Activity API Endpoints...\n');

  // Test 1: Create an event first
  let eventId: string;
  let activityId: string;

  await testEndpoint('Create event', async () => {
    const response = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Event for Activities',
        organizerId: 'test-organizer-123',
        visibility: 'private',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    eventId = data.eventId;
    
    if (!eventId) {
      throw new Error('No eventId returned');
    }
  });

  // Test 2: Create a quiz activity
  await testEndpoint('POST /api/events/:eventId/activities - Create quiz activity', async () => {
    const response = await fetch(`${BASE_URL}/api/events/${eventId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Quiz Activity',
        type: 'quiz',
        scoringEnabled: true,
        speedBonusEnabled: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    activityId = data.activityId;
    
    if (!activityId) {
      throw new Error('No activityId returned');
    }
  });

  // Test 3: List activities for event
  await testEndpoint('GET /api/events/:eventId/activities - List activities', async () => {
    const response = await fetch(`${BASE_URL}/api/events/${eventId}/activities`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (!data.activities || !Array.isArray(data.activities)) {
      throw new Error('No activities array returned');
    }

    if (data.activities.length === 0) {
      throw new Error('Expected at least one activity');
    }
  });

  // Test 4: Get activity details
  await testEndpoint('GET /api/activities/:activityId - Get activity details', async () => {
    const response = await fetch(`${BASE_URL}/api/activities/${activityId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (!data.activity) {
      throw new Error('No activity returned');
    }

    if (data.activity.activityId !== activityId) {
      throw new Error('Wrong activity returned');
    }
  });

  // Test 5: Update activity
  await testEndpoint('PUT /api/activities/:activityId - Update activity', async () => {
    const response = await fetch(`${BASE_URL}/api/activities/${activityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Updated Quiz Activity',
        status: 'ready',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Update failed');
    }
  });

  // Test 6: Activate activity
  await testEndpoint('POST /api/activities/:activityId/activate - Activate activity', async () => {
    const response = await fetch(`${BASE_URL}/api/activities/${activityId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Activation failed');
    }
  });

  // Test 7: Deactivate activity
  await testEndpoint('POST /api/activities/:activityId/deactivate - Deactivate activity', async () => {
    const response = await fetch(`${BASE_URL}/api/activities/${activityId}/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Deactivation failed');
    }
  });

  // Test 8: Delete activity
  await testEndpoint('DELETE /api/activities/:activityId - Delete activity', async () => {
    const response = await fetch(`${BASE_URL}/api/activities/${activityId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Deletion failed');
    }
  });

  // Test 9: Create poll activity
  await testEndpoint('Create poll activity', async () => {
    const response = await fetch(`${BASE_URL}/api/events/${eventId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Poll Activity',
        type: 'poll',
        question: 'What is your favorite color?',
        options: ['Red', 'Blue', 'Green'],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (!data.activityId) {
      throw new Error('No activityId returned');
    }
  });

  // Test 10: Create raffle activity
  await testEndpoint('Create raffle activity', async () => {
    const response = await fetch(`${BASE_URL}/api/events/${eventId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Raffle Activity',
        type: 'raffle',
        prizeDescription: 'Grand Prize',
        winnerCount: 3,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (!data.activityId) {
      throw new Error('No activityId returned');
    }
  });

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
