# Poll WebSocket Handlers Implementation

## Overview

This document describes the implementation of poll WebSocket handlers for the event activities platform. The implementation enables real-time communication for poll activities, allowing organizers to broadcast poll lifecycle events and participants to receive live updates.

## Implementation Details

### WebSocket Service Methods

Added four new public methods to `WebSocketService` class in `backend/src/services/websocketService.ts`:

#### 1. `broadcastPollStarted`
- **Purpose**: Broadcasts when a poll activity is started by the organizer
- **Parameters**:
  - `io`: Socket.io server instance
  - `eventId`: The event ID
  - `activityId`: The poll activity ID
  - `question`: The poll question text
  - `options`: Array of poll options with IDs, text, and vote counts
- **Event Emitted**: `poll-started`
- **Payload**: `{ activityId, question, options }`

#### 2. `broadcastPollVoteSubmitted`
- **Purpose**: Broadcasts when a participant submits a vote
- **Parameters**:
  - `io`: Socket.io server instance
  - `eventId`: The event ID
  - `activityId`: The poll activity ID
  - `participantId`: The ID of the participant who voted
- **Event Emitted**: `poll-vote-submitted`
- **Payload**: `{ activityId, participantId }`

#### 3. `broadcastPollResultsUpdated`
- **Purpose**: Broadcasts live poll results when enabled
- **Parameters**:
  - `io`: Socket.io server instance
  - `eventId`: The event ID
  - `activityId`: The poll activity ID
  - `results`: Object containing totalVotes and options with vote counts
- **Event Emitted**: `poll-results-updated`
- **Payload**: `{ activityId, results }`

#### 4. `broadcastPollEnded`
- **Purpose**: Broadcasts when a poll is ended by the organizer
- **Parameters**:
  - `io`: Socket.io server instance
  - `eventId`: The event ID
  - `activityId`: The poll activity ID
  - `finalResults`: Object containing final vote counts
- **Event Emitted**: `poll-ended`
- **Payload**: `{ activityId, finalResults }`

### Routes Integration

Updated `backend/src/routes/activities.ts` to use the new WebSocket service methods:

1. **POST /api/activities/:activityId/start-poll**
   - Calls `wsService.broadcastPollStarted()` after starting the poll
   - Sends poll question and options to all participants

2. **POST /api/activities/:activityId/vote**
   - Calls `wsService.broadcastPollVoteSubmitted()` after vote submission
   - If `showResultsLive` is enabled, also calls `wsService.broadcastPollResultsUpdated()`
   - Enables real-time vote tracking and live results display

3. **POST /api/activities/:activityId/end-poll**
   - Calls `wsService.broadcastPollEnded()` with final results
   - Notifies all participants that the poll has concluded

## Event Flow

### Poll Start Flow
1. Organizer calls POST /api/activities/:activityId/start-poll
2. PollActivityService updates activity status to 'active'
3. WebSocket broadcasts 'poll-started' event to all participants in the event room
4. Participants receive poll question and options

### Vote Submission Flow
1. Participant calls POST /api/activities/:activityId/vote
2. PollActivityService validates and saves the vote
3. WebSocket broadcasts 'poll-vote-submitted' event
4. If live results enabled, WebSocket broadcasts 'poll-results-updated' with current vote counts
5. All participants see updated results in real-time

### Poll End Flow
1. Organizer calls POST /api/activities/:activityId/end-poll
2. PollActivityService updates activity status to 'completed'
3. WebSocket broadcasts 'poll-ended' event with final results
4. All participants see final vote counts

## Testing

Created comprehensive tests in `backend/src/__tests__/pollWebSocketHandlers.test.ts`:

- ✅ Test poll-started event broadcasting
- ✅ Test poll-vote-submitted event broadcasting
- ✅ Test poll-results-updated event broadcasting
- ✅ Test poll-ended event broadcasting

All tests verify:
- Correct event room targeting (using eventId)
- Correct event names
- Correct payload structure

## Requirements Validation

This implementation satisfies **Requirement 3.2** from the requirements document:

> "WHEN an organizer configures a poll activity THEN the Event System SHALL allow defining poll questions and response options"

The WebSocket handlers enable:
- ✅ Real-time poll lifecycle management
- ✅ Live vote broadcasting to all participants
- ✅ Optional live results updates during voting
- ✅ Final results broadcasting when poll ends

## Integration Points

The poll WebSocket handlers integrate with:

1. **PollActivityService**: Business logic for poll operations
2. **Activity Routes**: REST API endpoints that trigger broadcasts
3. **WebSocket Types**: Type-safe event definitions in `backend/src/types/websocket.ts`
4. **Frontend**: Will consume these events to update participant UI in real-time

## Next Steps

The following tasks should be completed to fully integrate poll functionality:

1. **Task 19**: Implement raffle WebSocket handlers (similar pattern)
2. **Task 21-24**: Create frontend components for poll configuration and participation
3. **Task 27-29**: Implement participant poll interface with real-time updates
4. **Task 33-34**: Update frontend WebSocket context to handle poll events

## Notes

- All WebSocket broadcasts use the event room (eventId) to ensure only participants in that event receive updates
- The implementation follows the same pattern as existing activity lifecycle handlers
- Error handling is included with try-catch blocks and console logging
- The code is fully type-safe using TypeScript interfaces
