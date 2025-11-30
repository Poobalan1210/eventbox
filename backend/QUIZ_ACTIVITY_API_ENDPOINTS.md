# Quiz Activity API Endpoints

This document describes the new API endpoints for managing questions within quiz activities.

## Overview

These endpoints allow organizers to manage questions for quiz activities. They follow the activity-based architecture where questions are associated with activities rather than directly with events.

## Endpoints

### 1. Add Question to Quiz Activity

**POST** `/api/activities/:activityId/questions`

Adds a new question to a quiz activity.

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
  "timerSeconds": 30
}
```

**Response (201 Created):**
```json
{
  "questionId": "question-1234567890-abc123",
  "question": {
    "questionId": "question-1234567890-abc123",
    "id": "question-1234567890-abc123",
    "eventId": "event-123",
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

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid data
- `404 Not Found` - Activity not found
- `400 Bad Request` - Activity is not a quiz

---

### 2. Update Question in Quiz Activity

**PUT** `/api/activities/:activityId/questions/:questionId`

Updates an existing question in a quiz activity.

**Request Body:**
```json
{
  "text": "What is 3 + 3?",
  "options": [
    { "id": "opt1", "text": "5" },
    { "id": "opt2", "text": "6" },
    { "id": "opt3", "text": "7" },
    { "id": "opt4", "text": "8" }
  ],
  "correctOptionId": "opt2",
  "timerSeconds": 25
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid data
- `404 Not Found` - Activity not found
- `400 Bad Request` - Activity is not a quiz

---

### 3. Delete Question from Quiz Activity

**DELETE** `/api/activities/:activityId/questions/:questionId`

Deletes a question from a quiz activity.

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `404 Not Found` - Activity not found
- `400 Bad Request` - Activity is not a quiz

---

### 4. Get All Questions for Quiz Activity

**GET** `/api/activities/:activityId/questions`

Retrieves all questions for a quiz activity.

**Response (200 OK):**
```json
{
  "questions": [
    {
      "questionId": "question-1234567890-abc123",
      "id": "question-1234567890-abc123",
      "eventId": "event-123",
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
  ]
}
```

**Error Responses:**
- `404 Not Found` - Activity not found
- `400 Bad Request` - Activity is not a quiz

---

## Features

### Automatic Color and Shape Assignment

When adding or updating questions, the system automatically assigns colors and shapes to answer options based on their index:
- Option 0: Red Triangle
- Option 1: Blue Diamond
- Option 2: Orange Circle
- Option 3: Green Square

This ensures consistent visual styling across the application.

### Question Ordering

Questions are automatically ordered based on when they are added. The first question gets `order: 0`, the second gets `order: 1`, and so on.

### WebSocket Events

All question operations emit WebSocket events for real-time updates:
- `question-added` - When a question is added
- `question-updated` - When a question is updated
- `question-deleted` - When a question is deleted

These events are broadcast to all clients connected to the event room.

---

## Migration from Event-Based Endpoints

The existing event-based question endpoints (`/api/events/:eventId/questions`) continue to work for backward compatibility. However, new applications should use the activity-based endpoints.

**Old Endpoint:**
```
POST /api/events/:eventId/questions
```

**New Endpoint:**
```
POST /api/activities/:activityId/questions
```

The main difference is that the new endpoints:
1. Work with activity IDs instead of event IDs
2. Validate that the activity is a quiz type
3. Support the new event-activities architecture

---

## Testing

A test script is available at `backend/test-quiz-activity-endpoints.ts` that demonstrates how to use these endpoints.

To run the test script:
```bash
# Start the backend server
npm run dev

# In another terminal, run the test script
npx tsx test-quiz-activity-endpoints.ts
```

---

## Requirements Validation

These endpoints satisfy **Requirement 3.1** from the requirements document:

> WHEN an organizer configures a quiz activity THEN the Event System SHALL allow adding, editing, and removing questions with multiple choice answers

The implementation provides:
- ✅ Adding questions to quiz activities
- ✅ Editing questions in quiz activities
- ✅ Removing questions from quiz activities
- ✅ Multiple choice answer support
- ✅ Validation that operations only work on quiz activities
