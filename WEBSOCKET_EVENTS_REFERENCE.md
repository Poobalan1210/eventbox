# WebSocket Events Reference

## Overview

The Event Activities Platform uses Socket.io for real-time bidirectional communication between the server and clients. This document provides a comprehensive reference for all WebSocket events.

**Connection URL:** `ws://localhost:3000` (development)

---

## Table of Contents

1. [Connection & Room Management](#connection--room-management)
2. [Activity Lifecycle Events](#activity-lifecycle-events)
3. [Quiz Events](#quiz-events)
4. [Poll Events](#poll-events)
5. [Raffle Events](#raffle-events)
6. [Participant Events](#participant-events)
7. [Error Events](#error-events)
8. [Event Flow Diagrams](#event-flow-diagrams)

---

## Connection & Room Management

### Client → Server

#### join-event
Join an event room to receive updates.

**Emit:**
```javascript
socket.emit('join-event', {
  eventId: 'event-123',
  nickname: 'John Doe'  // Optional for organizers
});
```

**Response:** Server adds client to event room

#### leave-event
Leave an event room.

**Emit:**
```javascript
socket.emit('leave-event', {
  eventId: 'event-123'
});
```

---

## Activity Lifecycle Events

### Server → Client

#### activity-activated
Broadcast when an activity becomes active.

**Payload:**
```json
{
  "eventId": "event-123",
  "activity": {
    "activityId": "activity-456",
    "type": "quiz",
    "name": "Trivia Quiz",
    "status": "active",
    "order": 0,
    "createdAt": 1234567890,
    "lastModified": 1234567890,
    // Type-specific fields
    "questions": [...],
    "scoringEnabled": true
  }
}
```

**Triggered by:** `POST /api/activities/:activityId/activate`

**Client Action:** Render the appropriate activity interface based on `activity.type`

---

#### activity-deactivated
Broadcast when an activity is deactivated.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "activity-456"
}
```

**Triggered by:** `POST /api/activities/:activityId/deactivate`

**Client Action:** Return to waiting state

---

#### activity-updated
Broadcast when activity configuration changes.

**Payload:**
```json
{
  "eventId": "event-123",
  "activity": {
    "activityId": "activity-456",
    "name": "Updated Name",
    ...
  }
}
```

**Triggered by:** `PUT /api/activities/:activityId`

**Client Action:** Update displayed activity information

---

#### activity-created
Broadcast when a new activity is created.

**Payload:**
```json
{
  "eventId": "event-123",
  "activity": {
    "activityId": "activity-789",
    "type": "poll",
    "name": "New Poll",
    "status": "draft"
  }
}
```

**Triggered by:** `POST /api/events/:eventId/activities`

**Client Action:** Update activity list (organizer view)

---

#### activity-deleted
Broadcast when an activity is deleted.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "activity-456"
}
```

**Triggered by:** `DELETE /api/activities/:activityId`

**Client Action:** Remove activity from list (organizer view)

---

#### waiting-for-activity
Broadcast when no activity is active.

**Payload:**
```json
{
  "eventId": "event-123",
  "message": "Waiting for organizer to start an activity",
  "participantCount": 25
}
```

**Triggered by:** Activity deactivation or event start with no active activity

**Client Action:** Display waiting screen to participants

---

## Quiz Events

### Server → Client

#### quiz-started
Broadcast when a quiz activity starts.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "quiz-456",
  "quizName": "Trivia Quiz",
  "questionCount": 10,
  "scoringEnabled": true
}
```

**Client Action:** Initialize quiz interface

---

#### question-revealed
Broadcast when a new question is revealed.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "quiz-456",
  "question": {
    "questionId": "q-123",
    "text": "What is 2 + 2?",
    "options": [
      { "id": "opt1", "text": "3", "color": "red", "shape": "triangle" },
      { "id": "opt2", "text": "4", "color": "blue", "shape": "diamond" }
    ],
    "timerSeconds": 30,
    "imageUrl": "https://example.com/image.jpg"
  },
  "questionNumber": 1,
  "totalQuestions": 10
}
```

**Client Action:** Display question and start timer

---

#### answer-results-revealed
Broadcast when answer results are revealed.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "quiz-456",
  "questionId": "q-123",
  "correctOptionId": "opt2",
  "statistics": {
    "opt1": { "count": 5, "percentage": 20 },
    "opt2": { "count": 20, "percentage": 80 }
  }
}
```

**Client Action:** Show correct answer and statistics

---

#### leaderboard-updated
Broadcast when leaderboard changes.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "quiz-456",
  "leaderboard": [
    {
      "participantId": "p-1",
      "nickname": "Alice",
      "score": 1500,
      "streak": 3,
      "rank": 1
    },
    {
      "participantId": "p-2",
      "nickname": "Bob",
      "score": 1200,
      "streak": 2,
      "rank": 2
    }
  ],
  "topCount": 10
}
```

**Client Action:** Update leaderboard display

---

#### quiz-ended
Broadcast when quiz completes.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "quiz-456",
  "finalLeaderboard": [...],
  "topThree": [
    { "participantId": "p-1", "nickname": "Alice", "score": 1500 },
    { "participantId": "p-2", "nickname": "Bob", "score": 1200 },
    { "participantId": "p-3", "nickname": "Charlie", "score": 1000 }
  ]
}
```

**Client Action:** Display final results and podium

---

### Client → Server

#### submit-answer
Submit an answer to a quiz question.

**Emit:**
```javascript
socket.emit('submit-answer', {
  eventId: 'event-123',
  activityId: 'quiz-456',
  questionId: 'q-123',
  participantId: 'p-1',
  selectedOptionId: 'opt2',
  timeElapsed: 5.2  // seconds
});
```

**Response:** Server processes answer and may emit `leaderboard-updated`

---

## Poll Events

### Server → Client

#### poll-started
Broadcast when a poll starts.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "question": "What is your favorite programming language?",
  "options": [
    { "id": "option-0-abc123", "text": "JavaScript", "voteCount": 0 },
    { "id": "option-1-def456", "text": "Python", "voteCount": 0 },
    { "id": "option-2-ghi789", "text": "TypeScript", "voteCount": 0 }
  ],
  "allowMultipleVotes": false,
  "showResultsLive": true
}
```

**Triggered by:** `POST /api/activities/:activityId/start-poll`

**Client Action:** Display poll question and voting interface

---

#### poll-vote-submitted
Broadcast when a participant votes.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "participantId": "p-1"
}
```

**Triggered by:** `POST /api/activities/:activityId/vote`

**Client Action:** Show vote confirmation, disable voting for that participant

---

#### poll-results-updated
Broadcast when vote counts change (if live results enabled).

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "results": {
    "pollId": "poll-456",
    "totalVotes": 25,
    "options": [
      { "id": "option-0-abc123", "text": "JavaScript", "voteCount": 10 },
      { "id": "option-1-def456", "text": "Python", "voteCount": 15 }
    ]
  }
}
```

**Triggered by:** Vote submission when `showResultsLive` is true

**Client Action:** Update live results chart/display

---

#### poll-ended
Broadcast when poll ends.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "poll-456",
  "finalResults": {
    "pollId": "poll-456",
    "totalVotes": 50,
    "options": [
      { "id": "option-0-abc123", "text": "JavaScript", "voteCount": 20 },
      { "id": "option-1-def456", "text": "Python", "voteCount": 30 }
    ]
  }
}
```

**Triggered by:** `POST /api/activities/:activityId/end-poll`

**Client Action:** Display final results, disable voting

---

### Client → Server

#### submit-vote
Submit a vote for a poll.

**Emit:**
```javascript
socket.emit('submit-vote', {
  eventId: 'event-123',
  activityId: 'poll-456',
  participantId: 'p-1',
  optionIds: ['option-0-abc123']  // Array for multiple vote support
});
```

**Response:** Server emits `poll-vote-submitted` and optionally `poll-results-updated`

---

## Raffle Events

### Server → Client

#### raffle-started
Broadcast when a raffle starts.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "raffle-456",
  "prizeDescription": "iPad Pro 12.9-inch",
  "entryMethod": "manual",
  "winnerCount": 3
}
```

**Triggered by:** `POST /api/activities/:activityId/start-raffle`

**Client Action:** Display raffle information and entry interface

---

#### raffle-entry-confirmed
Broadcast when a participant enters.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "raffle-456",
  "participantId": "p-1",
  "totalEntries": 25
}
```

**Triggered by:** `POST /api/activities/:activityId/enter`

**Client Action:** Show entry confirmation, update entry count

---

#### raffle-drawing
Broadcast when winner drawing begins.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "raffle-456",
  "message": "Drawing winners..."
}
```

**Triggered by:** `POST /api/activities/:activityId/draw-winners`

**Client Action:** Show drawing animation/suspense

---

#### raffle-winners-announced
Broadcast when winners are revealed.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "raffle-456",
  "winners": [
    {
      "participantId": "p-1",
      "participantName": "Alice"
    },
    {
      "participantId": "p-5",
      "participantName": "Bob"
    },
    {
      "participantId": "p-12",
      "participantName": "Charlie"
    }
  ]
}
```

**Triggered by:** `POST /api/activities/:activityId/draw-winners`

**Client Action:** Display winners with celebration animation

---

#### raffle-ended
Broadcast when raffle ends.

**Payload:**
```json
{
  "eventId": "event-123",
  "activityId": "raffle-456",
  "results": {
    "raffleId": "raffle-456",
    "prizeDescription": "iPad Pro",
    "totalEntries": 50,
    "winnerCount": 3,
    "winners": [...]
  }
}
```

**Triggered by:** `POST /api/activities/:activityId/end-raffle`

**Client Action:** Display final results

---

### Client → Server

#### enter-raffle
Enter a raffle.

**Emit:**
```javascript
socket.emit('enter-raffle', {
  eventId: 'event-123',
  activityId: 'raffle-456',
  participantId: 'p-1',
  participantName: 'Alice'
});
```

**Response:** Server emits `raffle-entry-confirmed`

---

## Participant Events

### Server → Client

#### participant-joined
Broadcast when a new participant joins.

**Payload:**
```json
{
  "eventId": "event-123",
  "participant": {
    "participantId": "p-1",
    "nickname": "Alice",
    "joinedAt": 1234567890
  },
  "participantCount": 26
}
```

**Client Action:** Update participant count display

---

#### participant-left
Broadcast when a participant leaves.

**Payload:**
```json
{
  "eventId": "event-123",
  "participantId": "p-1",
  "participantCount": 25
}
```

**Client Action:** Update participant count display

---

## Error Events

### Server → Client

#### error
Sent when an error occurs.

**Payload:**
```json
{
  "error": "ValidationError",
  "message": "Cannot vote twice in the same poll",
  "code": "DUPLICATE_VOTE"
}
```

**Client Action:** Display error message to user

---

## Event Flow Diagrams

### Quiz Activity Flow

```
Organizer                    Server                      Participants
    |                          |                              |
    |-- POST activate --------->|                              |
    |                          |-- activity-activated ------->|
    |                          |                              |-- Show quiz UI
    |                          |                              |
    |-- Start quiz ----------->|                              |
    |                          |-- quiz-started ------------->|
    |                          |                              |
    |-- Reveal question ------->|                              |
    |                          |-- question-revealed -------->|
    |                          |                              |-- Show question
    |                          |                              |
    |                          |<-- submit-answer ------------|
    |                          |                              |
    |-- Reveal answer -------->|                              |
    |                          |-- answer-results-revealed -->|
    |                          |-- leaderboard-updated ------>|
    |                          |                              |
    |-- End quiz ------------->|                              |
    |                          |-- quiz-ended --------------->|
    |                          |                              |-- Show results
```

### Poll Activity Flow

```
Organizer                    Server                      Participants
    |                          |                              |
    |-- POST activate --------->|                              |
    |                          |-- activity-activated ------->|
    |                          |                              |-- Show poll UI
    |                          |                              |
    |-- Start poll ----------->|                              |
    |                          |-- poll-started ------------->|
    |                          |                              |-- Show voting
    |                          |                              |
    |                          |<-- submit-vote --------------|
    |                          |-- poll-vote-submitted ------>|
    |                          |-- poll-results-updated ----->|
    |                          |                              |-- Update results
    |                          |                              |
    |-- End poll ------------->|                              |
    |                          |-- poll-ended --------------->|
    |                          |                              |-- Show final
```

### Raffle Activity Flow

```
Organizer                    Server                      Participants
    |                          |                              |
    |-- POST activate --------->|                              |
    |                          |-- activity-activated ------->|
    |                          |                              |-- Show raffle UI
    |                          |                              |
    |-- Start raffle --------->|                              |
    |                          |-- raffle-started ----------->|
    |                          |                              |-- Show entry
    |                          |                              |
    |                          |<-- enter-raffle -------------|
    |                          |-- raffle-entry-confirmed --->|
    |                          |                              |
    |-- Draw winners --------->|                              |
    |                          |-- raffle-drawing ----------->|
    |                          |-- raffle-winners-announced ->|
    |                          |                              |-- Show winners
    |                          |                              |
    |-- End raffle ----------->|                              |
    |                          |-- raffle-ended ------------->|
```

### Activity Switching Flow

```
Organizer                    Server                      Participants
    |                          |                              |
    |-- Activate Quiz -------->|                              |
    |                          |-- activity-activated ------->|
    |                          |                              |-- Show quiz
    |                          |                              |
    |   ... quiz runs ...      |                              |
    |                          |                              |
    |-- Activate Poll -------->|                              |
    |                          |-- activity-deactivated ----->|
    |                          |-- activity-activated ------->|
    |                          |                              |-- Show poll
    |                          |                              |
    |   ... poll runs ...      |                              |
    |                          |                              |
    |-- Deactivate ----------->|                              |
    |                          |-- activity-deactivated ----->|
    |                          |-- waiting-for-activity ----->|
    |                          |                              |-- Show waiting
```

---

## Client Implementation Examples

### React Hook for Activity Events

```javascript
import { useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketContext';

export function useActivityState(eventId) {
  const socket = useWebSocket();
  const [activeActivity, setActiveActivity] = useState(null);
  const [isWaiting, setIsWaiting] = useState(true);

  useEffect(() => {
    if (!socket || !eventId) return;

    // Join event room
    socket.emit('join-event', { eventId });

    // Listen for activity activation
    socket.on('activity-activated', (data) => {
      setActiveActivity(data.activity);
      setIsWaiting(false);
    });

    // Listen for activity deactivation
    socket.on('activity-deactivated', () => {
      setActiveActivity(null);
      setIsWaiting(true);
    });

    // Listen for waiting state
    socket.on('waiting-for-activity', () => {
      setActiveActivity(null);
      setIsWaiting(true);
    });

    return () => {
      socket.off('activity-activated');
      socket.off('activity-deactivated');
      socket.off('waiting-for-activity');
    };
  }, [socket, eventId]);

  return { activeActivity, isWaiting };
}
```

### Vanilla JavaScript Example

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Join event
socket.emit('join-event', {
  eventId: 'event-123',
  nickname: 'John Doe'
});

// Handle activity activation
socket.on('activity-activated', (data) => {
  console.log('Activity activated:', data.activity);
  
  switch (data.activity.type) {
    case 'quiz':
      renderQuizInterface(data.activity);
      break;
    case 'poll':
      renderPollInterface(data.activity);
      break;
    case 'raffle':
      renderRaffleInterface(data.activity);
      break;
  }
});

// Handle waiting state
socket.on('waiting-for-activity', (data) => {
  console.log('Waiting for activity');
  renderWaitingScreen(data);
});

// Handle poll events
socket.on('poll-started', (data) => {
  console.log('Poll started:', data.question);
  displayPollQuestion(data);
});

socket.on('poll-results-updated', (data) => {
  console.log('Results updated:', data.results);
  updateResultsChart(data.results);
});

// Submit vote
function submitVote(optionId) {
  socket.emit('submit-vote', {
    eventId: 'event-123',
    activityId: currentActivityId,
    participantId: myParticipantId,
    optionIds: [optionId]
  });
}
```

---

## Best Practices

### Connection Management

1. **Reconnection Logic**: Implement automatic reconnection with exponential backoff
2. **State Synchronization**: Request current state after reconnection
3. **Heartbeat**: Use Socket.io's built-in ping/pong for connection health

### Event Handling

1. **Cleanup**: Always remove event listeners in cleanup functions
2. **Error Handling**: Listen for `error` events and handle gracefully
3. **Debouncing**: Debounce rapid events (e.g., live results updates)

### Performance

1. **Room Management**: Only join rooms you need
2. **Selective Listening**: Only listen for events relevant to current view
3. **Batch Updates**: Batch UI updates when receiving multiple events

---

## Troubleshooting

### Common Issues

**Issue:** Not receiving events
- **Solution:** Ensure you've joined the event room with `join-event`

**Issue:** Duplicate events
- **Solution:** Check that event listeners aren't registered multiple times

**Issue:** Connection drops
- **Solution:** Implement reconnection logic and state resynchronization

**Issue:** Events out of order
- **Solution:** Use timestamps and sequence numbers for ordering

---

**Last Updated:** November 30, 2025
**Version:** 2.0 (Event Activities Platform)
