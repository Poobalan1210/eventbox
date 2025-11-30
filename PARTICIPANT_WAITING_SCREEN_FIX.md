# Participant Waiting Screen Fix

## Problem
Participants were stuck on the "Waiting for quiz to start..." screen and not receiving questions when the organizer clicked "Next Question".

## Root Causes

### Issue 1: Missing `start-quiz` Event
When the organizer transitioned from Setup Mode to Live Mode, the system only updated the event status in the database but never emitted the `start-quiz` WebSocket event. This meant:
- The event status changed to 'live' in the database
- The organizer saw the LiveMode component
- But participants never received the `quiz-started` event, so they stayed on the waiting screen

### Issue 2: Organizer Not Joining Event Room
The organizer never joined the WebSocket event room, so they didn't receive the `question-displayed` event:
- Participants join the event room via `join-event`
- Organizers only joined `organizer-${organizerId}` room for dashboard updates
- The `question-displayed` event is broadcast to the event room
- Since the organizer wasn't in the event room, they never saw questions appear

### Issue 3: Incorrect First Question Logic
The `handleNextQuestion` function in LiveMode had a logic error:
- It used `currentQuestionIndex + 1` to get the next question
- When the quiz first started, `currentQuestionIndex` was 0
- So it tried to get `questions[1]` (second question) instead of `questions[0]` (first question)

### Issue 4: Incorrect Button Enable Logic
The `canNextQuestion` logic didn't account for the initial state:
- It checked `currentQuestionIndex < totalQuestions - 1`
- This would disable the button when trying to show the first question

## Solutions

### Fix 1: Emit `start-quiz` Event (SetupMode.tsx)
Added WebSocket emit when transitioning to live mode:

```typescript
const handleConfirmStart = async () => {
  const result = await transitionTo('live');
  
  if (result.success) {
    setShowStartConfirmation(false);
    
    // Emit start-quiz event to notify all participants
    emit('start-quiz', { eventId });
    
    onStartQuiz();
  }
};
```

### Fix 2: Organizer Joins Event Room (LiveMode.tsx + WebSocket Service)
Added new WebSocket event `join-event-as-organizer` so organizers receive live quiz updates:

**Backend (websocketService.ts):**
```typescript
socket.on('join-event-as-organizer', async (payload: { eventId: string }) => {
  const { eventId } = payload;
  if (eventId) {
    socket.join(eventId);
    console.log(`Organizer joined event room: ${eventId}`);
  }
});
```

**Frontend (LiveMode.tsx):**
```typescript
useEffect(() => {
  emit('join-event-as-organizer', { eventId });
  console.log('Organizer joined event room:', eventId);
}, [eventId, emit]);
```

### Fix 3: Correct First Question Logic (LiveMode.tsx)
Updated `handleNextQuestion` to handle the initial state:

```typescript
const handleNextQuestion = () => {
  // If no question is currently displayed, show the first question
  // Otherwise, show the next question
  const nextIndex = currentQuestion === null ? 0 : currentQuestionIndex + 1;
  if (nextIndex < questions.length) {
    const nextQuestion = questions[nextIndex];
    emit('next-question', { eventId, questionId: nextQuestion.id });
  }
};
```

### Fix 4: Correct Button Enable Logic (LiveMode.tsx)
Updated `canNextQuestion` to handle the initial state:

```typescript
const canNextQuestion = !quizEnded && (
  currentQuestion === null 
    ? questions.length > 0 
    : currentQuestionIndex < totalQuestions - 1
);
```

## Testing Steps

1. **Start a new quiz:**
   - Create a quiz with at least 2 questions
   - Click "Ready to Start" and confirm
   - Verify the organizer sees LiveMode

2. **Join as participant:**
   - Open the participant link in another browser/tab
   - Enter a nickname and join
   - Verify you see "Waiting for quiz to start..." message

3. **Start the quiz:**
   - As organizer, click "Next Question"
   - Verify participants receive the `quiz-started` event and transition to active state
   - Verify the first question is displayed to participants

4. **Continue through questions:**
   - Click "Next Question" again
   - Verify the second question is displayed
   - Continue until all questions are shown

## Files Modified
- `frontend/src/components/SetupMode.tsx` - Added `start-quiz` event emission
- `frontend/src/components/LiveMode.tsx` - Fixed first question logic, button enable logic, and added organizer event room join
- `backend/src/services/websocketService.ts` - Added `join-event-as-organizer` handler and debug logging
- `frontend/src/types/websocket.ts` - Added `JoinEventAsOrganizerPayload` type
- `backend/src/types/websocket.ts` - Added `JoinEventAsOrganizerPayload` type
