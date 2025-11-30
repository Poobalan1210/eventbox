# Event Activities Platform - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication](#authentication)
4. [Core Concepts](#core-concepts)
5. [REST API Endpoints](#rest-api-endpoints)
   - [Event Management](#event-management)
   - [Activity Management](#activity-management)
   - [Quiz Activities](#quiz-activities)
   - [Poll Activities](#poll-activities)
   - [Raffle Activities](#raffle-activities)
6. [WebSocket Events](#websocket-events)
7. [Migration Guide](#migration-guide)
8. [Error Handling](#error-handling)
9. [Examples](#examples)

---

## Overview

The Event Activities Platform API enables organizers to create interactive events containing multiple activities (quizzes, polls, and raffles). Participants join events using join codes and interact with whichever activity the organizer activates.

**Base URL:** `http://localhost:3000/api` (development)

**Key Features:**
- Event-centric architecture (events contain activities)
- Multiple activity types: Quiz, Poll, Raffle
- Real-time updates via WebSocket
- Activity activation control
- Participant session management

---

## Architecture

### Event-Activity Model

```
Event (e.g., "SCD2025")
├── Activity 1: Quiz
│   └── Questions
├── Activity 2: Poll
│   └── Options & Votes
└── Activity 3: Raffle
    └── Entries & Winners
```

**Key Principles:**
- Events are containers for activities
- Only one activity can be active at a time
- Participants join events, not individual activities
- Organizers control which activity is visible to participants

---

## Authentication

Currently, the API uses simple organizer ID-based authentication. Include the organizer ID in request bodies where required.

**Future Enhancement:** JWT-based authentication will be added in a future release.

---

## Core Concepts

### Event
A named container (e.g., "SCD2025") that hosts multiple activities and has a unique join code (gamePin).

**Properties:**
- `eventId`: Unique identifier
- `name`: Event name
- `gamePin`: 6-digit join code
- `organizerId`: Creator's ID
- `status`: `draft` | `setup` | `live` | `completed`
- `visibility`: `private` | `public`
- `activeActivityId`: Currently active activity (or null)

### Activity
An interactive component within an event. Can be a quiz, poll, or raffle.

**Types:**
- **Quiz**: Multiple choice questions with scoring
- **Poll**: Voting on predefined options
- **Raffle**: Prize drawing with random winner selection

**Status Progression:**
- `draft` → `ready` → `active` → `completed`

### Participant
A user who joins an event using a join code and participates in active activities.

**Properties:**
- `participantId`: Unique identifier
- `nickname`: Display name
- `score`: Current score (for quizzes)
- `eventId`: Event they're participating in

---

## REST API Endpoints

### Event Management

#### Create Event

```http
POST /api/events
```

**Request Body:**
```json
{
  "name": "SCD2025 Conference",
  "organizerId": "org-123",
  "visibility": "private",
  "topic": "Technology",
  "description": "Annual tech conference"
}
```

**Response:** `201 Created`
```json
{
  "eventId": "event-abc123",
  "event": {
    "eventId": "event-abc123",
    "name": "SCD2025 Conference",
    "gamePin": "123456",
    "organizerId": "org-123",
    "status": "draft",
    "visibility": "private",
    "activeActivityId": null,
    "createdAt": 1234567890,
    "participantCount": 0
  }
}
```

#### Get Event

```http
GET /api/events/:eventId
```

**Response:** `200 OK`
```json
{
  "event": {
    "eventId": "event-abc123",
    "name": "SCD2025 Conference",
    "gamePin": "123456",
    "status": "live",
    "activeActivityId": "activity-xyz789",
    ...
  }
}
```

#### Update Event

```http
PUT /api/events/:eventId
```

**Request Body:**
```json
{
  "name": "Updated Event Name",
  "visibility": "public"
}
```

**Response:** `200 OK`

#### Delete Event

```http
DELETE /api/events/:eventId
```

**Response:** `200 OK`

**Note:** Deletes the event and all associated activities and participant data.

---

### Activity Management

#### Create Activity

```http
POST /api/events/:eventId/activities
```

**Quiz Activity Example:**
```json
{
  "name": "Trivia Quiz",
  "type": "quiz",
  "scoringEnabled": true,
  "speedBonusEnabled": true,
  "streakTrackingEnabled": true
}
```

**Poll Activity Example:**
```json
{
  "name": "Favorite Color Poll",
  "type": "poll",
  "question": "What is your favorite color?",
  "options": ["Red", "Blue", "Green", "Yellow"],
  "allowMultipleVotes": false,
  "showResultsLive": true
}
```

**Raffle Activity Example:**
```json
{
  "name": "Grand Prize Raffle",
  "type": "raffle",
  "prizeDescription": "iPad Pro",
  "entryMethod": "automatic",
  "winnerCount": 3
}
```

**Response:** `201 Created`
```json
{
  "activityId": "activity-xyz789",
  "activity": {
    "activityId": "activity-xyz789",
    "eventId": "event-abc123",
    "type": "quiz",
    "name": "Trivia Quiz",
    "status": "draft",
    "order": 0,
    "createdAt": 1234567890
  }
}
```

#### List Activities

```http
GET /api/events/:eventId/activities
```

**Response:** `200 OK`
```json
{
  "activities": [
    {
      "activityId": "activity-1",
      "type": "quiz",
      "name": "Trivia Quiz",
      "status": "ready",
      "order": 0
    },
    {
      "activityId": "activity-2",
      "type": "poll",
      "name": "Favorite Color",
      "status": "draft",
      "order": 1
    }
  ]
}
```

#### Get Activity Details

```http
GET /api/activities/:activityId
```

**Response:** `200 OK`
```json
{
  "activity": {
    "activityId": "activity-xyz789",
    "eventId": "event-abc123",
    "type": "quiz",
    "name": "Trivia Quiz",
    "status": "ready",
    "questions": [...],
    "scoringEnabled": true
  }
}
```

#### Update Activity

```http
PUT /api/activities/:activityId
```

**Request Body:**
```json
{
  "name": "Updated Activity Name",
  "status": "ready"
}
```

**Response:** `200 OK`

#### Delete Activity

```http
DELETE /api/activities/:activityId
```

**Response:** `200 OK`

**Error:** `400 Bad Request` if activity is currently active

#### Activate Activity

```http
POST /api/activities/:activityId/activate
```

Makes the activity visible to all participants. Automatically deactivates any previously active activity.

**Response:** `200 OK`

**Error:** `422 Unprocessable Entity` if activity is in draft status

#### Deactivate Activity

```http
POST /api/activities/:activityId/deactivate
```

Returns participants to waiting state.

**Response:** `200 OK`

---

### Quiz Activities

#### Add Question

```http
POST /api/activities/:activityId/questions
```

**Request Body:**
```json
{
  "text": "What is 2 + 2?",
  "options": [
    { "id": "opt1", "text": "3" },
    { "id": "opt2", "text": "4" },
    { "id": "opt3", "text": "5" },
    { "id": "opt4", "text": "6" }
  ],
  "correctOptionId": "opt2",
  "timerSeconds": 30,
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response:** `201 Created`
```json
{
  "questionId": "question-123",
  "question": {
    "questionId": "question-123",
    "text": "What is 2 + 2?",
    "options": [
      { "id": "opt1", "text": "3", "color": "red", "shape": "triangle" },
      { "id": "opt2", "text": "4", "color": "blue", "shape": "diamond" },
      { "id": "opt3", "text": "5", "color": "orange", "shape": "circle" },
      { "id": "opt4", "text": "6", "color": "green", "shape": "square" }
    ],
    "correctOptionId": "opt2",
    "timerSeconds": 30,
    "order": 0
  }
}
```

**Note:** Colors and shapes are automatically assigned to options.

#### Update Question

```http
PUT /api/activities/:activityId/questions/:questionId
```

**Request Body:** Same as Add Question

**Response:** `200 OK`

#### Delete Question

```http
DELETE /api/activities/:activityId/questions/:questionId
```

**Response:** `200 OK`

#### Get All Questions

```http
GET /api/activities/:activityId/questions
```

**Response:** `200 OK`
```json
{
  "questions": [...]
}
```

---

### Poll Activities

#### Configure Poll

```http
POST /api/activities/:activityId/configure-poll
```

**Request Body:**
```json
{
  "question": "What is your favorite programming language?",
  "options": ["JavaScript", "Python", "TypeScript", "Go"]
}
```

**Response:** `200 OK`

**Validation:**
- Question must not be empty
- At least 2 options required
- Cannot configure while active

#### Start Poll

```http
POST /api/activities/:activityId/start-poll
```

**Response:** `200 OK`

**WebSocket Event:** Emits `poll-started` to all participants

#### Submit Vote

```http
POST /api/activities/:activityId/vote
```

**Request Body:**
```json
{
  "participantId": "participant-123",
  "optionIds": ["option-0-abc123"]
}
```

**Response:** `200 OK`

**Validation:**
- Poll must be active
- Participant cannot vote twice
- If `allowMultipleVotes` is false, only one option allowed

**WebSocket Events:**
- `poll-vote-submitted`
- `poll-results-updated` (if live results enabled)

#### Get Poll Results

```http
GET /api/activities/:activityId/poll-results
```

**Response:** `200 OK`
```json
{
  "results": {
    "pollId": "poll-456",
    "totalVotes": 5,
    "options": [
      { "id": "option-0", "text": "JavaScript", "voteCount": 2 },
      { "id": "option-1", "text": "Python", "voteCount": 3 }
    ]
  }
}
```

#### End Poll

```http
POST /api/activities/:activityId/end-poll
```

**Response:** `200 OK`
```json
{
  "success": true,
  "results": {...}
}
```

**WebSocket Event:** Emits `poll-ended` with final results

---

### Raffle Activities

#### Configure Raffle

```http
POST /api/activities/:activityId/configure-raffle
```

**Request Body:**
```json
{
  "prizeDescription": "iPad Pro 12.9-inch",
  "entryMethod": "manual",
  "winnerCount": 3
}
```

**Parameters:**
- `entryMethod`: `"automatic"` (all participants auto-entered) or `"manual"` (participants must enter)
- `winnerCount`: Number of winners to draw (minimum 1)

**Response:** `200 OK`

#### Start Raffle

```http
POST /api/activities/:activityId/start-raffle
```

**Response:** `200 OK`

**WebSocket Event:** Emits `raffle-started`

#### Enter Raffle

```http
POST /api/activities/:activityId/enter
```

**Request Body:**
```json
{
  "participantId": "participant-789",
  "participantName": "John Doe"
}
```

**Response:** `200 OK`

**Error:** `409 Conflict` if participant already entered

**WebSocket Event:** Emits `raffle-entry-confirmed`

#### Draw Winners

```http
POST /api/activities/:activityId/draw-winners
```

**Request Body:**
```json
{
  "count": 3
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "winners": [
    {
      "participantId": "participant-789",
      "participantName": "John Doe"
    }
  ]
}
```

**WebSocket Events:**
- `raffle-drawing` (drawing started)
- `raffle-winners-announced` (winners revealed)

#### End Raffle

```http
POST /api/activities/:activityId/end-raffle
```

**Response:** `200 OK`
```json
{
  "success": true,
  "results": {
    "raffleId": "raffle-456",
    "prizeDescription": "iPad Pro",
    "totalEntries": 25,
    "winnerCount": 3,
    "winners": [...]
  }
}
```

**WebSocket Event:** Emits `raffle-ended`

---

## WebSocket Events

Connect to WebSocket at: `ws://localhost:3000`

### Connection

```javascript
const socket = io('http://localhost:3000');

// Join event room
socket.emit('join-event', { eventId: 'event-123' });
```

### Activity Lifecycle Events

#### activity-activated
Emitted when an activity becomes active.

```json
{
  "eventId": "event-123",
  "activity": {
    "activityId": "activity-456",
    "type": "quiz",
    "name": "Trivia Quiz",
    ...
  }
}
```

#### activity-deactivated
Emitted when an activity is deactivated.

```json
{
  "eventId": "event-123",
  "activityId": "activity-456"
}
```

#### activity-updated
Emitted when activity configuration changes.

```json
{
  "eventId": "event-123",
  "activity": {...}
}
```

#### waiting-for-activity
Emitted when no activity is active.

```json
{
  "eventId": "event-123",
  "message": "Waiting for organizer to start an activity"
}
```

### Poll Events

#### poll-started
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "question": "What is your favorite color?",
  "options": [
    { "id": "option-0", "text": "Red", "voteCount": 0 }
  ]
}
```

#### poll-vote-submitted
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "participantId": "participant-123"
}
```

#### poll-results-updated
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "results": {
    "totalVotes": 5,
    "options": [...]
  }
}
```

#### poll-ended
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "finalResults": {...}
}
```

### Raffle Events

#### raffle-started
```json
{
  "eventId": "event-123",
  "activityId": "raffle-456",
  "prizeDescription": "iPad Pro"
}
```

#### raffle-entry-confirmed
```json
{
  "eventId": "event-123",
  "activityId": "raffle-456",
  "participantId": "participant-789"
}
```

#### raffle-drawing
```json
{
  "eventId": "event-123",
  "activityId": "raffle-456"
}
```

#### raffle-winners-announced
```json
{
  "eventId": "event-123",
  "activityId": "raffle-456",
  "winners": [
    {
      "participantId": "participant-789",
      "participantName": "John Doe"
    }
  ]
}
```

#### raffle-ended
```json
{
  "eventId": "event-123",
  "activityId": "raffle-456",
  "results": {...}
}
```

### Quiz Events

Quiz events remain largely unchanged from the previous version:
- `quiz-started`
- `question-revealed`
- `answer-submitted`
- `answer-results-revealed`
- `leaderboard-updated`
- `quiz-ended`

---

## Migration Guide

### From Quiz-Centric to Event-Activities Model

#### Conceptual Changes

**Before:**
- Participants joined individual quizzes
- Each quiz was a standalone entity
- Public quiz browsing was available

**After:**
- Participants join events
- Events contain multiple activities (including quizzes)
- Organizers control which activity is active
- Public browsing removed (events are private or accessible via join code)

#### API Changes

##### Event Creation

**Old Approach:**
```javascript
// Create a quiz directly
POST /api/events
{
  "name": "My Quiz",
  "organizerId": "org-123"
}
```

**New Approach:**
```javascript
// Create an event
POST /api/events
{
  "name": "My Event",
  "organizerId": "org-123"
}

// Add a quiz activity
POST /api/events/:eventId/activities
{
  "name": "My Quiz",
  "type": "quiz",
  "scoringEnabled": true
}
```

##### Question Management

**Old Endpoints:**
```
POST   /api/events/:eventId/questions
PUT    /api/events/:eventId/questions/:questionId
DELETE /api/events/:eventId/questions/:questionId
```

**New Endpoints:**
```
POST   /api/activities/:activityId/questions
PUT    /api/activities/:activityId/questions/:questionId
DELETE /api/activities/:activityId/questions/:questionId
```

**Migration Note:** Old endpoints still work for backward compatibility but are deprecated.

##### Activity Activation

**New Concept:**
```javascript
// Activate a quiz activity
POST /api/activities/:activityId/activate

// Deactivate when done
POST /api/activities/:activityId/deactivate

// Activate a different activity
POST /api/activities/:anotherActivityId/activate
```

#### Data Migration

A migration script is provided to convert existing quiz data:

```bash
# Run migration
npx tsx scripts/migrate-to-activities.ts

# Verify migration
npx tsx scripts/verify-migration.ts

# Rollback if needed
npx tsx scripts/rollback-activity-migration.ts
```

**What the migration does:**
1. Adds `activeActivityId` field to all events
2. Creates a quiz activity for each existing event
3. Migrates all questions to reference the new activity
4. Preserves all existing data (questions, answers, participants)
5. Maintains gamePins and privacy settings

#### Client Code Updates

**Before:**
```javascript
// Join a quiz
socket.emit('join-event', { eventId: quizId });

// Listen for quiz events
socket.on('quiz-started', handleQuizStart);
```

**After:**
```javascript
// Join an event
socket.emit('join-event', { eventId: eventId });

// Listen for activity activation
socket.on('activity-activated', (data) => {
  if (data.activity.type === 'quiz') {
    handleQuizStart(data.activity);
  } else if (data.activity.type === 'poll') {
    handlePollStart(data.activity);
  }
});

// Listen for waiting state
socket.on('waiting-for-activity', handleWaiting);
```

#### Deprecated Features

The following features have been removed:
- **Public Quiz Browsing**: No longer supported
- **Template System**: Replaced by activity presets
- **Direct Quiz Creation**: Must create event first, then add quiz activity

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

#### 400 Bad Request
- Invalid input data
- Missing required fields
- Validation failures

```json
{
  "error": "BadRequest",
  "message": "Activity name is required"
}
```

#### 404 Not Found
- Resource doesn't exist

```json
{
  "error": "NotFound",
  "message": "Activity not found"
}
```

#### 409 Conflict
- Duplicate resource
- State conflict

```json
{
  "error": "Conflict",
  "message": "Participant has already voted"
}
```

#### 422 Unprocessable Entity
- Invalid state transition
- Business rule violation

```json
{
  "error": "ValidationError",
  "message": "Cannot activate activity in draft status"
}
```

### Error Handling Best Practices

1. **Always check status codes** before processing responses
2. **Display error messages** to users for validation errors
3. **Implement retry logic** for transient failures (500, 503)
4. **Log errors** for debugging
5. **Handle WebSocket disconnections** gracefully with reconnection logic

---

## Examples

### Complete Organizer Workflow

```javascript
// 1. Create an event
const eventResponse = await fetch('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'SCD2025 Conference',
    organizerId: 'org-123',
    visibility: 'private'
  })
});
const { eventId } = await eventResponse.json();

// 2. Add a quiz activity
const quizResponse = await fetch(`/api/events/${eventId}/activities`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Trivia Quiz',
    type: 'quiz',
    scoringEnabled: true
  })
});
const { activityId: quizId } = await quizResponse.json();

// 3. Add questions
await fetch(`/api/activities/${quizId}/questions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'What is 2 + 2?',
    options: [
      { id: 'opt1', text: '3' },
      { id: 'opt2', text: '4' }
    ],
    correctOptionId: 'opt2',
    timerSeconds: 30
  })
});

// 4. Add a poll activity
const pollResponse = await fetch(`/api/events/${eventId}/activities`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Favorite Color',
    type: 'poll',
    question: 'What is your favorite color?',
    options: ['Red', 'Blue', 'Green'],
    showResultsLive: true
  })
});
const { activityId: pollId } = await pollResponse.json();

// 5. Activate the quiz
await fetch(`/api/activities/${quizId}/activate`, {
  method: 'POST'
});

// 6. Later, switch to the poll
await fetch(`/api/activities/${pollId}/activate`, {
  method: 'POST'
});
```

### Complete Participant Workflow

```javascript
import io from 'socket.io-client';

// 1. Connect to WebSocket
const socket = io('http://localhost:3000');

// 2. Join event with gamePin
socket.emit('join-event', {
  eventId: eventId,
  nickname: 'John Doe'
});

// 3. Listen for activity changes
socket.on('activity-activated', (data) => {
  const { activity } = data;
  
  if (activity.type === 'quiz') {
    // Show quiz interface
    showQuizUI(activity);
  } else if (activity.type === 'poll') {
    // Show poll interface
    showPollUI(activity);
  } else if (activity.type === 'raffle') {
    // Show raffle interface
    showRaffleUI(activity);
  }
});

// 4. Listen for waiting state
socket.on('waiting-for-activity', () => {
  showWaitingScreen();
});

// 5. Submit poll vote
socket.emit('submit-vote', {
  activityId: pollId,
  participantId: myParticipantId,
  optionIds: ['option-0']
});

// 6. Enter raffle
socket.emit('enter-raffle', {
  activityId: raffleId,
  participantId: myParticipantId,
  participantName: 'John Doe'
});
```

### Testing with cURL

```bash
# Create event
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Event",
    "organizerId": "org-123",
    "visibility": "private"
  }'

# Create quiz activity
curl -X POST http://localhost:3000/api/events/event-123/activities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Quiz",
    "type": "quiz",
    "scoringEnabled": true
  }'

# Add question
curl -X POST http://localhost:3000/api/activities/activity-456/questions \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What is 2 + 2?",
    "options": [
      {"id": "opt1", "text": "3"},
      {"id": "opt2", "text": "4"}
    ],
    "correctOptionId": "opt2",
    "timerSeconds": 30
  }'

# Activate activity
curl -X POST http://localhost:3000/api/activities/activity-456/activate
```

---

## Additional Resources

- [Design Document](/.kiro/specs/event-activities-platform/design.md)
- [Requirements Document](/.kiro/specs/event-activities-platform/requirements.md)
- [Migration Scripts](/scripts/)
- [Test Scripts](/backend/test-*.ts)

---

## Support

For issues or questions:
1. Check the error message and status code
2. Review this documentation
3. Check the design document for architectural details
4. Review test scripts for working examples

---

**Last Updated:** November 30, 2025
**API Version:** 2.0 (Event Activities Platform)
