/**
 * Debug script to test raffle draw winners
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

const ACTIVITIES_TABLE = process.env.ACTIVITIES_TABLE || 'Activities';
const RAFFLE_ENTRIES_TABLE = process.env.RAFFLE_ENTRIES_TABLE || 'RaffleEntries';

async function debugRaffle() {
  console.log('\n=== Debugging Raffle ===');
  
  try {
    // 1. Find raffle activities
    console.log('\n1. Scanning for raffle activities...');
    const activitiesCommand = new ScanCommand({
      TableName: ACTIVITIES_TABLE,
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':type': 'raffle',
      },
    });
    
    const activitiesResult = await docClient.send(activitiesCommand);
    const raffles = activitiesResult.Items || [];
    
    console.log(`Found ${raffles.length} raffle(s)`);
    
    if (raffles.length === 0) {
      console.log('❌ No raffles found');
      return;
    }
    
    // Get the first raffle
    const raffle = raffles[0];
    console.log('\n2. Raffle details:');
    console.log(`   ActivityID: ${raffle.activityId}`);
    console.log(`   Name: ${raffle.name}`);
    console.log(`   Status: ${raffle.status}`);
    console.log(`   Winner Count: ${raffle.winnerCount}`);
    console.log(`   Winners: ${JSON.stringify(raffle.winners || [])}`);
    
    // 3. Check raffle entries
    console.log('\n3. Checking raffle entries...');
    const entriesCommand = new QueryCommand({
      TableName: RAFFLE_ENTRIES_TABLE,
      IndexName: 'RaffleEntries',
      KeyConditionExpression: 'raffleId = :raffleId',
      ExpressionAttributeValues: {
        ':raffleId': raffle.activityId,
      },
    });
    
    const entriesResult = await docClient.send(entriesCommand);
    const entries = entriesResult.Items || [];
    
    console.log(`Found ${entries.length} entry/entries`);
    entries.forEach((entry, idx) => {
      console.log(`   ${idx + 1}. ${entry.participantName} (${entry.participantId})`);
    });
    
    if (entries.length === 0) {
      console.log('\n❌ No entries found - cannot draw winners');
      console.log('   Make sure participants have joined the raffle');
      return;
    }
    
    console.log('\n✅ Raffle setup looks good');
    console.log(`   Can draw up to ${entries.length} winner(s)`);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.name === 'ResourceNotFoundException') {
      console.error('   Table not found. Check table names:');
      console.error(`   - ACTIVITIES_TABLE: ${ACTIVITIES_TABLE}`);
      console.error(`   - RAFFLE_ENTRIES_TABLE: ${RAFFLE_ENTRIES_TABLE}`);
    }
    console.error('\nFull error:', error);
  }
}

debugRaffle();
