# Quiz WebSocket Handlers Refactoring for Activities

## Overview

This document describes the refactoring of quiz WebSocket handlers to work with `activityId` instead of `eventId`, ensuring quiz events are scoped to activities rather than events.

## Changes Made

### 1. WebSocket Type Definitions (`backend/src/types/websocket.ts`)

Updated all quiz-related payload types to use `activityId`:

**Client to Server Events:**
- `StartQuizPayload`: Changed from `eventId` to `activityId`
- `NextQuestionPayload`: Changed from `eventId` to `activityId`
- `SubmitAnswerPayload`: Changed from `eventId` to `activityId`
- `EndQuizPayload`: Changed from `eventId` to `activityId`

**Server to Client Events:**
- `QuizStartedPayload`: Added `activityId` field (kept `eventId` for backward compatibility)
- `QuestionDisplayedPayload`: Added `activityId` field
- `QuestionEndedPayload`: Added `activityId` field
- `AnswerStatisticsPayload`: Added `activityId` field
- `LeaderboardUpdatedPayload`: Added `activityId` field
- `QuizEndedPayload`: Added `activityId` field

### 2. WebSocket Service (`backend/src/services/websocketService.ts`)

#### Imports
- Added `QuizActivityService` import
- Removed unused imports: `QuestionRepository`, `AnswerRepository`, `Answer`
- Removed unused scoring engine imports (now handled by `QuizActivityService`)

#### Service Constructor
- Added `quizActivityService` instance
- Removed `questionRepo` and `answerRepo` (now handled by `QuizActivityService`)

#### Handler Methods Refactored

**`handleStartQuiz`:**
- Now accepts `activityId` instead of `eventId`
- Retrieves activity to get `eventId`
- Validates activity type is 'quiz'
- Uses `QuizActivityService.startQuiz()` for quiz logic
- Broadcasts `quiz-started` with both `activityId` and `eventId`

**`handleNextQuestion`:**
- Now accepts `activityId` instead of `eventId`
- Retrieves activity to get `eventId`
- Validates activity type is 'quiz'
- Uses `QuizActivityService.nextQuestion()` and `getQuestions()` for quiz logic
- Clears timer using `activityId` instead of `eventId`
- Broadcasts `question-displayed` with `activityId`
- Starts timer with `activityId`

**`handleSubmitAnswer`:**
- Now accepts `activityId` instead of `eventId`
- Retrieves activity to get `eventId`
- Validates activity type is 'quiz'
- Uses `QuizActivityService.submitAnswer()` for all answer processing logic
- Simplified error handling (duplicate submission handled by service)

**`handleEndQuiz`:**
- Now accepts `activityId` instead of `eventId`
- Retrieves activity to get `eventId`
- Validates activity type is 'quiz'
- Uses `QuizActivityService.endQuiz()` for quiz completion logic
- Clears timer using `activityId`
- Broadcasts `quiz-ended` with `activityId`

**`startTimer`:**
- Updated signature to accept `activityId` and `eventId`
- Uses `activityId` for timer storage (instead of `eventId`)
- Uses `QuizActivityService.getAnswerStatistics()` and `getLeaderboard()` for statistics
- Broadcasts events with `activityId`

**`clearTimer`:**
- Updated to use `activityId` instead of `eventId`
- Updated comments to reflect activity-based timers

### 3. Timer Management

- Changed `activeTimers` map comment from "each event" to "each activity"
- Timers are now keyed by `activityId` instead of `eventId`
- This ensures timers are properly scoped to specific quiz activities

## Benefits

1. **Activity Scoping**: Quiz events are now properly scoped to activities, not events
2. **Separation of Concerns**: Quiz logic is delegated to `QuizActivityService`
3. **Type Safety**: All WebSocket payloads now correctly reference activities
4. **Backward Compatibility**: Event IDs are still included in broadcasts for room-based communication
5. **Consistency**: Aligns with the activity-based architecture for polls and raffles

## Backward Compatibility

- Event rooms are still used for broadcasting (participants join event rooms, not activity rooms)
- `eventId` is included in server-to-client payloads where needed for context
- Event status updates are maintained for backward compatibility

## Testing

All existing quiz functionality is preserved:
- Quiz start/end lifecycle
- Question display and timing
- Answer submission and scoring
- Leaderboard updates
- Answer statistics
- Streak tracking
- Speed-based scoring

## Requirements Validated

This refactoring satisfies **Requirement 10.1** from the design document:
> "WHEN a quiz activity is active THEN the Event System SHALL support all existing quiz features including scoring, leaderboards, and answer reveal"

All existing quiz WebSocket functionality is maintained while properly scoping events to activities.
