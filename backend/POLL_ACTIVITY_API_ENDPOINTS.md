# Poll Activity API Endpoints

This document describes the REST API endpoints for managing poll activities within events.

## Overview

Poll activities allow organizers to create interactive polls where participants can vote on predefined options. The system supports single or multiple vote polls, live results display, and comprehensive vote tracking.

## Endpoints

### 1. Configure Poll

Configure a poll activity with a question and voting options.

**Endpoint:** `POST /api/activities/:activityId/configure-poll`

**Request Body:**
```json
{
  "question": "What is your favorite programming language?",
  "options": ["JavaScript", "Python", "TypeScript", "Go"]
}
```

**Response:**
```json
{
  "success": true
}
```

**Validation:**
- `question` is required and must not be empty
- `options` must be an array with at least 2 items
- All options must have non-empty text
- Activity must exist and be of type 'poll'
- Poll cannot be configured while active

**Status Codes:**
- `200` - Poll configured successfully
- `400` - Validation error (missing fields, invalid options, poll is active)
- `404` - Activity not found

**WebSocket Event:**
Emits `poll-configured` to all participants in the event.

---

### 2. Start Poll

Start a poll activity, making it active and ready for voting.

**Endpoint:** `POST /api/activities/:activityId/start-poll`

**Request Body:** None

**Response:**
```json
{
  "success": true
}
```

**Validation:**
- Poll must be configured (have question and options)
- Poll must be in 'ready' or 'draft' status
- Activity must exist and be of type 'poll'

**Status Codes:**
- `200` - Poll started successfully
- `400` - Poll not configured or invalid status
- `404` - Activity not found

**WebSocket Event:**
Emits `poll-started` to all participants with poll details:
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "question": "What is your favorite programming language?",
  "options": [
    { "id": "option-0-abc123", "text": "JavaScript", "voteCount": 0 },
    { "id": "option-1-def456", "text": "Python", "voteCount": 0 }
  ]
}
```

---

### 3. Submit Vote

Submit a participant's vote for a poll.

**Endpoint:** `POST /api/activities/:activityId/vote`

**Request Body:**
```json
{
  "participantId": "participant-123",
  "optionIds": ["option-0-abc123"]
}
```

**Response:**
```json
{
  "success": true
}
```

**Validation:**
- `participantId` is required
- `optionIds` must be a non-empty array
- All option IDs must be valid for the poll
- Poll must be active
- Participant cannot vote twice
- If `allowMultipleVotes` is false, only one option ID is allowed

**Status Codes:**
- `200` - Vote submitted successfully
- `400` - Validation error (invalid options, multiple votes not allowed, poll not active)
- `404` - Activity not found
- `409` - Participant has already voted

**WebSocket Events:**
1. Emits `poll-vote-submitted` to all participants:
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "participantId": "participant-123"
}
```

2. If `showResultsLive` is enabled, also emits `poll-results-updated` with current results.

---

### 4. Get Poll Results

Retrieve current voting results for a poll.

**Endpoint:** `GET /api/activities/:activityId/poll-results`

**Request Body:** None

**Response:**
```json
{
  "results": {
    "pollId": "poll-456",
    "totalVotes": 5,
    "options": [
      { "id": "option-0-abc123", "text": "JavaScript", "voteCount": 2 },
      { "id": "option-1-def456", "text": "Python", "voteCount": 3 }
    ]
  }
}
```

**Validation:**
- Activity must exist and be of type 'poll'

**Status Codes:**
- `200` - Results retrieved successfully
- `404` - Activity not found

**Notes:**
- Results can be retrieved at any time (before, during, or after voting)
- Vote counts are calculated in real-time from the database

---

### 5. End Poll

End a poll activity and return final results.

**Endpoint:** `POST /api/activities/:activityId/end-poll`

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "results": {
    "pollId": "poll-456",
    "totalVotes": 5,
    "options": [
      { "id": "option-0-abc123", "text": "JavaScript", "voteCount": 2 },
      { "id": "option-1-def456", "text": "Python", "voteCount": 3 }
    ]
  }
}
```

**Validation:**
- Poll must be active
- Activity must exist and be of type 'poll'

**Status Codes:**
- `200` - Poll ended successfully
- `400` - Poll is not active
- `404` - Activity not found

**WebSocket Event:**
Emits `poll-ended` to all participants with final results:
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "finalResults": {
    "pollId": "poll-456",
    "totalVotes": 5,
    "options": [...]
  }
}
```

**Notes:**
- After ending, the poll status changes to 'completed'
- No further votes can be submitted after ending

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message"
}
```

Common error types:
- `BadRequest` - Invalid input or validation failure
- `NotFound` - Activity not found
- `Conflict` - Duplicate vote or state conflict

---

## WebSocket Events

Poll activities emit the following WebSocket events:

### poll-configured
Emitted when a poll is configured.
```json
{
  "eventId": "event-123",
  "activityId": "poll-456"
}
```

### poll-started
Emitted when a poll starts.
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "question": "Poll question",
  "options": [...]
}
```

### poll-vote-submitted
Emitted when a participant votes.
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "participantId": "participant-123"
}
```

### poll-results-updated
Emitted when results change (if live results enabled).
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "results": {...}
}
```

### poll-ended
Emitted when a poll ends.
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "finalResults": {...}
}
```

---

## Example Workflow

1. **Create Event**: `POST /api/events`
2. **Create Poll Activity**: `POST /api/events/:eventId/activities` with `type: 'poll'`
3. **Configure Poll**: `POST /api/activities/:activityId/configure-poll`
4. **Start Poll**: `POST /api/activities/:activityId/start-poll`
5. **Participants Vote**: `POST /api/activities/:activityId/vote` (multiple participants)
6. **Check Results**: `GET /api/activities/:activityId/poll-results`
7. **End Poll**: `POST /api/activities/:activityId/end-poll`

---

## Related Documentation

- [Activity API Endpoints](./ACTIVITY_API_ENDPOINTS.md) - General activity management
- [Quiz Activity API Endpoints](./QUIZ_ACTIVITY_API_ENDPOINTS.md) - Quiz-specific endpoints
- [Event Activities Platform Design](../.kiro/specs/event-activities-platform/design.md) - System design
