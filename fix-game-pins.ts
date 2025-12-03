/**
 * Migration script to populate GamePins table from existing events
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

const EVENTS_TABLE = process.env.EVENTS_TABLE_NAME || 'LiveQuizEvents';
const GAME_PINS_TABLE = process.env.GAME_PINS_TABLE_NAME || 'LiveQuizGamePins';

async function fixGamePins() {
  console.log(`\n=== Fixing GamePins Table ===`);
  console.log(`Events Table: ${EVENTS_TABLE}`);
  console.log(`GamePins Table: ${GAME_PINS_TABLE}`);
  
  try {
    // Scan all events
    console.log('\n1. Scanning events...');
    const scanCommand = new ScanCommand({
      TableName: EVENTS_TABLE,
    });
    
    const result = await docClient.send(scanCommand);
    const events = result.Items || [];
    console.log(`Found ${events.length} events`);
    
    // Create GamePin entries for each event
    let fixed = 0;
    let skipped = 0;
    
    for (const event of events) {
      const eventId = event.eventId || event.id;
      const gamePin = event.gamePin;
      
      if (!gamePin) {
        console.log(`⚠️  Event ${event.name} (${eventId}) has no gamePin`);
        skipped++;
        continue;
      }
      
      console.log(`\n2. Creating GamePin entry for event "${event.name}"`);
      console.log(`   EventID: ${eventId}`);
      console.log(`   GamePIN: ${gamePin}`);
      
      try {
        const putCommand = new PutCommand({
          TableName: GAME_PINS_TABLE,
          Item: {
            gamePin: gamePin,
            eventId: eventId,
            createdAt: event.createdAt || Date.now(),
            expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
          },
          // Don't overwrite if it already exists
          ConditionExpression: 'attribute_not_exists(gamePin)',
        });
        
        await docClient.send(putCommand);
        console.log(`   ✅ Created GamePin entry`);
        fixed++;
      } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') {
          console.log(`   ℹ️  GamePin entry already exists`);
          skipped++;
        } else {
          console.error(`   ❌ Error: ${error.message}`);
          skipped++;
        }
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total: ${events.length}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

fixGamePins();
