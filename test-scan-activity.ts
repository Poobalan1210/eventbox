/**
 * Test script to scan for activity directly in DynamoDB
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

const ACTIVITIES_TABLE = 'Activities';
const ACTIVITY_ID = 'd8b8404e-f3cd-40bb-9249-a782115d8551';

async function testScanActivity() {
  console.log('\n=== Testing Scan for Activity ===');
  console.log(`Table: ${ACTIVITIES_TABLE}`);
  console.log(`Activity ID: ${ACTIVITY_ID}`);
  
  try {
    console.log('\n1. Scanning for activity...');
    const command = new ScanCommand({
      TableName: ACTIVITIES_TABLE,
      FilterExpression: 'activityId = :activityId',
      ExpressionAttributeValues: {
        ':activityId': ACTIVITY_ID,
      },
      Limit: 1,
    });
    
    const result = await docClient.send(command);
    
    console.log(`   Scanned Count: ${result.ScannedCount}`);
    console.log(`   Items Found: ${result.Items?.length || 0}`);
    
    if (result.Items && result.Items.length > 0) {
      console.log('\n✅ Activity found!');
      console.log(JSON.stringify(result.Items[0], null, 2));
    } else {
      console.log('\n❌ Activity not found in scan');
      
      // Try scanning all activities to see what's there
      console.log('\n2. Scanning all activities...');
      const allCommand = new ScanCommand({
        TableName: ACTIVITIES_TABLE,
      });
      
      const allResult = await docClient.send(allCommand);
      console.log(`   Total activities: ${allResult.Items?.length || 0}`);
      
      allResult.Items?.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.name} (${item.activityId}) - ${item.status}`);
      });
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testScanActivity();
