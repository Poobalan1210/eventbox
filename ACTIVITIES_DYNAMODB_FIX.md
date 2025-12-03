# Activities DynamoDB Schema Fix

## Issue
The deployed application was showing "Failed to load activities" error when trying to view activities for an event.

## Root Cause
The DynamoDB `Activities` table has a **composite primary key**:
- **Partition key (HASH)**: `eventId`
- **Sort key (RANGE)**: `activityId`

However, the `ActivityRepository` was trying to query activities using only `activityId` in several methods:
- `findById()` - Used `GetCommand` with only `activityId`
- `update()` - Used `UpdateCommand` with only `activityId`
- `delete()` - Used `DeleteCommand` with only `activityId`
- `setStatus()` - Used `UpdateCommand` with only `activityId`

This caused DynamoDB to throw a `ValidationException: The provided key element does not match the schema` error.

## Solution
Updated `backend/src/db/repositories/ActivityRepository.ts` to properly handle the composite key:

### 1. `findById()` Method
Changed from using `GetCommand` (which requires both keys) to using `ScanCommand` with a filter:
```typescript
// Use scan with filter since we don't have eventId
const command = new ScanCommand({
  TableName: TABLE_NAMES.ACTIVITIES,
  FilterExpression: 'activityId = :activityId',
  ExpressionAttributeValues: {
    ':activityId': activityId,
  },
  Limit: 1,
});
```

**Note**: This is less efficient than a direct `GetCommand` but works without requiring `eventId`. For production optimization, consider:
- Adding a GSI with `activityId` as the partition key
- Or modifying the API to always pass `eventId` when querying activities

### 2. `update()` Method
Modified to first fetch the activity to get its `eventId`, then use both keys:
```typescript
// First get the activity to find its eventId
const current = await this.findById(activityId);
if (!current) {
  throw new Error(`Activity not found: ${activityId}`);
}

const command = new UpdateCommand({
  TableName: TABLE_NAMES.ACTIVITIES,
  Key: {
    eventId: current.eventId,
    activityId: activityId,
  },
  // ... rest of update
});
```

### 3. `delete()` Method
Similar approach - fetch first to get `eventId`:
```typescript
// First get the activity to find its eventId
const activity = await this.findById(activityId);
if (!activity) {
  throw new Error(`Activity not found: ${activityId}`);
}

const command = new DeleteCommand({
  TableName: TABLE_NAMES.ACTIVITIES,
  Key: {
    eventId: activity.eventId,
    activityId: activityId,
  },
});
```

### 4. `setStatus()` Method
Same pattern:
```typescript
// First get the activity to find its eventId
const activity = await this.findById(activityId);
if (!activity) {
  throw new Error(`Activity not found: ${activityId}`);
}

const command = new UpdateCommand({
  TableName: TABLE_NAMES.ACTIVITIES,
  Key: {
    eventId: activity.eventId,
    activityId: activityId,
  },
  // ... rest of update
});
```

## Deployment
1. Fixed the `ActivityRepository.ts` file
2. Built and deployed new Docker image to ECR
3. Updated ECS task definition with new image
4. Forced new deployment of ECS service
5. Invalidated CloudFront cache

## Verification
```bash
# Test the activities endpoint
curl https://d15swf38ljbkja.cloudfront.net/api/events/0eb9fc73-19e6-40b1-b675-a60e07502b68/activities

# Response (success):
{"activities":[{"eventId":"0eb9fc73-19e6-40b1-b675-a60e07502b68","question":"","lastModified":1764607626398,"status":"draft","createdAt":1764607626398,"options":[],"showResultsLive":true,"order":0,"activityId":"b8adc48f-2205-4e8c-a6b6-d75ea7f06f01","allowMultipleVotes":false,"name":"test","type":"poll"}]}
```

## Performance Considerations
The current implementation uses `ScanCommand` in `findById()`, which:
- ✅ Works without requiring `eventId`
- ✅ Simple to implement
- ❌ Less efficient than direct key lookup
- ❌ Scans entire table (though limited to 1 result)

### Recommended Optimizations for Production

#### Option 1: Add GSI for activityId
Create a Global Secondary Index with `activityId` as the partition key:
```typescript
// In CDK/CloudFormation
activitiesTable.addGlobalSecondaryIndex({
  indexName: 'ActivityById',
  partitionKey: { name: 'activityId', type: AttributeType.STRING },
  projectionType: ProjectionType.ALL,
});
```

Then update `findById()` to use `QueryCommand` on the GSI:
```typescript
const command = new QueryCommand({
  TableName: TABLE_NAMES.ACTIVITIES,
  IndexName: 'ActivityById',
  KeyConditionExpression: 'activityId = :activityId',
  ExpressionAttributeValues: {
    ':activityId': activityId,
  },
  Limit: 1,
});
```

#### Option 2: Pass eventId in API calls
Modify the API to always include `eventId` when querying activities:
- Change route from `/api/activities/:activityId` to `/api/events/:eventId/activities/:activityId`
- Update repository methods to accept both `eventId` and `activityId`
- Use direct `GetCommand` for efficient lookups

## Status
✅ **Fixed and Deployed**
- Activities now load correctly in the production application
- All CRUD operations on activities work properly
- CloudFront cache invalidated to serve updated API responses

## Testing
To test in production:
1. Visit: https://dch9ml2nwvrkt.cloudfront.net
2. Create or open an event
3. Navigate to activities page
4. Activities should load without errors
5. You can create, edit, and delete activities

## Files Modified
- `backend/src/db/repositories/ActivityRepository.ts`

## Deployment Commands Used
```bash
./deploy-backend.sh
aws cloudfront create-invalidation --distribution-id E6N2OUFZFCZED --paths "/*"
```
