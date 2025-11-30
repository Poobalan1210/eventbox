# Task 3: Quiz History and Status Management Implementation

## Overview

This document describes the implementation of Task 3 from the Organizer UX Improvements spec: Backend Quiz History and Status Management.

## Implementation Summary

### New API Endpoints

#### 1. GET /api/events/organizer/:organizerId
**Purpose**: Retrieve all quizzes for a specific organizer

**Response**:
```json
{
  "quizzes": [
    {
      "eventId": "string",
      "name": "string",
      "status": "live" | "upcoming" | "completed",
      "participantCount": number,
      "createdAt": number,
      "startedAt": number (optional),
      "completedAt": number (optional),
      "visibility": "private" | "public",
      "topic": "string" (optional),
      "description": "string" (optional),
      "lastModified": number
    }
  ]
}
```

**Features**:
- Retrieves all events for the specified organizer
- Automatically categorizes quizzes as live, upcoming, or completed
- Sorts quizzes by status (live → upcoming → completed) and date (most recent first)
- Returns quiz metadata including participant count and timestamps

#### 2. PATCH /api/events/:eventId/status
**Purpose**: Update the status of a quiz event

**Request Body**:
```json
{
  "status": "draft" | "setup" | "live" | "completed"
}
```

**Response**:
```json
{
  "success": true
}
```

**Features**:
- Updates event status with validation
- Automatically sets `startedAt` timestamp when transitioning to 'live'
- Automatically sets `completedAt` timestamp when transitioning to 'completed'
- Updates `lastModified` timestamp

**Validation**:
- Event must exist (404 if not found)
- Status must be one of the valid values (validated by Zod schema)

#### 3. PATCH /api/events/:eventId/visibility
**Purpose**: Update the visibility (privacy) setting of a quiz

**Request Body**:
```json
{
  "visibility": "private" | "public"
}
```

**Response**:
```json
{
  "success": true
}
```

**Features**:
- Updates event visibility setting
- Updates `lastModified` timestamp

**Validation**:
- Event must exist (404 if not found)
- Cannot change visibility of live quizzes (400 error)
- Visibility must be 'private' or 'public' (validated by Zod schema)

## Implementation Details

### Quiz Categorization Logic

The `categorizeQuiz()` helper function maps EventStatus to quiz categories:

```typescript
function categorizeQuiz(status: EventStatus): 'live' | 'upcoming' | 'completed' {
  switch (status) {
    case 'live':
      return 'live';
    case 'draft':
    case 'setup':
    case 'waiting':
      return 'upcoming';
    case 'completed':
    case 'active':
      return 'completed';
    default:
      return 'upcoming';
  }
}
```

**Mapping**:
- `live` → Live
- `draft`, `setup`, `waiting` → Upcoming
- `completed`, `active` → Completed

### Sorting Logic

The `sortQuizzes()` helper function implements the sorting requirements:

1. **Primary sort**: By status category (live → upcoming → completed)
2. **Secondary sort**: By date (most recent first)
   - For live and upcoming: Uses `lastModified` timestamp
   - For completed: Uses `completedAt` if available, otherwise `lastModified`

```typescript
function sortQuizzes(quizzes: QuizHistoryEntry[]): QuizHistoryEntry[] {
  const statusOrder = { live: 0, upcoming: 1, completed: 2 };
  
  return quizzes.sort((a, b) => {
    // First sort by status
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    
    // Within same status, sort by date (most recent first)
    let dateA: number;
    let dateB: number;
    
    if (a.status === 'completed') {
      dateA = a.completedAt || a.lastModified;
      dateB = b.completedAt || b.lastModified;
    } else {
      dateA = a.lastModified;
      dateB = b.lastModified;
    }
    
    return dateB - dateA; // Descending order
  });
}
```

### Data Transformation

The `toQuizHistoryEntry()` helper function converts Event objects to QuizHistoryEntry format:

```typescript
function toQuizHistoryEntry(event: Event): QuizHistoryEntry {
  return {
    eventId: event.eventId,
    name: event.name,
    status: categorizeQuiz(event.status),
    participantCount: event.participantCount || 0,
    createdAt: event.createdAt,
    startedAt: event.startedAt,
    completedAt: event.completedAt,
    visibility: event.visibility || 'private',
    topic: event.topic,
    description: event.description,
    lastModified: event.lastModified || event.createdAt,
  };
}
```

## Validation Schemas

### New Zod Schemas

Added to `backend/src/validation/schemas.ts`:

```typescript
// Extended status schema for organizer workflow
export const ExtendedEventStatusSchema = z.enum(['draft', 'setup', 'live', 'completed']);

export const EventVisibilitySchema = z.enum(['private', 'public']);

export const UpdateEventStatusRequestSchema = z.object({
  status: ExtendedEventStatusSchema,
});

export const UpdateEventVisibilityRequestSchema = z.object({
  visibility: EventVisibilitySchema,
});
```

## Type Definitions

### New API Types

Added to `backend/src/types/api.ts`:

```typescript
export interface QuizHistoryEntry {
  eventId: string;
  name: string;
  status: 'live' | 'upcoming' | 'completed';
  participantCount: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  visibility: 'private' | 'public';
  topic?: string;
  description?: string;
  lastModified: number;
}

export interface GetOrganizerQuizzesResponse {
  quizzes: QuizHistoryEntry[];
}

export interface UpdateEventStatusRequest {
  status: 'draft' | 'setup' | 'live' | 'completed';
}

export interface UpdateEventStatusResponse {
  success: boolean;
}

export interface UpdateEventVisibilityRequest {
  visibility: 'private' | 'public';
}

export interface UpdateEventVisibilityResponse {
  success: boolean;
}
```

## Files Modified

1. **backend/src/routes/events.ts**
   - Added 3 new endpoints
   - Added 3 helper functions for categorization, sorting, and transformation
   - Updated imports

2. **backend/src/validation/schemas.ts**
   - Added `ExtendedEventStatusSchema`
   - Added `EventVisibilitySchema`
   - Added `UpdateEventStatusRequestSchema`
   - Added `UpdateEventVisibilityRequestSchema`

3. **backend/src/types/api.ts**
   - Added `QuizHistoryEntry` interface
   - Added `GetOrganizerQuizzesResponse` interface
   - Added `UpdateEventStatusRequest` interface
   - Added `UpdateEventStatusResponse` interface
   - Added `UpdateEventVisibilityRequest` interface
   - Added `UpdateEventVisibilityResponse` interface

## Testing

### Manual Test Script

Created `backend/test-quiz-history.ts` to test the repository methods and logic:
- Creates test events with different statuses
- Tests retrieval by organizer
- Tests status updates
- Tests visibility updates
- Verifies categorization logic
- Verifies sorting logic

### API Test Script

Created `backend/test-quiz-history-api.sh` to test the HTTP endpoints:
- Tests GET /api/events/organizer/:organizerId
- Tests PATCH /api/events/:eventId/status
- Tests PATCH /api/events/:eventId/visibility
- Tests validation (e.g., preventing visibility changes on live quizzes)
- Tests error handling (e.g., invalid status values)

### Running Tests

```bash
# Test repository methods and logic
cd backend
npx tsx test-quiz-history.ts

# Test API endpoints (requires running server)
npm run dev  # In one terminal
./test-quiz-history-api.sh  # In another terminal
```

## Requirements Validation

This implementation satisfies the following requirements from the spec:

### Requirement 22.1
✅ "THE Quiz System SHALL display a dashboard showing all quizzes created by the Organizer"
- Implemented via GET /api/events/organizer/:organizerId endpoint

### Requirement 22.2
✅ "THE Quiz System SHALL categorize quizzes as Live, Upcoming, or Past based on their status"
- Implemented via `categorizeQuiz()` function
- Maps event statuses to categories correctly

### Requirement 22.5
✅ "THE Quiz System SHALL sort quizzes with Live quizzes first, then Upcoming, then Past by date"
- Implemented via `sortQuizzes()` function
- Sorts by status priority, then by date within each category

### Requirement 23.1
✅ "WHEN creating an event, THE Quiz System SHALL allow the Organizer to select Private or Public visibility"
- Visibility field is part of Event model (from Task 1)
- Can be updated via PATCH /api/events/:eventId/visibility

### Requirement 23.5
✅ "THE Quiz System SHALL allow the Organizer to change quiz visibility before the quiz starts"
- Implemented via PATCH /api/events/:eventId/visibility
- Validation prevents changing visibility of live quizzes

## Error Handling

The implementation includes comprehensive error handling:

1. **404 Not Found**: When event doesn't exist
2. **400 Bad Request**: When trying to change visibility of live quiz
3. **400 Bad Request**: When providing invalid status or visibility values (via Zod validation)
4. **500 Internal Server Error**: For database errors (handled by error middleware)

## Next Steps

This implementation provides the backend foundation for:
- Task 6: Frontend OrganizerDashboard Component
- Task 9: Frontend Mode Transition Logic
- Task 10: Frontend PrivacySelector Component

The frontend can now:
1. Fetch all quizzes for an organizer
2. Display them categorized and sorted correctly
3. Update quiz status when transitioning between modes
4. Update quiz visibility settings

## Correctness Properties

This implementation supports the following correctness properties from the design document:

- **Property 2: Quiz Categorization Consistency** - The categorization logic ensures quizzes are correctly mapped to their category based on status
- **Property 6: Dashboard Sorting Order** - The sorting logic ensures correct ordering by status and date
