# RaffleParticipantView Component

## Overview

The `RaffleParticipantView` component provides the raffle interface for participants. It handles the complete raffle experience from entry to winner announcement with engaging animations and real-time updates via WebSocket.

## Requirements

**Validates: Requirement 6.4**

WHEN a raffle activity becomes active THEN the Event System SHALL display the raffle interface to the participant

## Features

### 1. Prize Description Display
- Shows the prize description in an attractive, centered layout
- Animated gift icon to draw attention
- Clear, readable text formatting with support for multi-line descriptions

### 2. Entry Button/Confirmation
- **Manual Entry Mode**: Large, prominent "Enter Raffle" button
- Loading state during entry submission
- Entry confirmation with animated checkmark
- Status message showing entry success

### 3. Winner Announcement Display with Animations
- **Drawing Animation**: Animated dice icon with "Drawing Winners..." message
- **Winner Status**: 
  - Congratulatory message with animated trophy for winners
  - Encouraging "Better luck next time" message for non-winners
- **Winners List**: 
  - Displays all winners with medal emojis (🥇🥈🥉)
  - Highlights current participant if they won
  - Animated star icon for winner's own entry

### 4. Entry Status Indicator
- Clear visual feedback for each state:
  - **Not Entered**: Shows entry button
  - **Entering**: Loading spinner with "Entering..." text
  - **Entered**: Green confirmation box with checkmark
  - **Drawing**: Animated drawing state
  - **Winners Announced**: Shows winner status and list

## Props

```typescript
interface RaffleParticipantViewProps {
  eventId: string;        // Event identifier (for future WebSocket room management)
  activityId: string;     // Raffle activity identifier
  participantName: string; // Current participant's name
}
```

## WebSocket Events

### Listened Events

1. **raffle-started**
   - Initializes raffle with prize description
   - Resets all state for new raffle
   - Payload: `{ activityId, prizeDescription }`

2. **raffle-entry-confirmed**
   - Confirms participant's entry
   - Updates entry status
   - Payload: `{ activityId, participantId }`

3. **raffle-drawing**
   - Triggers drawing animation
   - Shows "Drawing Winners..." state
   - Payload: `{ activityId }`

4. **raffle-winners-announced**
   - Displays winners list
   - Shows winner/non-winner status
   - Payload: `{ activityId, winners: RaffleWinner[] }`

5. **raffle-ended**
   - Marks raffle as complete
   - Shows final thank you message
   - Payload: `{ activityId }`

## API Integration

### Enter Raffle Endpoint

```typescript
POST /api/activities/:activityId/enter
Body: { participantName: string }
```

- Submits participant's entry to the raffle
- Returns success/error response
- Entry confirmation comes via WebSocket event

## State Management

```typescript
const [prizeDescription, setPrizeDescription] = useState('');
const [hasEntered, setHasEntered] = useState(false);
const [isEntering, setIsEntering] = useState(false);
const [winners, setWinners] = useState<RaffleWinner[]>([]);
const [showWinners, setShowWinners] = useState(false);
const [isDrawing, setIsDrawing] = useState(false);
const [isRaffleEnded, setIsRaffleEnded] = useState(false);
```

## UI States

### 1. Initial State (Not Entered)
- Prize description display
- "Enter Raffle" button
- Animated gift icon

### 2. Entering State
- Prize description display
- Disabled button with loading spinner
- "Entering..." text

### 3. Entered State
- Prize description display
- Green confirmation box with checkmark
- "You're Entered!" message
- "Good luck" message

### 4. Drawing State
- Prize description display
- Animated dice icon
- "Drawing Winners..." message
- Loading dots animation

### 5. Winners Announced State
- Winner/non-winner status card
- Winners list with medals
- Highlighted entry for current participant
- Animated elements for winners

### 6. Ended State
- All winner information visible
- Final thank you message

## Animations

### Framer Motion Animations

1. **Container Entry**
   ```typescript
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   ```

2. **Gift Icon**
   ```typescript
   animate={{
     scale: [1, 1.1, 1],
     rotate: [0, 5, -5, 0],
   }}
   transition={{ duration: 2, repeat: Infinity }}
   ```

3. **Drawing Animation**
   ```typescript
   animate={{
     scale: [1, 1.2, 1],
     rotate: [0, 360],
   }}
   transition={{ duration: 2, repeat: Infinity }}
   ```

4. **Winner Announcement**
   ```typescript
   initial={{ scale: 0, rotate: -180 }}
   animate={{ scale: 1, rotate: 0 }}
   transition={{ type: 'spring', stiffness: 200, damping: 15 }}
   ```

5. **Winners List Items**
   ```typescript
   initial={{ opacity: 0, x: -20 }}
   animate={{ opacity: 1, x: 0 }}
   transition={{ delay: index * 0.1 }}
   ```

## Styling

### Color Scheme
- **Primary Gradient**: Purple to Pink (`from-purple-600 to-pink-600`)
- **Winner Gradient**: Yellow to Orange (`from-yellow-400 to-orange-500`)
- **Success**: Green (`green-500`)
- **Background**: White with opacity and backdrop blur

### Responsive Design
- Mobile-first approach
- Breakpoints: `md:` (768px+)
- Adjustable text sizes, padding, and icon sizes
- Touch-friendly button sizes

## Error Handling

- API errors are caught and displayed via alert
- Console logging for debugging
- Graceful fallbacks for missing data
- Loading states prevent duplicate submissions

## Accessibility

- Semantic HTML structure
- Clear visual feedback for all states
- High contrast text and backgrounds
- Large, touch-friendly interactive elements
- Descriptive text for screen readers

## Usage Example

```tsx
import RaffleParticipantView from './RaffleParticipantView';

function ParticipantView() {
  return (
    <RaffleParticipantView
      eventId="event-123"
      activityId="raffle-456"
      participantName="John Doe"
    />
  );
}
```

## Integration with ParticipantActivityView

The component is designed to be used within `ParticipantActivityView` when a raffle activity is active:

```tsx
if (activityState === 'raffle') {
  return (
    <RaffleParticipantView
      eventId={eventId}
      activityId={currentActivity?.activityId || ''}
      participantName={participantName}
    />
  );
}
```

## Future Enhancements

1. **Automatic Entry Mode**: Support for automatic entry when raffle starts
2. **Entry Count Display**: Show total number of entries
3. **Countdown Timer**: Display time remaining before drawing
4. **Sound Effects**: Add audio feedback for winner announcement
5. **Confetti Animation**: Full-screen confetti for winners
6. **Share Results**: Allow winners to share their win

## Testing Considerations

- Test all WebSocket event handlers
- Verify API integration for entry submission
- Test winner/non-winner display logic
- Verify animations work smoothly
- Test responsive design on various screen sizes
- Test error handling for failed API calls
- Verify state transitions between all UI states
