# ParticipantActivityView Component

## Overview

The `ParticipantActivityView` component provides a unified interface for participants to interact with different activity types (quiz, poll, raffle) within an event. It dynamically renders the appropriate interface based on the currently active activity and handles seamless transitions between activities without requiring page refreshes.

## Requirements

This component implements the following requirements:
- **6.1**: Display waiting screen when no activity is active
- **6.2**: Display quiz interface when quiz activity is active
- **6.3**: Display poll interface when poll activity is active
- **6.4**: Display raffle interface when raffle activity is active
- **6.5**: Handle activity transitions dynamically without page refresh

## Features

### Dynamic Activity Rendering
- Automatically switches between activity types based on WebSocket events
- Maintains separate state for each activity type
- Smooth transitions with Framer Motion animations

### Activity Types Supported

#### 1. Waiting State
- Displayed when no activity is active
- Shows welcome message with participant name
- Animated waiting indicator
- Customizable message from server

#### 2. Quiz Activity
- Full quiz interface with questions and answers
- Real-time timer display
- Answer submission and feedback
- Leaderboard display between questions
- Streak tracking
- Final podium and results

#### 3. Poll Activity
- Poll question display
- Multiple option selection
- Vote submission
- Real-time results with percentage bars
- Vote count display

#### 4. Raffle Activity
- Prize description display
- Entry button with confirmation
- Drawing animation
- Winner announcement with celebration
- Winner list display

## Props

```typescript
interface ParticipantActivityViewProps {
  eventId: string;           // The event ID
  participantName: string;   // The participant's name
}
```

## WebSocket Events

### Listened Events

#### Activity Lifecycle
- `activity-activated`: Triggered when an activity becomes active
- `activity-deactivated`: Triggered when an activity is deactivated
- `waiting-for-activity`: Triggered when participant should wait

#### Quiz Events
- `question-displayed`: New question is shown
- `timer-tick`: Timer countdown updates
- `question-ended`: Question time is up
- `answer-result`: Participant's answer result
- `answer-statistics`: Answer distribution statistics
- `leaderboard-updated`: Leaderboard updates
- `quiz-ended`: Quiz completion

#### Poll Events
- `poll-started`: Poll begins
- `poll-results-updated`: Live results update
- `poll-ended`: Poll completion

#### Raffle Events
- `raffle-started`: Raffle begins
- `raffle-entry-confirmed`: Entry confirmation
- `raffle-drawing`: Drawing in progress
- `raffle-winners-announced`: Winners revealed
- `raffle-ended`: Raffle completion

## State Management

The component maintains separate state for each activity type:

### Quiz State
- Current question and metadata
- Timer state
- Answer submission state
- Leaderboard data
- Streak tracking
- Results display

### Poll State
- Poll question and options
- Selected options
- Vote submission status
- Results data

### Raffle State
- Prize description
- Entry status
- Winner list
- Drawing animation state

## Sub-Components

### WaitingForActivity
Displays an engaging waiting screen with:
- Animated clock icon
- Welcome message with participant name
- Pulsing dots animation

### QuizActivityView
Renders the quiz interface with:
- Question display component
- Leaderboard between questions
- Loading state for first question

### PollActivityView
Renders the poll interface with:
- Poll question header
- Selectable options
- Submit button
- Results visualization with percentage bars

### RaffleActivityView
Renders the raffle interface with:
- Prize description
- Entry button
- Drawing animation
- Winner announcement
- Winner list

### PollResults
Displays poll results with:
- Total vote count
- Option-by-option breakdown
- Animated percentage bars

### RaffleWinnersList
Displays raffle winners with:
- Winner names with medals
- Highlighting for current participant
- Staggered animation

## Usage Example

```tsx
import ParticipantActivityView from '../components/ParticipantActivityView';

function ParticipantView() {
  const { eventId } = useParams();
  const [participantName, setParticipantName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  if (!hasJoined) {
    return <JoinScreen onJoin={(name) => {
      setParticipantName(name);
      setHasJoined(true);
    }} />;
  }

  return (
    <ParticipantActivityView
      eventId={eventId}
      participantName={participantName}
    />
  );
}
```

## Styling

The component uses:
- Tailwind CSS for styling
- Framer Motion for animations
- Backdrop blur effects for glassmorphism
- Responsive design for mobile and desktop
- Kahoot-inspired color scheme

## Future Enhancements

- [ ] Add sound effects for activity transitions
- [ ] Implement confetti animations for raffle winners
- [ ] Add haptic feedback for mobile devices
- [ ] Support for custom activity themes
- [ ] Offline mode with state persistence
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)

## Testing

To test this component:

1. **Waiting State**: Join an event with no active activity
2. **Quiz Activity**: Organizer activates a quiz activity
3. **Poll Activity**: Organizer activates a poll activity
4. **Raffle Activity**: Organizer activates a raffle activity
5. **Transitions**: Switch between activities to test smooth transitions

## Notes

- The component automatically resets state when switching between activities
- WebSocket connection is managed by the WebSocketContext
- All animations are optimized for performance
- The component handles edge cases like missing data gracefully
