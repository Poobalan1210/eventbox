/**
 * Test viewing poll results after completion
 */

const API_BASE_URL = 'https://d15swf38ljbkja.cloudfront.net/api';

async function testPollResultsViewing() {
  console.log('\n=== Testing Poll Results Viewing ===');
  
  try {
    const ACTIVITY_ID = '2de073d1-fb29-4ca2-a33a-7827df73d489';
    
    console.log('\n1. Fetching activity details...');
    const activityResponse = await fetch(`${API_BASE_URL}/activities/${ACTIVITY_ID}`);
    
    if (!activityResponse.ok) {
      console.log(`❌ Failed to fetch activity: ${activityResponse.status}`);
      return;
    }
    
    const activityData = await activityResponse.json();
    console.log('Activity:', JSON.stringify(activityData, null, 2));
    
    console.log('\n2. Fetching poll results...');
    const resultsResponse = await fetch(`${API_BASE_URL}/activities/${ACTIVITY_ID}/poll-results`);
    
    console.log(`Status: ${resultsResponse.status} ${resultsResponse.statusText}`);
    
    if (resultsResponse.ok) {
      const resultsData = await resultsResponse.json();
      console.log('\n3. Poll Results:');
      console.log(JSON.stringify(resultsData, null, 2));
      
      // Check the structure
      if (resultsData.results && resultsData.results.options) {
        console.log('\n✅ Poll results structure is correct!');
        console.log(`   Total votes: ${resultsData.results.totalVotes}`);
        console.log(`   Options: ${resultsData.results.options.length}`);
        resultsData.results.options.forEach((opt: any) => {
          console.log(`   - ${opt.text}: ${opt.voteCount} votes`);
        });
      } else {
        console.log('\n⚠️  Unexpected results structure');
      }
    } else {
      const errorData = await resultsResponse.json();
      console.log('\n❌ Failed to fetch results:');
      console.log(JSON.stringify(errorData, null, 2));
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
  }
}

testPollResultsViewing();
