/**
 * Test script to check activities API
 */

const API_BASE_URL = 'https://d15swf38ljbkja.cloudfront.net/api';
const EVENT_ID = '0eb9fc73-19e6-40b1-b675-a60e07502b68'; // Your Test event

async function testActivitiesAPI() {
  console.log('\n=== Testing Activities API ===');
  console.log(`API: ${API_BASE_URL}`);
  console.log(`Event ID: ${EVENT_ID}`);
  
  try {
    console.log('\n1. Fetching activities for event...');
    const response = await fetch(`${API_BASE_URL}/events/${EVENT_ID}/activities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-organizer-id': 'demo-organizer-123',
      },
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('\n2. Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Activities loaded successfully!');
      if (data.activities && data.activities.length > 0) {
        console.log(`\n📋 Found ${data.activities.length} activities:`);
        data.activities.forEach((activity: any, idx: number) => {
          console.log(`   ${idx + 1}. ${activity.name} (${activity.type}) - ${activity.status}`);
        });
      } else {
        console.log('\n⚠️  No activities found for this event');
      }
    } else {
      console.log('\n❌ Failed to load activities');
      console.log(`   Error: ${data.message || data.error}`);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testActivitiesAPI();
