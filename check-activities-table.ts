/**
 * Check Activities table structure
 */
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

async function checkTable() {
  console.log('\n=== Checking Activities Table Structure ===');
  
  try {
    const command = new DescribeTableCommand({
      TableName: 'Activities',
    });
    
    const result = await client.send(command);
    
    console.log('\nTable Name:', result.Table?.TableName);
    console.log('\nKey Schema:');
    result.Table?.KeySchema?.forEach(key => {
      console.log(`  - ${key.AttributeName} (${key.KeyType})`);
    });
    
    console.log('\nAttribute Definitions:');
    result.Table?.AttributeDefinitions?.forEach(attr => {
      console.log(`  - ${attr.AttributeName}: ${attr.AttributeType}`);
    });
    
    console.log('\nGlobal Secondary Indexes:');
    result.Table?.GlobalSecondaryIndexes?.forEach(gsi => {
      console.log(`  - ${gsi.IndexName}:`);
      gsi.KeySchema?.forEach(key => {
        console.log(`    - ${key.AttributeName} (${key.KeyType})`);
      });
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkTable();
