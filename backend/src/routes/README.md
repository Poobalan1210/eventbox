# REST API Endpoints

## Event Management

### Create Event
**POST** `/api/events`

Creates a new quiz event with a unique ID, join link, and QR code.

**Request Body:**
```json
{
  "name": "My Quiz Event"
}
```

**Response:** `201 Created`
```json
{
  "eventId": "uuid",
  "joinLink": "http://localhost:3000/join/uuid",
  "qrCode": "data:image/png;base64,..."
}
```

### Get Event Details
**GET** `/api/events/:eventId`

Retrieves event details including all questions.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "My Quiz Event",
  "status": "waiting",
  "questions": [...]
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "NotFound",
  "message": "Event not found"
}
```

## Question Management

### Add Question
**POST** `/api/events/:eventId/questions`

Adds a new question to an event.

**Request Body:**
```json
{
  "text": "What is 2+2?",
  "options": [
    { "id": "a", "text": "3" },
    { "id": "b", "text": "4" },
    { "id": "c", "text": "5" }
  ],
  "correctOptionId": "b",
  "timerSeconds": 30
}
```

**Response:** `201 Created`
```json
{
  "questionId": "uuid"
}
```

**Validation Rules:**
- 2-5 answer options required
- Exactly one correct answer required
- `correctOptionId` must match one of the option IDs
- `timerSeconds` is optional (max 300 seconds)

### Update Question
**PUT** `/api/events/:eventId/questions/:questionId`

Updates an existing question.

**Request Body:** Same as Add Question

**Response:** `200 OK`
```json
{
  "success": true
}
```

### Delete Question
**DELETE** `/api/events/:eventId/questions/:questionId`

Deletes a question from an event.

**Response:** `200 OK`
```json
{
  "success": true
}
```

## Error Responses

### Validation Error
**Status:** `400 Bad Request`
```json
{
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": [
    {
      "path": "name",
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

### Not Found
**Status:** `404 Not Found`
```json
{
  "error": "NotFound",
  "message": "Event not found"
}
```

### Internal Server Error
**Status:** `500 Internal Server Error`
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred"
}
```
