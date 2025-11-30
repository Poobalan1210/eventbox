# API Quick Reference

Quick reference for the Event Activities Platform API with common use cases and code examples.

---

## Quick Links

- [Full API Documentation](./API_DOCUMENTATION.md)
- [WebSocket Events Reference](./WEBSOCKET_EVENTS_REFERENCE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)

---

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

---

## Common Workflows

### 1. Create Event with Quiz

```javascript
// Step 1: Create event
const eventRes = await fetch('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Tech Conference 2025',
    organizerId: 'org-123',
    visibility: 'private'
  })
});
const { eventId, event } = await eventRes.json();
console.log('Join code:', event.gamePin);

// Step 2: Create quiz activity
const quizRes = await fetch(`/api/events/${eventId}/activities`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Trivia Quiz',
    type: 'quiz',
    scoringEnabled: true,
    speedBonusEnabled: true,
    streakTrackingEnabled: true
  })
});
const { activityId } = await quizRes.json();

// Step 3: Add questions
await fetch(`/api/activities/${activityId}/questions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'What is the capital of France?',
    options: [
      { id: 'a', text: 'London' },
      { id: 'b', text: 'Paris' },
      { id: 'c', text: 'Berlin' },
      { id: 'd', text: 'Madrid' }
    ],
    correctOptionId: 'b',
    timerSeconds: 30
  })
});

// Step 4: Activate quiz
await fetch(`/api/activities/${activityId}/activate`, {
  method: 'POST'
});
```

### 2. Create Event with Poll

```javascript
// Create event
const { eventId } = await createEvent('Town Hall Meeting');

// Create poll activity
const pollRes = await fetch(`/api/events/${eventId}/activities`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Budget Priority Poll',
    type: 'poll',
    question: 'What should be our top budget priority?',
    options: ['Infrastructure', 'Education', 'Healthcare', 'Environment'],
    allowMultipleVotes: false,
    showResultsLive: true
  })
});
const { activityId } = await pollRes.json();

// Activate poll
await fetch(`/api/activities/${activityId}/activate`, {
  method: 'POST'
});
```

### 3. Create Event with Raffle

```javascript
// Create event
const { eventId } = await createEvent('Product Launch');

// Create raffle activity
const raffleRes = await fetch(`/api/events/${eventId}/activities`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Grand Prize Draw',
    type: 'raffle',
    prizeDescription: 'iPad Pro 12.9" + Apple Pencil',
    entryMethod: 'manual',
    winnerCount: 3
  })
});
const { activityId } = await raffleRes.json();

// Activate raffle
await fetch(`/api/activities/${activityId}/activate`, {
  method: 'POST'
});

// Later: Draw winners
const winnersRes = await fetch(`/api/activities/${activityId}/draw-winners`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ count: 3 })
});
const { winners } = await winnersRes.json();
```

### 4. Multi-Activity Event

```javascript
// Create event
const { eventId } = await createEvent('Annual Conference');

// Add quiz
const quiz = await createActivity(eventId, {
  name: 'Icebreaker Quiz',
  type: 'quiz',
  scoringEnabled: true
});

// Add poll
const poll = await createActivity(eventId, {
  name: 'Session Feedback',
  type: 'poll',
  question: 'How was the keynote?',
  options: ['Excellent', 'Good', 'Fair', 'Poor'],
  showResultsLive: true
});

// Add raffle
const raffle = await createActivity(eventId, {
  name: 'Door Prize',
  type: 'raffle',
  prizeDescription: 'Conference Swag Bag',
  entryMethod: 'automatic',
  winnerCount: 5
});

// Run activities in sequence
await activateActivity(quiz.activityId);
// ... quiz runs ...
await activateActivity(poll.activityId);
// ... poll runs ...
await activateActivity(raffle.activityId);
// ... raffle runs ...
```

---

## Endpoint Cheat Sheet

### Events

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/events` | Create event |
| GET | `/api/events/:eventId` | Get event details |
| PUT | `/api/events/:eventId` | Update event |
| DELETE | `/api/events/:eventId` | Delete event |

### Activities

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/events/:eventId/activities` | Create activity |
| GET | `/api/events/:eventId/activities` | List activities |
| GET | `/api/activities/:activityId` | Get activity details |
| PUT | `/api/activities/:activityId` | Update activity |
| DELETE | `/api/activities/:activityId` | Delete activity |
| POST | `/api/activities/:activityId/activate` | Activate activity |
| POST | `/api/activities/:activityId/deactivate` | Deactivate activity |

### Quiz Activities

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/activities/:activityId/questions` | Add question |
| GET | `/api/activities/:activityId/questions` | List questions |
| PUT | `/api/activities/:activityId/questions/:questionId` | Update question |
| DELETE | `/api/activities/:activityId/questions/:questionId` | Delete question |

### Poll Activities

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/activities/:activityId/configure-poll` | Configure poll |
| POST | `/api/activities/:activityId/start-poll` | Start poll |
| POST | `/api/activities/:activityId/vote` | Submit vote |
| GET | `/api/activities/:activityId/poll-results` | Get results |
| POST | `/api/activities/:activityId/end-poll` | End poll |

### Raffle Activities

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/activities/:activityId/configure-raffle` | Configure raffle |
| POST | `/api/activities/:activityId/start-raffle` | Start raffle |
| POST | `/api/activities/:activityId/enter` | Enter raffle |
| POST | `/api/activities/:activityId/draw-winners` | Draw winners |
| POST | `/api/activities/:activityId/end-raffle` | End raffle |

---

## WebSocket Events Cheat Sheet

### Activity Lifecycle

| Event | Direction | When |
|-------|-----------|------|
| `activity-activated` | Server → Client | Activity becomes active |
| `activity-deactivated` | Server → Client | Activity is deactivated |
| `waiting-for-activity` | Server → Client | No activity active |

### Quiz Events

| Event | Direction | When |
|-------|-----------|------|
| `quiz-started` | Server → Client | Quiz begins |
| `question-revealed` | Server → Client | New question shown |
| `answer-results-revealed` | Server → Client | Answer revealed |
| `leaderboard-updated` | Server → Client | Scores change |
| `quiz-ended` | Server → Client | Quiz completes |
| `submit-answer` | Client → Server | Participant answers |

### Poll Events

| Event | Direction | When |
|-------|-----------|------|
| `poll-started` | Server → Client | Poll begins |
| `poll-vote-submitted` | Server → Client | Someone votes |
| `poll-results-updated` | Server → Client | Results change |
| `poll-ended` | Server → Client | Poll completes |
| `submit-vote` | Client → Server | Participant votes |

### Raffle Events

| Event | Direction | When |
|-------|-----------|------|
| `raffle-started` | Server → Client | Raffle begins |
| `raffle-entry-confirmed` | Server → Client | Someone enters |
| `raffle-drawing` | Server → Client | Drawing starts |
| `raffle-winners-announced` | Server → Client | Winners revealed |
| `raffle-ended` | Server → Client | Raffle completes |
| `enter-raffle` | Client → Server | Participant enters |

---

## Code Snippets

### React: Activity State Hook

```javascript
import { useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketContext';

export function useActivityState(eventId) {
  const socket = useWebSocket();
  const [activeActivity, setActiveActivity] = useState(null);
  const [isWaiting, setIsWaiting] = useState(true);

  useEffect(() => {
    if (!socket || !eventId) return;

    socket.emit('join-event', { eventId });

    socket.on('activity-activated', (data) => {
      setActiveActivity(data.activity);
      setIsWaiting(false);
    });

    socket.on('activity-deactivated', () => {
      setActiveActivity(null);
      setIsWaiting(true);
    });

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

### React: Dynamic Activity View

```javascript
function ParticipantActivityView({ eventId }) {
  const { activeActivity, isWaiting } = useActivityState(eventId);

  if (isWaiting) {
    return <WaitingForActivity />;
  }

  switch (activeActivity?.type) {
    case 'quiz':
      return <QuizInterface activity={activeActivity} />;
    case 'poll':
      return <PollInterface activity={activeActivity} />;
    case 'raffle':
      return <RaffleInterface activity={activeActivity} />;
    default:
      return <WaitingForActivity />;
  }
}
```

### Node.js: Create Complete Event

```javascript
async function createCompleteEvent(organizerId) {
  // Create event
  const event = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Complete Event',
      organizerId,
      visibility: 'private'
    })
  }).then(r => r.json());

  // Add quiz
  const quiz = await fetch(`/api/events/${event.eventId}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Quiz',
      type: 'quiz',
      scoringEnabled: true
    })
  }).then(r => r.json());

  // Add questions
  for (const q of questions) {
    await fetch(`/api/activities/${quiz.activityId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q)
    });
  }

  // Add poll
  const poll = await fetch(`/api/events/${event.eventId}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Poll',
      type: 'poll',
      question: 'How was the quiz?',
      options: ['Great', 'Good', 'Okay', 'Poor'],
      showResultsLive: true
    })
  }).then(r => r.json());

  return { event, quiz, poll };
}
```

### Python: API Client

```python
import requests

class EventActivitiesClient:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def create_event(self, name, organizer_id, visibility='private'):
        response = requests.post(
            f'{self.base_url}/api/events',
            json={
                'name': name,
                'organizerId': organizer_id,
                'visibility': visibility
            }
        )
        return response.json()
    
    def create_quiz_activity(self, event_id, name):
        response = requests.post(
            f'{self.base_url}/api/events/{event_id}/activities',
            json={
                'name': name,
                'type': 'quiz',
                'scoringEnabled': True
            }
        )
        return response.json()
    
    def add_question(self, activity_id, question_data):
        response = requests.post(
            f'{self.base_url}/api/activities/{activity_id}/questions',
            json=question_data
        )
        return response.json()
    
    def activate_activity(self, activity_id):
        response = requests.post(
            f'{self.base_url}/api/activities/{activity_id}/activate'
        )
        return response.json()

# Usage
client = EventActivitiesClient('http://localhost:3000')
event = client.create_event('My Event', 'org-123')
quiz = client.create_quiz_activity(event['eventId'], 'My Quiz')
client.add_question(quiz['activityId'], {
    'text': 'What is 2 + 2?',
    'options': [
        {'id': 'a', 'text': '3'},
        {'id': 'b', 'text': '4'}
    ],
    'correctOptionId': 'b',
    'timerSeconds': 30
})
client.activate_activity(quiz['activityId'])
```

---

## Testing Commands

```bash
# Start development server
npm run dev

# Test activity endpoints
npx tsx backend/test-activity-endpoints.ts

# Test poll endpoints
npx tsx backend/test-poll-endpoints.ts

# Test raffle endpoints
npx tsx backend/test-raffle-endpoints.ts

# Test quiz endpoints
npx tsx backend/test-quiz-activity-endpoints.ts

# Run all tests
npm test

# Run integration tests
npm run test:integration
```

---

## Common Errors

### 400 Bad Request
```json
{
  "error": "BadRequest",
  "message": "Activity name is required"
}
```
**Fix:** Ensure all required fields are provided

### 404 Not Found
```json
{
  "error": "NotFound",
  "message": "Activity not found"
}
```
**Fix:** Verify the activity ID exists

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Participant has already voted"
}
```
**Fix:** Check if action has already been performed

### 422 Unprocessable Entity
```json
{
  "error": "ValidationError",
  "message": "Cannot activate activity in draft status"
}
```
**Fix:** Ensure activity is in correct state (e.g., 'ready' before activating)

---

## Environment Variables

```bash
# Backend (.env)
PORT=3000
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=dev-
NODE_ENV=development

# Frontend (.env)
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## Useful Links

- [Full API Documentation](./API_DOCUMENTATION.md)
- [WebSocket Events Reference](./WEBSOCKET_EVENTS_REFERENCE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Design Document](./.kiro/specs/event-activities-platform/design.md)
- [Requirements Document](./.kiro/specs/event-activities-platform/requirements.md)

---

**Last Updated:** November 30, 2025
