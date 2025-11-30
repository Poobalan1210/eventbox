# ActivityControlPanel Component

## Overview

The `ActivityControlPanel` component provides a focused interface for organizers to manage activity lifecycle within an event. It displays all activities with their current status and provides activate/deactivate controls.

## Features

- **Activity Lifecycle Management**: Activate and deactivate activities with single-click controls
- **Status Visualization**: Clear status badges (draft/ready/active/completed) for each activity
- **Active Activity Indicator**: Prominent banner showing which activity is currently active
- **Real-time Updates**: Automatically refreshes after activation/deactivation
- **Loading States**: Shows loading indicators during API operations
- **Error Handling**: Displays error messages and retry options

## Props

```typescript
interface ActivityControlPanelProps {
  eventId: string;           // The event ID to manage activities for
  organizerId: string;        // The organizer's ID for authentication
  onActivityChange?: () => void; // Optional callback when activity state changes
}
```

## Usage

### Basic Usage

```tsx
import ActivityControlPanel from '../components/ActivityControlPanel';

function OrganizerDashboard() {
  return (
    <ActivityControlPanel
      eventId="event-123"
      organizerId="organizer-456"
    />
  );
}
```

### With Change Callback

```tsx
import ActivityControlPanel from '../components/ActivityControlPanel';

function EventManagement() {
  const handleActivityChange = () => {
    console.log('Activity state changed');
    // Refresh other components, send notifications, etc.
  };

  return (
    <ActivityControlPanel
      eventId="event-123"
      organizerId="organizer-456"
      onActivityChange={handleActivityChange}
    />
  );
}
```

## Component Structure

### Header
- Title: "Activity Control Panel"
- Description of functionality

### Active Activity Banner (when activity is active)
- Green background with pulse animation
- Shows currently active activity name
- Deactivate button for quick access

### No Active Activity Banner (when no activity is active)
- Yellow background
- Indicates participants are in waiting state

### Activity List
- All activities sorted by order
- Each activity shows:
  - Icon (❓ quiz, 📊 poll, 🎁 raffle)
  - Name
  - Status badge
  - Type and order number
  - Activate/Deactivate button (based on state)

### Footer Stats
- Total activity count
- Breakdown by status (Ready/Active/Completed)

## Activity States

### Draft
- **Badge**: Gray with 📝 icon
- **Action**: No action available
- **Description**: Activity is not yet ready to be activated

### Ready
- **Badge**: Blue with ✓ icon
- **Action**: Activate button available
- **Description**: Activity is configured and ready to be activated

### Active
- **Badge**: Green with pulsing dot
- **Action**: Deactivate button available
- **Description**: Activity is currently active for participants

### Completed
- **Badge**: Purple with ✓ icon
- **Action**: No action available
- **Description**: Activity has been completed

## API Integration

The component interacts with the following API endpoints:

- `GET /api/events/:eventId/activities` - Fetch all activities
- `POST /api/activities/:activityId/activate` - Activate an activity
- `POST /api/activities/:activityId/deactivate` - Deactivate an activity

## Requirements Validation

This component satisfies the following requirements:

- **Requirement 4.1**: Activates activities to make them visible to participants
- **Requirement 4.2**: Ensures mutual exclusion (only one active activity)
- **Requirement 4.4**: Deactivates activities to return participants to waiting state

## Styling

The component uses:
- Tailwind CSS for styling
- Backdrop blur effects for glassmorphism
- Pulse animations for active indicators
- Responsive design for mobile and desktop

## Error Handling

- Network errors: Shows error message with retry button
- API errors: Displays error alert with specific message
- Loading states: Shows spinner during operations
- Disabled states: Prevents multiple simultaneous operations

## Accessibility

- Semantic HTML structure
- Clear button labels with emoji icons
- Disabled states for buttons during operations
- Color contrast for readability

## Future Enhancements

Potential improvements:
- Drag-and-drop reordering of activities
- Bulk operations (activate multiple in sequence)
- Activity preview before activation
- Scheduled activation times
- Activity analytics and metrics
