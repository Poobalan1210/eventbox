/**
 * Manual test script for raffle activity API endpoints
 * 
 * This script tests the complete raffle workflow:
 * 1. Create an event
 * 2. Create a raffle activity
 * 3. Configure the raffle
 * 4. Start the raffle
 * 5. Add entries
 * 6. Draw winners
 * 7. End the raffle
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

interface ApiResponse {
  ok: boolean;
  status: number;
  data?: any;
  error?: string;
}

async function apiRequest(
  method: string,
  path: string,
  body?: any
): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? data : undefined,
      error: !response.ok ? data.message || data.error : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testRaffleWorkflow() {
  console.log('🎯 Testing Raffle Activity API Endpoints\n');

  // Step 1: Create an event
  console.log('1️⃣  Creating event...');
  const createEventResponse = await apiRequest('POST', '/api/events', {
    name: 'Raffle Test Event',
    organizerId: 'test-organizer-' + Date.now(),
    visibility: 'private',
  });

  if (!createEventResponse.ok) {
    console.error('❌ Failed to create event:', createEventResponse.error);
    return;
  }

  const eventId = createEventResponse.data.eventId;
  console.log('✅ Event created:', eventId);
  console.log('   Game PIN:', createEventResponse.data.gamePin);
  console.log();

  // Step 2: Create a raffle activity
  console.log('2️⃣  Creating raffle activity...');
  const createActivityResponse = await apiRequest(
    'POST',
    `/api/events/${eventId}/activities`,
    {
      name: 'Grand Prize Raffle',
      type: 'raffle',
    }
  );

  if (!createActivityResponse.ok) {
    console.error('❌ Failed to create activity:', createActivityResponse.error);
    return;
  }

  const activityId = createActivityResponse.data.activityId;
  console.log('✅ Raffle activity created:', activityId);
  console.log();

  // Step 3: Configure the raffle
  console.log('3️⃣  Configuring raffle...');
  const configureResponse = await apiRequest(
    'POST',
    `/api/activities/${activityId}/configure-raffle`,
    {
      prizeDescription: 'iPad Pro 12.9-inch with Apple Pencil',
      entryMethod: 'manual',
      winnerCount: 3,
    }
  );

  if (!configureResponse.ok) {
    console.error('❌ Failed to configure raffle:', configureResponse.error);
    return;
  }

  console.log('✅ Raffle configured');
  console.log('   Prize: iPad Pro 12.9-inch with Apple Pencil');
  console.log('   Entry Method: manual');
  console.log('   Winner Count: 3');
  console.log();

  // Step 4: Start the raffle
  console.log('4️⃣  Starting raffle...');
  const startResponse = await apiRequest(
    'POST',
    `/api/activities/${activityId}/start-raffle`
  );

  if (!startResponse.ok) {
    console.error('❌ Failed to start raffle:', startResponse.error);
    return;
  }

  console.log('✅ Raffle started');
  console.log();

  // Step 5: Add entries
  console.log('5️⃣  Adding raffle entries...');
  const participants = [
    { id: 'p1', name: 'Alice Johnson' },
    { id: 'p2', name: 'Bob Smith' },
    { id: 'p3', name: 'Charlie Brown' },
    { id: 'p4', name: 'Diana Prince' },
    { id: 'p5', name: 'Eve Wilson' },
    { id: 'p6', name: 'Frank Miller' },
    { id: 'p7', name: 'Grace Lee' },
    { id: 'p8', name: 'Henry Davis' },
  ];

  for (const participant of participants) {
    const enterResponse = await apiRequest(
      'POST',
      `/api/activities/${activityId}/enter`,
      {
        participantId: participant.id,
        participantName: participant.name,
      }
    );

    if (!enterResponse.ok) {
      console.error(`❌ Failed to enter ${participant.name}:`, enterResponse.error);
    } else {
      console.log(`✅ ${participant.name} entered the raffle`);
    }
  }
  console.log();

  // Step 6: Test duplicate entry (should fail)
  console.log('6️⃣  Testing duplicate entry prevention...');
  const duplicateResponse = await apiRequest(
    'POST',
    `/api/activities/${activityId}/enter`,
    {
      participantId: 'p1',
      participantName: 'Alice Johnson',
    }
  );

  if (!duplicateResponse.ok) {
    console.log('✅ Duplicate entry correctly rejected:', duplicateResponse.error);
  } else {
    console.error('❌ Duplicate entry should have been rejected');
  }
  console.log();

  // Step 7: Draw winners
  console.log('7️⃣  Drawing winners...');
  const drawResponse = await apiRequest(
    'POST',
    `/api/activities/${activityId}/draw-winners`,
    {
      count: 3,
    }
  );

  if (!drawResponse.ok) {
    console.error('❌ Failed to draw winners:', drawResponse.error);
    return;
  }

  console.log('✅ Winners drawn:');
  drawResponse.data.winners.forEach((winner: any, index: number) => {
    console.log(`   ${index + 1}. ${winner.participantName} (${winner.participantId})`);
  });
  console.log();

  // Step 8: End the raffle
  console.log('8️⃣  Ending raffle...');
  const endResponse = await apiRequest(
    'POST',
    `/api/activities/${activityId}/end-raffle`
  );

  if (!endResponse.ok) {
    console.error('❌ Failed to end raffle:', endResponse.error);
    return;
  }

  console.log('✅ Raffle ended');
  console.log('   Final Results:');
  console.log('   - Total Entries:', endResponse.data.results.totalEntries);
  console.log('   - Winner Count:', endResponse.data.results.winnerCount);
  console.log('   - Prize:', endResponse.data.results.prizeDescription);
  console.log('   - Winners:');
  endResponse.data.results.winners.forEach((winner: any, index: number) => {
    console.log(`     ${index + 1}. ${winner.participantName}`);
  });
  console.log();

  console.log('🎉 All raffle endpoint tests completed successfully!');
}

// Run the tests
testRaffleWorkflow().catch(console.error);
