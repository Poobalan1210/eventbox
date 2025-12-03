/**
 * Test poll results API
 */

const API_BASE_URL = 'https://d15swf38ljbkja.cloudfront.net/api';

// First, let's find a poll activity
async function testPollResults() {
  console.log('\n=== Testing Poll Results ===');
  
  try {
    // Get the test event
    const EVENT_ID = 'f8c72ab5-7bb8-4044-94b0-ab1226995786';
    
    console.log('\n1. Fetching activities...');
    const activitiesResponse = await fetch(`${API_BASE_URL}/events/${EVENT_ID}/activities`, {
      headers: {
        'x-organizer-id': 'demo-organizer-123',
      },
    });
    
    if (!activitiesResponse.ok) {
      console.log('❌ Failed to fetch activities');
      return;
    }
    
    const activitiesData = await activitiesResponse.json();
    console.log(`Total activities: ${activitiesData.activities.length}`);
    activitiesData.activities.forEach((a: any) => {
      console.log(`  - ${a.name} (${a.type}, ${a.status})`);
    });
    
    const polls = activitiesData.activities.filter((a: any) => a.type === 'poll');
    
    console.log(`\nFound ${polls.length} poll(s)`);
    
    if (polls.length === 0) {
      console.log('No polls found - you need to create a poll activity first');
      return;
    }
    
    const poll = polls[0];
    console.log(`\n2. Testing poll: ${poll.name} (${poll.activityId})`);
    console.log(`   Status: ${poll.status}`);
    
    // Fetch poll results
    console.log('\n3. Fetching poll results...');
    const resultsResponse = await fetch(`${API_BASE_URL}/activities/${poll.activityId}/poll-results`);
    
    console.log(`   Status: ${resultsResponse.status} ${resultsResponse.statusText}`);
    
    const resultsData = await resultsResponse.json();
    console.log('\n4. Results:');
    console.log(JSON.stringify(resultsData, null, 2));
    
    if (resultsResponse.ok) {
      console.log('\n✅ Poll results loaded successfully!');
    } else {
      console.log('\n❌ Failed to load poll results');
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testPollResults();
