# Raffle Activity API Endpoints

This document describes the REST API endpoints for managing raffle activities within the event activities platform.

## Overview

Raffle activities allow organizers to create prize drawings where participants can enter for a chance to win. The organizer controls when the raffle starts, when winners are drawn, and when it ends.

## Endpoints

### 1. Configure Raffle

Configure a raffle activity with prize information and entry settings.

**Endpoint:** `POST /api/activities/:activityId/configure-raffle`

**Request Body:**
```json
{
  "prizeDescription": "iPad Pro 12.9-inch",
  "entryMethod": "manual",
  "winnerCount": 3
}
```

**Parameters:**
- `prizeDescription` (string, required): Description of the prize(s)
- `entryMethod` (string, required): Either "automatic" or "manual"
  - "automatic": All participants are automatically entered
  - "manual": Participants must manually enter
- `winnerCount` (number, required): Number of winners to draw (minimum 1)

**Response:**
```json
{
  "success": true
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid values
- `404 Not Found`: Activity not found
- `400 Bad Request`: Activity is not a raffle type

---

### 2. Start Raffle

Start the raffle activity, making it active and ready for entries.

**Endpoint:** `POST /api/activities/:activityId/start-raffle`

**Request Body:** None

**Response:**
```json
{
  "success": true
}
```

**WebSocket Event Emitted:**
```json
{
  "event": "raffle-started",
  "data": {
    "eventId": "event-123",
    "activityId": "raffle-456",
    "prizeDescription": "iPad Pro 12.9-inch"
  }
}
```

**Error Responses:**
- `404 Not Found`: Activity not found
- `400 Bad Request`: Activity is not a raffle type
- `422 Unprocessable Entity`: Raffle not configured or in invalid state

---

### 3. Enter Raffle

Submit an entry for a participant to enter the raffle.

**Endpoint:** `POST /api/activities/:activityId/enter`

**Request Body:**
```json
{
  "participantId": "participant-789",
  "participantName": "John Doe"
}
```

**Parameters:**
- `participantId` (string, required): Unique identifier for the participant
- `participantName` (string, required): Display name of the participant

**Response:**
```json
{
  "success": true
}
```

**WebSocket Event Emitted:**
```json
{
  "event": "raffle-entry-confirmed",
  "data": {
    "eventId": "event-123",
    "activityId": "raffle-456",
    "participantId": "participant-789"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `404 Not Found`: Activity not found
- `400 Bad Request`: Activity is not a raffle type
- `422 Unprocessable Entity`: Raffle not active
- `409 Conflict`: Participant already entered

---

### 4. Draw Winners

Randomly select winners from the raffle entries.

**Endpoint:** `POST /api/activities/:activityId/draw-winners`

**Request Body:**
```json
{
  "count": 3
}
```

**Parameters:**
- `count` (number, optional): Number of winners to draw. If not provided, uses the configured winnerCount.

**Response:**
```json
{
  "success": true,
  "winners": [
    {
      "participantId": "participant-789",
      "participantName": "John Doe"
    },
    {
      "participantId": "participant-456",
      "participantName": "Jane Smith"
    },
    {
      "participantId": "participant-123",
      "participantName": "Bob Johnson"
    }
  ]
}
```

**WebSocket Events Emitted:**

1. Drawing started:
```json
{
  "event": "raffle-drawing",
  "data": {
    "eventId": "event-123",
    "activityId": "raffle-456"
  }
}
```

2. Winners announced:
```json
{
  "event": "raffle-winners-announced",
  "data": {
    "eventId": "event-123",
    "activityId": "raffle-456",
    "winners": [
      {
        "participantId": "participant-789",
        "participantName": "John Doe"
      }
    ]
  }
}
```

**Error Responses:**
- `404 Not Found`: Activity not found
- `400 Bad Request`: Activity is not a raffle type
- `422 Unprocessable Entity`: Raffle not active
- `422 Unprocessable Entity`: No entries in raffle
- `422 Unprocessable Entity`: Insufficient entries for requested winner count

---

### 5. End Raffle

End the raffle activity and return final results.

**Endpoint:** `POST /api/activities/:activityId/end-raffle`

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "results": {
    "raffleId": "raffle-456",
    "prizeDescription": "iPad Pro 12.9-inch",
    "totalEntries": 25,
    "winnerCount": 3,
    "winners": [
      {
        "participantId": "participant-789",
        "participantName": "John Doe"
      },
      {
        "participantId": "participant-456",
        "participantName": "Jane Smith"
      },
      {
        "participantId": "participant-123",
        "participantName": "Bob Johnson"
      }
    ]
  }
}
```

**WebSocket Event Emitted:**
```json
{
  "event": "raffle-ended",
  "data": {
    "eventId": "event-123",
    "activityId": "raffle-456",
    "results": {
      "raffleId": "raffle-456",
      "prizeDescription": "iPad Pro 12.9-inch",
      "totalEntries": 25,
      "winnerCount": 3,
      "winners": [...]
    }
  }
}
```

**Error Responses:**
- `404 Not Found`: Activity not found
- `400 Bad Request`: Activity is not a raffle type
- `422 Unprocessable Entity`: Raffle not active

---

## Typical Workflow

1. **Configure**: Organizer configures the raffle with prize and settings
   ```
   POST /api/activities/:activityId/configure-raffle
   ```

2. **Start**: Organizer starts the raffle
   ```
   POST /api/activities/:activityId/start-raffle
   ```

3. **Enter**: Participants enter the raffle (if manual entry method)
   ```
   POST /api/activities/:activityId/enter
   ```

4. **Draw**: Organizer draws the winners
   ```
   POST /api/activities/:activityId/draw-winners
   ```

5. **End**: Organizer ends the raffle
   ```
   POST /api/activities/:activityId/end-raffle
   ```

## Notes

- Winners are selected using a Fisher-Yates shuffle algorithm for fair randomization
- Duplicate entries are prevented - each participant can only enter once
- The raffle must be configured before it can be started
- Winners can be drawn multiple times if needed (e.g., if a winner declines)
- All WebSocket events are broadcast to all participants in the event room
