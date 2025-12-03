/**
 * Test script to check if event exists and has a PIN
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME || 'LiveQuizEvents';

async function checkEvents() {
  console.log(`\n=== Checking Events Table ===`);
  console.log(`Table: ${EVENTS_TABLE}`);
  
  try {
    const scanCommand = new ScanCommand({
      TableName: EVENTS_TABLE,
      Limit: 10,
    });
    
    const result = await docClient.send(scanCommand);
    console.log(`\nFound ${result.Items?.length || 0} events:`);
    
    result.Items?.forEach((event, idx) => {
      console.log(`\n${idx + 1}. Event: ${event.name}`);
      console.log(`   EventID: ${event.eventId || event.id}`);
      console.log(`   GamePIN: ${event.gamePin}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   OrganizerID: ${event.organizerId}`);
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkEvents();
