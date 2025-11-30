# Raffle WebSocket Handlers Implementation

## Overview

This document describes the implementation of WebSocket handlers for raffle activities in the event activities platform. The handlers enable real-time communication between the organizer and participants during raffle activities.

## Implementation Details

### WebSocket Service Methods

The following methods were added to `WebSocketService` class in `backend/src/services/websocketService.ts`:

#### 1. `broadcastRaffleStarted`
- **Purpose**: Broadcasts when an organizer starts a raffle activity
- **Event**: `raffle-started`
- **Payload**: `{ activityId, prizeDescription }`
- **Triggered by**: POST `/api/activities/:activityId/start-raffle`

#### 2. `broadcastRaffleEntryConfirmed`
- **Purpose**: Broadcasts when a participant enters a raffle
- **Event**: `raffle-entry-confirmed`
- **Payload**: `{ activityId, participantId }`
- **Triggered by**: POST `/api/activities/:activityId/enter`

#### 3. `broadcastRaffleDrawing`
- **Purpose**: Broadcasts when the organizer initiates winner drawing (triggers animations)
- **Event**: `raffle-drawing`
- **Payload**: `{ activityId }`
- **Triggered by**: POST `/api/activities/:activityId/draw-winners`

#### 4. `broadcastRaffleWinnersAnnounced`
- **Purpose**: Broadcasts the winners after drawing (triggers celebration animations)
- **Event**: `raffle-winners-announced`
- **Payload**: `{ activityId, winners: [{ participantId, participantName }] }`
- **Triggered by**: POST `/api/activities/:activityId/draw-winners`

#### 5. `broadcastRaffleEnded`
- **Purpose**: Broadcasts when an organizer ends a raffle activity
- **Event**: `raffle-ended`
- **Payload**: `{ activityId }`
- **Triggered by**: POST `/api/activities/:activityId/end-raffle`

### Route Integration

The raffle API endpoints in `backend/src/routes/activities.ts` were updated to use the new WebSocket service methods instead of directly emitting events. This provides:

1. **Consistency**: All WebSocket broadcasts go through the service layer
2. **Logging**: Centralized logging of all raffle events
3. **Error handling**: Consistent error handling for WebSocket operations
4. **Testability**: Easier to test and mock WebSocket behavior

### Testing

Comprehensive unit tests were added in `backend/src/__tests__/raffleWebSocketHandlers.test.ts`:

- ✅ Test raffle-started event broadcasting
- ✅ Test raffle-entry-confirmed event broadcasting
- ✅ Test raffle-drawing event broadcasting
- ✅ Test raffle-winners-announced event broadcasting (single and multiple winners)
- ✅ Test raffle-ended event broadcasting

All tests pass successfully.

## Event Flow

### Typical Raffle Flow

1. **Organizer configures raffle** → No WebSocket event (configuration is private)
2. **Organizer starts raffle** → `raffle-started` event → Participants see raffle interface
3. **Participants enter raffle** → `raffle-entry-confirmed` event → Real-time entry count updates
4. **Organizer draws winners** → `raffle-drawing` event → Animation triggers
5. **Winners announced** → `raffle-winners-announced` event → Celebration animations
6. **Organizer ends raffle** → `raffle-ended` event → Participants return to waiting state

## Animation Triggers

The implementation includes specific events designed to trigger frontend animations:

- **`raffle-drawing`**: Triggers suspenseful animation before winners are revealed
- **`raffle-winners-announced`**: Triggers celebration animations and confetti effects

## Requirements Validation

This implementation satisfies **Requirement 3.3** from the requirements document:

> "WHEN an organizer configures a raffle activity THEN the Event System SHALL allow setting entry criteria and prize details"

The WebSocket handlers enable:
- ✅ Real-time raffle lifecycle management
- ✅ Entry confirmation broadcasting
- ✅ Winner announcement with animation triggers
- ✅ Seamless participant experience during raffle activities

## Files Modified

1. `backend/src/services/websocketService.ts` - Added 5 new broadcast methods
2. `backend/src/routes/activities.ts` - Updated 4 raffle endpoints to use WebSocket service
3. `backend/src/__tests__/raffleWebSocketHandlers.test.ts` - Added comprehensive tests

## Next Steps

The frontend implementation (Phase 6) will need to:
1. Listen for these raffle events in the WebSocket context
2. Create raffle participant interface components
3. Implement animations for drawing and winner announcement
4. Handle raffle state transitions in the participant view
