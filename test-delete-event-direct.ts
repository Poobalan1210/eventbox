/**
 * Test deleting event directly via DynamoDB
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

const EVENT_ID = '0eb9fc73-19e6-40b1-b675-a60e07502b68';

async function testDeleteEvent() {
  console.log('\n=== Testing Delete Event Directly ===');
  console.log(`Event ID: ${EVENT_ID}`);
  
  try {
    // 1. Get all activities for this event
    console.log('\n1. Querying activities...');
    const queryCommand = new QueryCommand({
      TableName: 'Activities',
      KeyConditionExpression: 'eventId = :eventId',
      ExpressionAttributeValues: {
        ':eventId': EVENT_ID,
      },
    });
    
    const queryResult = await docClient.send(queryCommand);
    const activities = queryResult.Items || [];
    console.log(`   Found ${activities.length} activities`);
    
    // 2. Delete each activity
    for (const activity of activities) {
      console.log(`\n2. Deleting activity: ${activity.name} (${activity.activityId})`);
      const deleteActivityCommand = new DeleteCommand({
        TableName: 'Activities',
        Key: {
          eventId: EVENT_ID,
          activityId: activity.activityId,
        },
      });
      await docClient.send(deleteActivityCommand);
      console.log(`   ✅ Deleted`);
    }
    
    // 3. Delete the event
    console.log(`\n3. Deleting event...`);
    const deleteEventCommand = new DeleteCommand({
      TableName: 'LiveQuizEvents',
      Key: {
        eventId: EVENT_ID,
      },
    });
    await docClient.send(deleteEventCommand);
    console.log(`   ✅ Event deleted`);
    
    console.log('\n✅ Successfully deleted event and all activities!');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testDeleteEvent();
