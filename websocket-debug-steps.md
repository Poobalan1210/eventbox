# WebSocket Debug Steps

## Current Issue
- Quiz control buttons work (console logs show API calls)
- Backend processes quiz actions (shows "Question found: Q1")
- But participants don't see changes because **0 sockets in room**

## Root Cause
Participants are not successfully joining the WebSocket event room.

## Debug Steps Added

### 1. Backend Debugging
Added debug logs to `handleJoinEvent` in WebSocketService:
- `🔍 handleJoinEvent called with: [payload]` - Shows if join-event is received
- `❌ Invalid input:` - Shows validation errors
- `🔍 Looking for event: [eventId]` - Shows event lookup
- `✅ Event found: [name]` or `❌ Event not found:` - Shows event validation result

### 2. Testing Steps

#### Step 1: Check Participant Join
1. Open participant page: `/events/{eventId}/join`
2. Enter nickname and join
3. Check backend console for debug logs:
   ```
   🔍 handleJoinEvent called with: {eventId: "...", participantName: "..."}
   🔍 Looking for event: ...
   ✅ Event found: Test Event
   ✅ Participant socket abc123 joined room ...
   ```

#### Step 2: Verify Room Membership
After participant joins, when organizer clicks "Start Quiz":
- Should see: `Sockets in room [eventId]: [socket-ids]`
- Should NOT see: `Number of sockets in room: 0`

#### Step 3: Check Event ID Match
Verify the event ID used by:
- **Organizer control**: `/events/{eventId}/control`
- **Participant join**: `/events/{eventId}/join`
- **Backend logs**: Event ID in room membership

## Possible Issues

### 1. Event Not Found
- Event ID doesn't exist in database
- Event was deleted or never created
- Wrong event ID format

### 2. WebSocket Connection Issues
- Participant WebSocket not connecting
- join-event not being emitted
- Network/CORS issues

### 3. Room Joining Failure
- Event validation failing
- Database connection issues
- Async timing problems

## Next Steps

1. **Test participant join** and check backend logs
2. **Verify event ID consistency** across organizer and participant
3. **Check database** for event existence
4. **Test WebSocket connection** in browser dev tools

## Expected Flow

```
1. Participant opens /events/123/join
2. Enters nickname → emits join-event
3. Backend receives join-event → validates event
4. Backend adds socket to room 123
5. Organizer clicks Start Quiz
6. Backend broadcasts to room 123
7. Participant receives quiz question
```

Currently failing at step 3-4 (participant not joining room).