/**
 * Test script to get a specific activity
 */

const API_BASE_URL = 'https://d15swf38ljbkja.cloudfront.net/api';
const ACTIVITY_ID = 'd8b8404e-f3cd-40bb-9249-a782115d8551'; // The "prize" raffle

async function testGetActivity() {
  console.log('\n=== Testing Get Activity API ===');
  console.log(`API: ${API_BASE_URL}`);
  console.log(`Activity ID: ${ACTIVITY_ID}`);
  
  try {
    console.log('\n1. Fetching activity...');
    const response = await fetch(`${API_BASE_URL}/activities/${ACTIVITY_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('\n2. Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Activity loaded successfully!');
    } else {
      console.log('\n❌ Failed to load activity');
      console.log(`   Error: ${data.message || data.error}`);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testGetActivity();
