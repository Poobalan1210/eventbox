# Mode Transition Implementation

## Overview

This document describes the implementation of Task 9: Frontend Mode Transition Logic for the Organizer UX Improvements feature.

## Implementation Summary

The mode transition system implements a state machine for quiz modes with the following flow:

```
draft → setup → live → completed
```

### Key Components

#### 1. `useModeTransition` Hook (`frontend/src/hooks/useModeTransition.ts`)

A custom React hook that manages mode transitions with validation and error handling.

**Features:**
- Validates transitions based on allowed state machine paths
- Validates quiz before transitioning to live mode (checks for questions, correct answers)
- Makes API calls to update status on the backend
- Implements optimistic UI updates with rollback on failure
- Provides loading and error states

**API:**
```typescript
const {
  isTransitioning,      // Boolean indicating if transition is in progress
  transitionError,      // Error message if transition failed
  canTransitionTo,      // Function to check if transition is valid
  transitionTo,         // Function to execute transition
  clearError,           // Function to clear error state
} = useModeTransition({
  eventId,
  currentStatus,
  onStatusChange,
});
```

#### 2. `StartQuizConfirmation` Component (`frontend/src/components/StartQuizConfirmation.tsx`)

A modal dialog that displays when starting a quiz.

**Features:**
- Shows quiz information (question count, event name)
- Displays Game PIN and join link
- Explains what happens when quiz starts
- Warns that questions cannot be edited once started
- Shows loading state during transition

#### 3. `ModeIndicator` Component (`frontend/src/components/ModeIndicator.tsx`)

A visual indicator showing the current quiz mode.

**Features:**
- Different colors and icons for each mode
- Animated pulse for live/active modes
- Clear description of current mode
- Consistent styling across the application

**Mode Configurations:**
- **Draft**: Gray, 📝 icon - "Quiz is being created"
- **Setup**: Blue, 🛠️ icon - "Add and configure questions"
- **Live**: Red, 🔴 icon - "Quiz is active" (with pulse animation)
- **Completed**: Green, ✅ icon - "Quiz has ended"

#### 4. `ModeTransitionError` Component (`frontend/src/components/ModeTransitionError.tsx`)

Displays errors that occur during mode transitions.

**Features:**
- Clear error message display
- Retry button (optional)
- Dismiss button
- Shake animation to draw attention

#### 5. `QuizModeManager` Component (`frontend/src/components/QuizModeManager.tsx`)

Orchestrates mode transitions and renders the appropriate mode component.

**Features:**
- Fetches event details and determines current mode
- Renders SetupMode, LiveMode, or Completed view based on status
- Manages status changes from child components
- Handles loading and error states
- Provides consistent navigation

### Updated Components

#### SetupMode Component

**Changes:**
- Integrated `useModeTransition` hook
- Uses `StartQuizConfirmation` for quiz start flow
- Uses `ModeIndicator` for visual mode display
- Uses `ModeTransitionError` for error handling
- Validates quiz before allowing start
- Transitions to 'live' status via API

#### LiveMode Component

**Changes:**
- Integrated `useModeTransition` hook
- Uses `ModeIndicator` for visual mode display
- Uses `ModeTransitionError` for error handling
- Transitions to 'completed' status when ending quiz
- Shows loading state during transition

### State Machine

Valid transitions are defined in `useModeTransition.ts`:

```typescript
const VALID_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  draft: ['setup'],
  setup: ['live', 'draft'],
  live: ['completed'],
  completed: [],
  waiting: ['active'], // Legacy support
  active: ['completed'], // Legacy support
};
```

### Validation Rules

Before transitioning to live mode, the system validates:

1. **At least one question exists**
2. **Each question has at least 2 answer options**
3. **Each question has a correct answer selected**

If validation fails, the transition is blocked and an error message is displayed.

### Error Handling

The system implements comprehensive error handling:

1. **Validation Errors**: Displayed before API call is made
2. **Network Errors**: Caught and displayed with retry option
3. **API Errors**: Server error messages are displayed
4. **Rollback**: On failure, UI remains in current state (no partial updates)

### API Integration

The mode transition system integrates with the backend API:

**Endpoint:** `PATCH /api/events/:eventId/status`

**Request Body:**
```json
{
  "status": "live" | "completed" | "setup" | "draft"
}
```

**Response:**
```json
{
  "success": true
}
```

The backend also:
- Validates the transition is allowed
- Updates timestamps (startedAt, completedAt)
- Enforces business rules (e.g., can't edit live quiz)

### CSS Animations

Added animations in `frontend/src/index.css`:

- **scale-in**: Smooth modal appearance
- **shake**: Error attention animation

### Type Safety

Extended `EventStatus` type in `frontend/src/types/models.ts`:

```typescript
export type EventStatus = 'draft' | 'setup' | 'live' | 'completed' | 'waiting' | 'active';
```

Includes legacy statuses ('waiting', 'active') for backward compatibility.

## Requirements Validation

This implementation satisfies the following requirements:

- ✅ **21.1**: Clear separation between setup and live modes
- ✅ **21.3**: Transition to Live Mode when quiz starts
- ✅ **21.5**: Visual mode indicators
- ✅ **25.4**: Confirmation dialog with Game PIN and join information

## Testing

The implementation includes:

1. **Type Safety**: Full TypeScript coverage
2. **Build Validation**: Successful production build
3. **Error Handling**: Comprehensive error states
4. **User Feedback**: Loading states, error messages, confirmations

## Usage Example

```typescript
// In a component that manages quiz modes
import { useModeTransition } from '../hooks/useModeTransition';

function QuizManager({ eventId, currentStatus }) {
  const { transitionTo, isTransitioning, transitionError } = useModeTransition({
    eventId,
    currentStatus,
    onStatusChange: (newStatus) => {
      // Update local state
      setStatus(newStatus);
    },
  });

  const handleStartQuiz = async () => {
    const result = await transitionTo('live');
    if (result.success) {
      // Transition successful
      console.log('Quiz started!');
    } else {
      // Error is automatically displayed via ModeTransitionError
      console.error('Failed to start quiz:', result.error);
    }
  };

  return (
    <div>
      <ModeIndicator status={currentStatus} />
      {transitionError && (
        <ModeTransitionError
          error={transitionError}
          onRetry={handleStartQuiz}
          onDismiss={clearError}
        />
      )}
      <button onClick={handleStartQuiz} disabled={isTransitioning}>
        {isTransitioning ? 'Starting...' : 'Start Quiz'}
      </button>
    </div>
  );
}
```

## Future Enhancements

Potential improvements for future iterations:

1. **Transition History**: Track mode transition history for analytics
2. **Undo Functionality**: Allow reverting recent transitions (within time window)
3. **Scheduled Transitions**: Auto-start quizzes at scheduled time
4. **Transition Hooks**: Allow custom logic to run on transitions
5. **Optimistic Locking**: Prevent concurrent modifications

## Files Created/Modified

### Created Files:
- `frontend/src/hooks/useModeTransition.ts`
- `frontend/src/components/StartQuizConfirmation.tsx`
- `frontend/src/components/ModeIndicator.tsx`
- `frontend/src/components/ModeTransitionError.tsx`
- `frontend/src/components/QuizModeManager.tsx`
- `MODE_TRANSITION_IMPLEMENTATION.md`

### Modified Files:
- `frontend/src/components/SetupMode.tsx`
- `frontend/src/components/LiveMode.tsx`
- `frontend/src/pages/QuizManagement.tsx`
- `frontend/src/types/models.ts`
- `frontend/src/index.css`

## Conclusion

The mode transition implementation provides a robust, user-friendly system for managing quiz lifecycle states. It includes comprehensive validation, error handling, and visual feedback to ensure organizers have a smooth experience when creating and running quizzes.
