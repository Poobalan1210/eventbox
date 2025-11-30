# WaitingForActivity Component

## Overview

The `WaitingForActivity` component displays an engaging waiting state when no activity is currently active in an event. It provides visual feedback to participants, showing them that they're connected and waiting for the organizer to start an activity.

## Requirements

- **4.3**: Display waiting state when no activity is active
- **6.1**: Show waiting screen to participants

## Features

- ✨ Engaging animated clock icon with rotation and scale effects
- 👋 Personalized welcome message with participant name
- 📊 Real-time participant count display
- 🎯 Event name display
- 💬 Customizable waiting message
- 🎨 Animated loading dots with staggered timing
- 💡 Helpful tip section
- 📱 Fully responsive design (mobile-first)
- ♿ Accessible with proper ARIA attributes

## Props

```typescript
interface WaitingForActivityProps {
  eventName?: string;          // Name of the event
  participantCount?: number;   // Number of participants currently waiting
  participantName?: string;    // Name of the current participant
  message?: string;            // Custom waiting message (default: "Waiting for organizer to start an activity")
}
```

## Usage Examples

### Basic Usage

```tsx
import WaitingForActivity from './WaitingForActivity';

function ParticipantView() {
  return (
    <WaitingForActivity
      participantName="Alice"
    />
  );
}
```

### Full Featured

```tsx
<WaitingForActivity
  eventName="SCD2025 Conference"
  participantCount={42}
  participantName="Bob"
  message="Get ready for some exciting activities!"
/>
```

### Custom Message

```tsx
<WaitingForActivity
  eventName="Team Building Event"
  participantCount={15}
  participantName="Charlie"
  message="The organizer is preparing the next activity"
/>
```

### Minimal (No Participant Name)

```tsx
<WaitingForActivity
  eventName="Workshop 2024"
  participantCount={8}
/>
```

## Visual Design

### Layout Structure

```
┌─────────────────────────────────────┐
│                                     │
│         🕐 (Animated Clock)         │
│                                     │
│      Welcome, [Name]! 👋           │
│                                     │
│            Event                    │
│        [Event Name]                 │
│                                     │
│    👥 [X] participants waiting      │
│                                     │
│   [Waiting Message]...              │
│                                     │
│         ● ● ● (Animated)            │
│                                     │
│  ─────────────────────────────      │
│  💡 Helpful tip message             │
│                                     │
└─────────────────────────────────────┘
```

### Animations

1. **Clock Icon**: Continuous rotation and scale animation (2s loop)
2. **Participant Count Badge**: Spring animation on mount
3. **Loading Dots**: Staggered scale and opacity pulse (1.5s loop)
4. **Text Dots**: Cycling dots after message (...) every 500ms
5. **Tip Section**: Fade-in from bottom with delay

### Color Scheme

- Background: `bg-white/10` with backdrop blur
- Border: `border-white/20`
- Text: White with varying opacity (90%, 70%, 60%)
- Icon background: `bg-blue-500/20`
- Badge background: `bg-white/10`

## Responsive Behavior

### Mobile (< 640px)
- Icon: 80px (w-20 h-20)
- Title: 2xl
- Message: lg
- Padding: p-8

### Desktop (≥ 640px)
- Icon: 96px (w-24 h-24)
- Title: 3xl
- Message: xl
- Padding: p-12

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- SVG icons with proper viewBox
- Readable text contrast ratios
- Touch-friendly spacing

## Integration with ParticipantActivityView

The component is used in `ParticipantActivityView.tsx` when:
- No activity is currently active (`activityState === 'waiting'`)
- An activity is deactivated
- A `waiting-for-activity` WebSocket event is received

```tsx
// In ParticipantActivityView.tsx
if (activityState === 'waiting') {
  return (
    <WaitingForActivity
      message={waitingMessage}
      participantName={participantName}
    />
  );
}
```

## WebSocket Events

The component responds to these WebSocket events:
- `activity-deactivated`: Triggers waiting state
- `waiting-for-activity`: Updates waiting message

## Styling

The component uses:
- Tailwind CSS utility classes
- Framer Motion for animations
- Responsive design patterns
- Backdrop blur effects
- Gradient backgrounds (inherited from body)

## Performance Considerations

- Animations use CSS transforms (GPU-accelerated)
- Framer Motion optimizes re-renders
- Minimal state updates (only dots animation)
- No heavy computations

## Browser Support

- Modern browsers with CSS backdrop-filter support
- Graceful degradation for older browsers
- Mobile Safari 9+
- Chrome 76+
- Firefox 103+
- Edge 79+

## Future Enhancements

Potential improvements:
- [ ] Add sound effects option
- [ ] Show estimated wait time
- [ ] Display recent activity history
- [ ] Add fun facts or tips carousel
- [ ] Show organizer status (online/preparing)
- [ ] Add chat or emoji reactions
- [ ] Confetti animation when activity starts

## Related Components

- `ParticipantActivityView`: Parent component that uses this
- `ConnectionStatus`: Shows connection state
- `ActivityControlPanel`: Organizer's activity control interface

## Testing

See `WaitingForActivity.example.tsx` for usage examples and test scenarios.

## Notes

- The component is designed to be engaging and reduce perceived wait time
- Animations are subtle to avoid being distracting
- The design follows the Kahoot-inspired theme of the application
- All text is customizable for different event types
