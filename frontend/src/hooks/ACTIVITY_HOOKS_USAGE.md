# Activity-Specific WebSocket Hooks

This document describes the activity-specific WebSocket hooks created for the event-activities platform.

## Overview

Three new hooks have been created to handle activity-specific WebSocket events:

1. **useActivityState** - Tracks the active activity state for an event
2. **usePollEvents** - Handles poll activity events
3. **useRaffleEvents** - Handles raffle activity events

These hooks complement the existing `useWebSocketEvent` hook and provide a higher-level API for managing activity-specific state and events.

## useActivityState

Tracks and manages the active activity state for an event.

### Usage

```typescript
import { useActivityState } from '../hooks';

function ParticipantView() {
  const { 
    activeActivity, 
    isWaiting, 
    waitingMessage,
    isActivityActive,
    getActiveActivityType 
  } = useActivityState({
    eventId: 'event-123',
    onActivityActivated: (activity) => {
      console.log('Activity activated:', activity);
    },
    onActivityDeactivated: (activityId) => {
      console.log('Activity deactivated:', activityId);
    },
    onWaitingStateChanged: (isWaiting, message) => {
      console.log('Waiting state:', isWaiting, message);
    }
  });

  if (isWaiting) {
    return <WaitingScreen message={waitingMessage} />;
  }

  return <ActivityView activity={activeActivity} />;
}
```

### API

**Options:**
- `eventId?: string` - Filter events for a specific event
- `onActivityActivated?: (activity: Activity) => void` - Callback when activity is activated
- `onActivityDeactivated?: (activityId: string) => void` - Callback when activity is deactivated
- `onActivityUpdated?: (activity: Activity) => void` - Callback when activity is updated
- `onWaitingStateChanged?: (isWaiting: boolean, message: string) => void` - Callback when waiting state changes

**Returns:**
- `activeActivity: Activity | null` - The currently active activity
- `isWaiting: boolean` - Whether participants are waiting for an activity
- `waitingMessage: string` - Message to display while waiting
- `lastUpdate: number` - Timestamp of last state update
- `isActivityActive: (activityId: string) => boolean` - Check if specific activity is active
- `getActiveActivityType: () => ActivityType | null` - Get the type of active activity

## usePollEvents

Handles poll activity events and state.

### Usage

```typescript
import { usePollEvents } from '../hooks';

function PollView({ activityId, participantId }) {
  const {
    question,
    options,
    totalVotes,
    hasVoted,
    isActive,
    isEnded,
    submitVote,
    getOptionPercentage,
    getLeadingOption
  } = usePollEvents({
    activityId,
    participantId,
    onPollStarted: (question, options) => {
      console.log('Poll started:', question);
    },
    onResultsUpdated: (results) => {
      console.log('Results updated:', results);
    }
  });

  if (!isActive) {
    return <div>Poll not active</div>;
  }

  return (
    <div>
      <h2>{question}</h2>
      {options.map(option => (
        <div key={option.id}>
          <button 
            onClick={() => submitVote([option.id])}
            disabled={hasVoted}
          >
            {option.text}
          </button>
          <span>{getOptionPercentage(option.id)}%</span>
        </div>
      ))}
    </div>
  );
}
```

### API

**Options:**
- `activityId?: string` - Filter events for a specific activity
- `participantId?: string` - Track voting status for specific participant
- `onPollStarted?: (question: string, options: PollOption[]) => void` - Callback when poll starts
- `onVoteSubmitted?: (participantId: string) => void` - Callback when vote is submitted
- `onResultsUpdated?: (results) => void` - Callback when results are updated
- `onPollEnded?: (finalResults) => void` - Callback when poll ends

**Returns:**
- `activityId: string | null` - Current poll activity ID
- `question: string` - Poll question
- `options: PollOption[]` - Poll options with vote counts
- `totalVotes: number` - Total number of votes
- `hasVoted: boolean` - Whether current participant has voted
- `isActive: boolean` - Whether poll is currently active
- `isEnded: boolean` - Whether poll has ended
- `lastUpdate: number` - Timestamp of last update
- `submitVote: (optionIds: string[]) => void` - Submit a vote
- `getOption: (optionId: string) => PollOption | undefined` - Get option by ID
- `getOptionPercentage: (optionId: string) => number` - Get vote percentage for option
- `getLeadingOption: () => PollOption | null` - Get the option with most votes

## useRaffleEvents

Handles raffle activity events and state.

### Usage

```typescript
import { useRaffleEvents } from '../hooks';

function RaffleView({ activityId, participantId }) {
  const {
    prizeDescription,
    hasEntered,
    isDrawing,
    winners,
    isActive,
    isEnded,
    enterRaffle,
    isWinner,
    getWinnerCount
  } = useRaffleEvents({
    activityId,
    participantId,
    onRaffleStarted: (prize) => {
      console.log('Raffle started for:', prize);
    },
    onWinnersAnnounced: (winners) => {
      console.log('Winners:', winners);
    }
  });

  if (!isActive) {
    return <div>Raffle not active</div>;
  }

  if (isDrawing) {
    return <div>Drawing winners...</div>;
  }

  if (winners.length > 0) {
    return (
      <div>
        <h2>Winners Announced!</h2>
        {isWinner() ? (
          <div>🎉 Congratulations! You won!</div>
        ) : (
          <div>Better luck next time!</div>
        )}
        <ul>
          {winners.map(w => <li key={w.participantId}>{w.participantName}</li>)}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <h2>Prize: {prizeDescription}</h2>
      <button 
        onClick={enterRaffle}
        disabled={hasEntered}
      >
        {hasEntered ? 'Entered!' : 'Enter Raffle'}
      </button>
    </div>
  );
}
```

### API

**Options:**
- `activityId?: string` - Filter events for a specific activity
- `participantId?: string` - Track entry status for specific participant
- `onRaffleStarted?: (prizeDescription: string) => void` - Callback when raffle starts
- `onEntryConfirmed?: (participantId: string) => void` - Callback when entry is confirmed
- `onDrawing?: () => void` - Callback when drawing begins
- `onWinnersAnnounced?: (winners: RaffleWinner[]) => void` - Callback when winners are announced
- `onRaffleEnded?: () => void` - Callback when raffle ends

**Returns:**
- `activityId: string | null` - Current raffle activity ID
- `prizeDescription: string` - Description of the prize
- `hasEntered: boolean` - Whether current participant has entered
- `isDrawing: boolean` - Whether winners are being drawn
- `winners: RaffleWinner[]` - List of winners
- `isActive: boolean` - Whether raffle is currently active
- `isEnded: boolean` - Whether raffle has ended
- `lastUpdate: number` - Timestamp of last update
- `enterRaffle: () => void` - Enter the raffle
- `isWinner: (participantId?: string) => boolean` - Check if participant is a winner
- `getWinner: (participantId: string) => RaffleWinner | undefined` - Get winner by ID
- `getWinnerCount: () => number` - Get total number of winners

## Integration with Existing Components

These hooks are designed to work seamlessly with existing components:

### ParticipantActivityView

```typescript
import { useActivityState } from '../hooks';

function ParticipantActivityView({ eventId }) {
  const { activeActivity, isWaiting, waitingMessage } = useActivityState({ eventId });

  if (isWaiting) {
    return <WaitingForActivity message={waitingMessage} />;
  }

  switch (activeActivity?.type) {
    case 'quiz':
      return <QuizView activity={activeActivity} />;
    case 'poll':
      return <PollParticipantView activity={activeActivity} />;
    case 'raffle':
      return <RaffleParticipantView activity={activeActivity} />;
    default:
      return <WaitingForActivity />;
  }
}
```

## Requirements Validation

These hooks satisfy the following requirements:

- **Requirement 4.1**: Activity activation control - `useActivityState` tracks active activities
- **Requirement 6.5**: Activity transitions - All hooks handle real-time activity transitions
- **Task 34**: Create activity-specific WebSocket hooks - All three hooks created and exported

## Testing

The hooks can be tested by:

1. Importing them in components
2. Verifying they handle WebSocket events correctly
3. Checking state updates in response to events
4. Testing callback invocations

Example test setup:

```typescript
import { renderHook } from '@testing-library/react';
import { useActivityState } from '../hooks';

test('useActivityState tracks active activity', () => {
  const { result } = renderHook(() => useActivityState({ eventId: 'test-event' }));
  
  expect(result.current.isWaiting).toBe(true);
  expect(result.current.activeActivity).toBe(null);
});
```
