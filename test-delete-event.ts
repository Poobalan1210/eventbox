/**
 * Test deleting an event
 */

const API_BASE_URL = 'https://d15swf38ljbkja.cloudfront.net/api';
const EVENT_ID = '0eb9fc73-19e6-40b1-b675-a60e07502b68'; // Your Test event

async function testDeleteEvent() {
  console.log('\n=== Testing Delete Event ===');
  console.log(`API: ${API_BASE_URL}`);
  console.log(`Event ID: ${EVENT_ID}`);
  
  try {
    console.log('\n1. Attempting to delete event...');
    const response = await fetch(`${API_BASE_URL}/events/${EVENT_ID}`, {
      method: 'DELETE',
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
      console.log('\n✅ Event deleted successfully!');
    } else {
      console.log('\n❌ Failed to delete event');
      console.log(`   Error: ${data.message || data.error}`);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testDeleteEvent();
