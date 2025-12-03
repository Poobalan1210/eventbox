/**
 * Test script to debug PIN lookup issue
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Configure DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.GAME_PINS_TABLE_NAME || 'LiveQuizGamePins';

async function testPinLookup(pin: string) {
  console.log(`\n=== Testing PIN Lookup for: ${pin} ===`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  
  try {
    // Try direct get
    console.log('\n1. Direct GetCommand:');
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        gamePin: pin,
      },
    });
    
    const result = await docClient.send(getCommand);
    console.log('Result:', JSON.stringify(result.Item, null, 2));
    
    if (!result.Item) {
      console.log('❌ PIN not found in table');
      
      // Scan table to see what's there
      console.log('\n2. Scanning table for all PINs:');
      const scanCommand = new ScanCommand({
        TableName: TABLE_NAME,
        Limit: 10,
      });
      
      const scanResult = await docClient.send(scanCommand);
      console.log(`Found ${scanResult.Items?.length || 0} items:`);
      scanResult.Items?.forEach((item, idx) => {
        console.log(`  ${idx + 1}. PIN: ${item.gamePin}, EventID: ${item.eventId}`);
      });
    } else {
      console.log('✅ PIN found!');
      console.log(`   EventID: ${result.Item.eventId}`);
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Error details:', error);
  }
}

// Get PIN from command line or use default
const pin = process.argv[2] || '716180';
testPinLookup(pin);
