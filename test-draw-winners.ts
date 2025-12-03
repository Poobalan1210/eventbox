/**
 * Test script to call the draw winners API
 */

const API_BASE_URL = process.env.API_BASE_URL || 'https://d15swf38ljbkja.cloudfront.net/api';
const ACTIVITY_ID = '391f6186-8432-4704-b599-3d322dfb2da6';

async function testDrawWinners() {
  console.log('\n=== Testing Draw Winners API ===');
  console.log(`API: ${API_BASE_URL}`);
  console.log(`Activity ID: ${ACTIVITY_ID}`);
  
  try {
    console.log('\n1. Calling draw-winners endpoint...');
    const response = await fetch(`${API_BASE_URL}/activities/${ACTIVITY_ID}/draw-winners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-organizer-id': 'demo-organizer-123',
      },
      body: JSON.stringify({ count: 1 }),
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('\n2. Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Winners drawn successfully!');
      if (data.winners && data.winners.length > 0) {
        console.log('\n🎉 Winners:');
        data.winners.forEach((winner: any, idx: number) => {
          console.log(`   ${idx + 1}. ${winner.participantName} (${winner.participantId})`);
        });
      }
    } else {
      console.log('\n❌ Failed to draw winners');
      console.log(`   Error: ${data.message || data.error}`);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testDrawWinners();
