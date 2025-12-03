# Raffle Draw Winners Fix - Complete

## Problem
When trying to draw raffle winners, the system showed "Drawing winners..." animation but then displayed "An unexpected error occurred" and never completed.

## Root Cause
The `RaffleRepository.setWinners()` method was trying to update the Activities table with an incomplete DynamoDB key. The Activities table has a **composite primary key**:
- Partition Key: `eventId`
- Sort Key: `activityId`

The code was only providing `activityId`, causing a DynamoDB `ValidationException: The provided key element does not match the schema`.

## Investigation Steps
1. Checked the frontend - raffle UI was working correctly
2. Tested the API endpoint - returned 500 Internal Server Error
3. Created debug script to test directly - revealed the DynamoDB error
4. Checked the Activities table schema - confirmed composite key structure
5. Identified the bug in `RaffleRepository.setWinners()`

## Solution Applied
Updated `backend/src/db/repositories/RaffleRepository.ts` in the `setWinners()` method:

**Before:**
```typescript
async setWinners(raffleId: string, winnerIds: string[]): Promise<void> {
  const command = new UpdateCommand({
    TableName: TABLE_NAMES.ACTIVITIES,
    Key: {
      activityId: raffleId,  // ❌ Missing eventId!
    },
    // ...
  });
}
```

**After:**
```typescript
async setWinners(raffleId: string, winnerIds: string[]): Promise<void> {
  // First, get the activity to find its eventId
  const { ActivityRepository } = await import('./ActivityRepository.js');
  const activityRepo = new ActivityRepository();
  const activity = await activityRepo.findById(raffleId);
  
  if (!activity) {
    throw new Error(`Activity not found: ${raffleId}`);
  }

  const command = new UpdateCommand({
    TableName: TABLE_NAMES.ACTIVITIES,
    Key: {
      eventId: activity.eventId,  // ✅ Now includes both keys
      activityId: raffleId,
    },
    // ...
  });
}
```

## Deployment
1. Fixed the code in `RaffleRepository.ts`
2. Compiled TypeScript to JavaScript
3. Built Docker image with the fix
4. Pushed to ECR
5. Updated ECS task definition (version 10)
6. Deployed to ECS cluster

## Verification
Tested the draw winners API endpoint:
```bash
✅ Status: 200 OK
✅ Winners drawn successfully
🎉 Winner: CoolHero
```

## Files Modified
- `backend/src/db/repositories/RaffleRepository.ts` - Fixed setWinners method

## Files Created (Debug/Test)
- `debug-raffle.ts` - Debug script to check raffle setup
- `test-draw-winners.ts` - API test script
- `test-draw-winners-detailed.ts` - Direct service test
- `check-activities-table.ts` - Table schema verification

## Impact
- ✅ Raffle draw winners now works correctly
- ✅ Winners are properly stored in the Activities table
- ✅ Frontend receives winner announcements via WebSocket
- ✅ Raffle flow completes successfully

## Next Steps
The raffle feature is now fully functional. Try it out:
1. Create a raffle activity
2. Have participants join
3. Click "Draw Winners"
4. Winners will be announced with celebration animation! 🎉
