# Organizer UX Improvements - API Documentation

## Overview

This document provides comprehensive API documentation for the new endpoints introduced as part of the Organizer UX Improvements feature. These endpoints enable enhanced quiz management, template functionality, privacy controls, and public quiz discovery.

---

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.your-domain.com/api`

---

## Authentication

All organizer-specific endpoints require authentication. Include the organizer's user ID in the request headers or as specified in the endpoint documentation.

---

## Quiz Management Endpoints

### Get Organizer's Quizzes

Retrieve all quizzes created by a specific organizer, categorized by status.

**Endpoint**: `GET /api/events/organizer/:organizerId`

**Parameters**:
- `organizerId` (path, required): The unique identifier of the organizer

**Query Parameters**:
- `status` (optional): Filter by status (`draft`, `setup`, `live`, `completed`)
- `search` (optional): Search by quiz name or topic
- `limit` (optional): Number of results per page (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response**: `200 OK`
```json
{
  "quizzes": [
    {
      "eventId": "evt_123456",
      "name": "Math Quiz",
      "status": "live",
      "visibility": "public",
      "participantCount": 25,
      "createdAt": "2025-11-20T10:00:00Z",
      "lastModified": "2025-11-28T14:30:00Z",
      "startedAt": "2025-11-28T14:00:00Z",
      "topic": "Mathematics",
      "description": "Basic algebra and geometry",
      "gamePin": "123456"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

**Error Responses**:
- `404 Not Found`: Organizer not found
- `500 Internal Server Error`: Server error

---

### Update Quiz Status

Update the status of a quiz (e.g., transition from setup to live mode).

**Endpoint**: `PATCH /api/events/:eventId/status`

**Parameters**:
- `eventId` (path, required): The unique identifier of the quiz

**Request Body**:
```json
{
  "status": "live"
}
```

**Valid Status Transitions**:
- `draft` → `setup`
- `setup` → `live`
- `live` → `completed`

**Response**: `200 OK`
```json
{
  "eventId": "evt_123456",
  "status": "live",
  "startedAt": "2025-11-28T14:00:00Z",
  "gamePin": "123456"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid status transition or quiz validation failed
- `403 Forbidden`: Not authorized to modify this quiz
- `404 Not Found`: Quiz not found
- `500 Internal Server Error`: Server error

**Validation Rules**:
- Quiz must have at least one question to transition to `live`
- Each question must have at least 2 answer options
- Each question must have at least one correct answer

---

### Update Quiz Visibility

Change the privacy setting of a quiz between private and public.

**Endpoint**: `PATCH /api/events/:eventId/visibility`

**Parameters**:
- `eventId` (path, required): The unique identifier of the quiz

**Request Body**:
```json
{
  "visibility": "public"
}
```

**Valid Values**: `private`, `public`

**Response**: `200 OK`
```json
{
  "eventId": "evt_123456",
  "visibility": "public",
  "lastModified": "2025-11-28T14:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid visibility value
- `403 Forbidden`: Cannot change visibility of live quiz
- `404 Not Found`: Quiz not found
- `500 Internal Server Error`: Server error

**Notes**:
- Visibility cannot be changed once a quiz is live
- Public quizzes appear in the public quiz browser

---

## Template Management Endpoints

### Create Template

Save a quiz as a reusable template.

**Endpoint**: `POST /api/templates`

**Request Body**:
```json
{
  "eventId": "evt_123456",
  "name": "Math Quiz Template",
  "description": "Basic algebra and geometry questions",
  "isPublic": false
}
```

**Response**: `201 Created`
```json
{
  "templateId": "tpl_789012",
  "name": "Math Quiz Template",
  "description": "Basic algebra and geometry questions",
  "organizerId": "org_456789",
  "questionCount": 10,
  "topic": "Mathematics",
  "isPublic": false,
  "createdAt": "2025-11-28T14:30:00Z",
  "usageCount": 0
}
```

**Error Responses**:
- `400 Bad Request`: Invalid request body or event has no questions
- `403 Forbidden`: Not authorized to access this quiz
- `404 Not Found`: Event not found
- `500 Internal Server Error`: Server error

---

### Get Organizer's Templates

Retrieve all templates created by a specific organizer.

**Endpoint**: `GET /api/templates/organizer/:organizerId`

**Parameters**:
- `organizerId` (path, required): The unique identifier of the organizer

**Query Parameters**:
- `includePublic` (optional): Include public templates (default: true)
- `search` (optional): Search by template name or topic

**Response**: `200 OK`
```json
{
  "templates": [
    {
      "templateId": "tpl_789012",
      "name": "Math Quiz Template",
      "description": "Basic algebra and geometry questions",
      "organizerId": "org_456789",
      "questionCount": 10,
      "topic": "Mathematics",
      "isPublic": false,
      "createdAt": "2025-11-28T14:30:00Z",
      "usageCount": 5
    }
  ]
}
```

**Error Responses**:
- `404 Not Found`: Organizer not found
- `500 Internal Server Error`: Server error

---

### Get Public Templates

Retrieve all publicly available templates.

**Endpoint**: `GET /api/templates/public`

**Query Parameters**:
- `topic` (optional): Filter by topic
- `search` (optional): Search by template name or description
- `limit` (optional): Number of results per page (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response**: `200 OK`
```json
{
  "templates": [
    {
      "templateId": "tpl_789012",
      "name": "Math Quiz Template",
      "description": "Basic algebra and geometry questions",
      "organizerId": "org_456789",
      "questionCount": 10,
      "topic": "Mathematics",
      "createdAt": "2025-11-28T14:30:00Z",
      "usageCount": 15
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

**Error Responses**:
- `500 Internal Server Error`: Server error

---

### Create Event from Template

Create a new quiz based on an existing template.

**Endpoint**: `POST /api/events/from-template`

**Request Body**:
```json
{
  "templateId": "tpl_789012",
  "name": "My Math Quiz",
  "organizerId": "org_456789"
}
```

**Response**: `201 Created`
```json
{
  "eventId": "evt_234567",
  "name": "My Math Quiz",
  "organizerId": "org_456789",
  "status": "draft",
  "visibility": "private",
  "questionCount": 10,
  "createdAt": "2025-11-28T15:00:00Z",
  "templateId": "tpl_789012"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid request body
- `404 Not Found`: Template not found
- `500 Internal Server Error`: Server error

**Notes**:
- All questions from the template are copied to the new quiz
- The new quiz starts in `draft` status
- The organizer can edit questions before starting the quiz

---

## Public Quiz Discovery Endpoints

### Get Public Quizzes

Retrieve all public quizzes available for participants to join.

**Endpoint**: `GET /api/events/public`

**Query Parameters**:
- `status` (optional): Filter by status (`live`, `upcoming`)
- `search` (optional): Search by quiz name or topic
- `topic` (optional): Filter by specific topic
- `limit` (optional): Number of results per page (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response**: `200 OK`
```json
{
  "quizzes": [
    {
      "eventId": "evt_123456",
      "name": "Math Quiz",
      "status": "live",
      "participantCount": 25,
      "topic": "Mathematics",
      "description": "Basic algebra and geometry",
      "organizerId": "org_456789",
      "startedAt": "2025-11-28T14:00:00Z",
      "gamePin": "123456"
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

**Error Responses**:
- `500 Internal Server Error`: Server error

**Notes**:
- Only quizzes with `visibility: "public"` are returned
- Completed quizzes are not included
- Results are sorted by status (live first) then by start time

---

## WebSocket Events

### Dashboard Updates

Real-time updates for organizer dashboard.

**Event**: `dashboard:update`

**Payload**:
```json
{
  "eventId": "evt_123456",
  "type": "status_change" | "participant_joined" | "participant_left",
  "status": "live",
  "participantCount": 26
}
```

**Usage**:
```javascript
socket.on('dashboard:update', (data) => {
  // Update dashboard UI with new quiz status or participant count
});
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context about the error"
  }
}
```

**Common Error Codes**:
- `INVALID_STATUS_TRANSITION`: Attempted invalid quiz status change
- `QUIZ_VALIDATION_FAILED`: Quiz doesn't meet requirements for status change
- `UNAUTHORIZED`: User not authorized to perform action
- `NOT_FOUND`: Resource not found
- `INVALID_REQUEST`: Request body or parameters invalid

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Quiz Management**: 100 requests per minute per organizer
- **Template Operations**: 50 requests per minute per organizer
- **Public Quiz Discovery**: 200 requests per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701180000
```

---

## Best Practices

### Polling vs WebSockets

- Use WebSocket events for real-time updates (participant counts, status changes)
- Use REST API for initial data loading and user-initiated actions
- Avoid polling endpoints more frequently than once per 5 seconds

### Error Handling

Always implement proper error handling:

```javascript
try {
  const response = await fetch('/api/events/evt_123/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'live' })
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Handle specific error codes
    if (error.code === 'QUIZ_VALIDATION_FAILED') {
      // Show validation errors to user
    }
  }
} catch (error) {
  // Handle network errors
}
```

### Caching

- Cache template lists for 5 minutes
- Cache public quiz lists for 30 seconds
- Invalidate cache on user actions (create, update, delete)

---

## Migration Notes

### Backward Compatibility

All existing API endpoints remain functional. New fields in responses are optional and won't break existing clients.

### Deprecated Endpoints

None. All existing endpoints are still supported.

---

## Support

For API support or to report issues:
- GitHub Issues: [your-repo/issues]
- Email: support@your-domain.com
- Documentation: [your-docs-url]
