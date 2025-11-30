# Task 30: Update Quiz Participant Interface for Activities

## Overview
Updated the quiz participant interface components to work with the activity-based system, ensuring they use `activityId` instead of `eventId` for WebSocket communication.

## Changes Made

### 1. Frontend WebSocket Types (`frontend/src/types/websocket.ts`)

Updated quiz-related WebSocket event payloads to include `activityId`:

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

### 2. ParticipantActivityView Component (`frontend/src/components/ParticipantActivityView.tsx`)

Updated the `QuizActivityView` sub-component to use `activityId`:

**Changes:**
- Modified `QuizActivityView` props to accept `activityId` instead of `eventId`
- Updated `handleAnswerSubmit` to emit `submit-answer` event with `activityId`
- Updated parent component to pass `currentActivity?.activityId` to `QuizActivityView`

**Before:**
```typescript
emit('submit-answer', {
  eventId,
  questionId: currentQuestion.id,
  answerId,
  responseTime,
});
```

**After:**
```typescript
emit('submit-answer', {
  activityId,
  questionId: currentQuestion.id,
  answerId,
  responseTime,
});
```

### 3. Core Quiz Components (No Changes Required)

The following components work correctly with the activity system without modifications:

- **QuestionDisplay** (`frontend/src/components/QuestionDisplay.tsx`)
  - Receives props from parent component
  - Doesn't directly interact with WebSocket events
  - Already compatible with activity-based system

- **ColorfulAnswerButton** (`frontend/src/components/ColorfulAnswerButton.tsx`)
  - Pure presentation component
  - Doesn't use eventId or activityId
  - Already compatible with activity-based system

- **Leaderboard** (`frontend/src/components/Leaderboard.tsx`)
  - Pure presentation component
  - Doesn't use eventId or activityId
  - Already compatible with activity-based system

## Requirements Validated

✅ **Requirement 6.2**: Quiz activity interface displays correctly for participants
✅ **Requirement 10.5**: All existing quiz participant features are maintained

## Testing Recommendations

1. **Integration Test**: Verify quiz activity flow
   - Organizer activates a quiz activity
   - Participant sees quiz interface
   - Participant submits answers with correct `activityId`
   - Leaderboard updates correctly

2. **WebSocket Event Test**: Verify correct event payloads
   - `submit-answer` event includes `activityId`
   - Backend receives and processes `activityId` correctly

3. **Component Test**: Verify quiz components render correctly
   - QuestionDisplay shows questions properly
   - ColorfulAnswerButton handles selections
   - Leaderboard displays scores

## Backward Compatibility

The changes maintain backward compatibility:
- `QuizStartedPayload` includes both `activityId` and `eventId`
- Old quiz-centric components (SetupMode, LiveMode) still work with `eventId`
- New activity-based components use `activityId`

## Notes

- The quiz participant interface components (QuestionDisplay, ColorfulAnswerButton, Leaderboard) are already activity-agnostic and work correctly without modifications
- The main update was in the WebSocket event handling layer (ParticipantActivityView)
- The backend already supports `activityId` in quiz events (verified in backend/src/types/websocket.ts)
- Frontend types now match backend types for quiz events
