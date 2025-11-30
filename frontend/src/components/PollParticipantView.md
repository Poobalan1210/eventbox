# PollParticipantView Component

## Overview

The `PollParticipantView` component provides the poll interface for participants. It allows participants to view poll questions, select options, submit votes, and see results in real-time.

## Features

- **Poll Question Display**: Shows the poll question in a prominent header
- **Option Selection**: Interactive buttons for selecting poll options
- **Single/Multiple Selection**: Supports both single and multiple option selection modes
- **Vote Submission**: Submit button with validation and loading states
- **Vote Confirmation**: Visual feedback when vote is successfully submitted
- **Live Results**: Real-time display of voting results with animated progress bars
- **Responsive Design**: Works on mobile, tablet, and desktop devices

## Props

```typescript
interface PollParticipantViewProps {
  eventId: string;        // The event ID (for future WebSocket room management)
  activityId: string;     // The poll activity ID
  participantName: string; // The participant's name
}
```

## Usage

```tsx
import PollParticipantView from './PollParticipantView';

function ParticipantView() {
  return (
    <PollParticipantView
      eventId="event-123"
      activityId="poll-456"
      participantName="John Doe"
    />
  );
}
```

## WebSocket Events

The component listens for the following WebSocket events:

- `poll-started`: Initializes the poll with question and options
- `poll-results-updated`: Updates the live results display
- `poll-ended`: Shows final results and marks poll as complete

## API Integration

The component submits votes via REST API:

```
POST /api/activities/:activityId/vote
Body: {
  participantName: string,
  selectedOptionIds: string[]
}
```

## State Management

The component manages the following state:

- **question**: The poll question text
- **options**: Array of poll options with vote counts
- **selectedOptions**: Array of selected option IDs
- **hasVoted**: Whether the participant has submitted their vote
- **results**: Current voting results (if available)
- **isPollEnded**: Whether the poll has ended
- **isSubmitting**: Whether a vote submission is in progress

## Visual Design

The component uses:

- **Gradient header**: Purple to indigo gradient for the poll header
- **Interactive buttons**: Hover and tap animations for option selection
- **Progress bars**: Animated bars showing vote percentages
- **Color coding**: Blue gradient for selected options, white/transparent for unselected
- **Icons**: Checkmark icons for selected options, percentage displays for results

## Accessibility

- Keyboard navigation support
- Clear visual feedback for all interactions
- Disabled states for submitted votes
- Loading indicators during submission

## Requirements

Validates: Requirements 6.3 (Poll participant interface)

## Related Components

- `PollActivityConfig`: Organizer interface for configuring polls
- `ParticipantActivityView`: Parent component that renders activity-specific views
- `ActivityControlPanel`: Organizer control panel for activating polls
