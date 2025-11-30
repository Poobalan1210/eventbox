# Activity API Endpoints

This document describes the REST API endpoints for managing activities within events.

## Overview

Activities are interactive components (quiz, poll, raffle) that belong to an event. Organizers can create multiple activities for an event and control which one is currently active for participants.

## Endpoints

### Create Activity

**POST** `/api/events/:eventId/activities`

Creates a new activity for an event.

**Request Body:**
```json
{
  "name": "My Quiz Activity",
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
  "activityId": "uuid",
  "activity": {
    "activityId": "uuid",
    "eventId": "event-uuid",
    "type": "quiz",
    "name": "My Quiz Activity",
    "status": "draft",
    "order": 0,
    "createdAt": 1234567890,
    "lastModified": 1234567890,
    ...
  }
}
```

---

### List Activities

**GET** `/api/events/:eventId/activities`

Retrieves all activities for an event, sorted by order.

**Response:** `200 OK`
```json
{
  "activities": [
    {
      "activityId": "uuid",
      "eventId": "event-uuid",
      "type": "quiz",
      "name": "My Quiz Activity",
      "status": "draft",
      "order": 0,
      ...
    },
    {
      "activityId": "uuid2",
      "eventId": "event-uuid",
      "type": "poll",
      "name": "Favorite Color Poll",
      "status": "ready",
      "order": 1,
      ...
    }
  ]
}
```

---

### Get Activity Details

**GET** `/api/activities/:activityId`

Retrieves details for a specific activity.

**Response:** `200 OK`
```json
{
  "activity": {
    "activityId": "uuid",
    "eventId": "event-uuid",
    "type": "quiz",
    "name": "My Quiz Activity",
    "status": "draft",
    "order": 0,
    "createdAt": 1234567890,
    "lastModified": 1234567890,
    "questions": [],
    "currentQuestionIndex": 0,
    "scoringEnabled": true,
    "speedBonusEnabled": true,
    "streakTrackingEnabled": true
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "NotFound",
  "message": "Activity not found"
}
```

---

### Update Activity

**PUT** `/api/activities/:activityId`

Updates an existing activity.

**Request Body:**
```json
{
  "name": "Updated Activity Name",
  "status": "ready"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "activity": {
    "activityId": "uuid",
    "name": "Updated Activity Name",
    "status": "ready",
    ...
  }
}
```

---

### Delete Activity

**DELETE** `/api/activities/:activityId`

Deletes an activity. Cannot delete an activity that is currently active.

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Error Response:** `400 Bad Request`
```json
{
  "error": "BadRequest",
  "message": "Cannot delete currently active activity. Deactivate it first."
}
```

---

### Activate Activity

**POST** `/api/activities/:activityId/activate`

Activates an activity, making it visible to participants. Automatically deactivates any previously active activity.

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Error Response:** `422 Unprocessable Entity`
```json
{
  "error": "ValidationError",
  "message": "Cannot activate activity in draft status. Activity must be ready."
}
```

---

### Deactivate Activity

**POST** `/api/activities/:activityId/deactivate`

Deactivates the currently active activity, returning participants to a waiting state.

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Error Response:** `400 Bad Request`
```json
{
  "error": "BadRequest",
  "message": "Activity activity-123 is not currently active"
}
```

---

## Activity Types

### Quiz Activity
- **Type:** `quiz`
- **Fields:**
  - `questions`: Array of question objects
  - `currentQuestionIndex`: Current question being displayed
  - `scoringEnabled`: Whether scoring is enabled
  - `speedBonusEnabled`: Whether speed bonus points are awarded
  - `streakTrackingEnabled`: Whether answer streaks are tracked

### Poll Activity
- **Type:** `poll`
- **Fields:**
  - `question`: The poll question
  - `options`: Array of poll options with vote counts
  - `allowMultipleVotes`: Whether participants can select multiple options
  - `showResultsLive`: Whether results are shown in real-time

### Raffle Activity
- **Type:** `raffle`
- **Fields:**
  - `prizeDescription`: Description of the prize
  - `entryMethod`: `'automatic'` or `'manual'`
  - `winnerCount`: Number of winners to select
  - `winners`: Array of winner participant IDs

---

## Activity Status

Activities progress through the following statuses:

- **draft**: Initial state, being configured
- **ready**: Configuration complete, ready to activate
- **active**: Currently active for participants
- **completed**: Finished, no longer active

---

## WebSocket Events

When activities are created, updated, activated, or deactivated, the following WebSocket events are emitted:

- `activity-created`: Emitted when a new activity is created
- `activity-updated`: Emitted when an activity is updated
- `activity-activated`: Emitted when an activity is activated
- `activity-deactivated`: Emitted when an activity is deactivated
- `activity-deleted`: Emitted when an activity is deleted

---

## Testing

To test the endpoints manually, you can run:

```bash
# Start the server
npm run dev

# In another terminal, run the test script
npx tsx test-activity-endpoints.ts
```

This will test all activity endpoints and provide a summary of results.
