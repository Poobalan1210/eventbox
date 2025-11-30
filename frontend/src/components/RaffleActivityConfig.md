# RaffleActivityConfig Component

## Overview

The `RaffleActivityConfig` component provides a comprehensive interface for organizers to configure raffle activities within an event. It follows the same design patterns as `QuizActivityConfig` and `PollActivityConfig` for consistency.

## Features

### 1. Prize Description Editor
- Multi-line textarea for detailed prize descriptions
- Placeholder text to guide organizers
- Character validation to ensure content is provided

### 2. Entry Method Selector
Two entry methods are supported:
- **Automatic Entry**: All connected participants are automatically entered when the raffle starts
- **Manual Entry**: Participants must click a button to enter the raffle

The selector uses radio buttons with clear descriptions of each method.

### 3. Winner Count Configuration
- Number input field for specifying how many winners will be selected
- Validation: Must be between 1 and 100
- Clear helper text explaining the purpose

### 4. Configuration Preview
- Toggle-able preview section showing how the raffle will appear to participants
- Displays prize description, entry method, and winner count
- Visual representation with emoji and styled layout
- Shows appropriate UI elements based on entry method (button for manual entry)

### 5. Status Management
- Save Configuration button to persist changes
- Mark as Ready button (only shown when status is 'draft')
- Validation before marking as ready
- Success and error message display

## Component Props

```typescript
interface RaffleActivityConfigProps {
  activity: RaffleActivity;
  onUpdate: () => void;
  onCancel?: () => void;
}
```

- `activity`: The raffle activity being configured
- `onUpdate`: Callback when configuration is saved or status changes
- `onCancel`: Optional callback to return to activity list

## API Integration

The component interacts with the following endpoints:

### GET /api/activities/:activityId
Fetches the latest raffle configuration on mount and after updates.

### PUT /api/activities/:activityId
Updates raffle configuration with:
- `prizeDescription`: String describing the prize(s)
- `entryMethod`: 'automatic' or 'manual'
- `winnerCount`: Number of winners (1-100)
- `status`: 'ready' when marking as ready

## Validation Rules

1. **Prize Description**: Must not be empty
2. **Winner Count**: 
   - Must be a valid number
   - Must be at least 1
   - Cannot exceed 100

## State Management

The component maintains the following state:
- `prizeDescription`: Current prize description text
- `entryMethod`: Selected entry method ('automatic' or 'manual')
- `winnerCount`: Number of winners as string (for input handling)
- `isSaving`: Loading state during API calls
- `error`: Error message to display
- `successMessage`: Success message to display
- `showPreview`: Toggle for preview visibility

## User Flow

1. Organizer navigates to raffle activity configuration
2. Enters prize description
3. Selects entry method (automatic or manual)
4. Sets number of winners
5. Clicks "Save Configuration" to persist changes
6. Optionally views preview to see participant experience
7. When satisfied, clicks "Mark as Ready" to make activity available for activation

## Integration

The component is integrated into the event activities workflow:

```typescript
// In EventActivities.tsx
if (editingActivity.type === 'raffle') {
  return (
    <RaffleActivityConfig
      activity={editingActivity as RaffleActivity}
      onUpdate={handleActivityUpdate}
      onCancel={handleCancelEdit}
    />
  );
}
```

## Styling

The component uses:
- Tailwind CSS for styling
- Consistent color scheme with other activity configs
- Responsive design for mobile and desktop
- Hover states and transitions for interactive elements
- Clear visual hierarchy with sections and spacing

## Requirements Satisfied

This component satisfies **Requirement 3.3** from the design document:
- ✅ Prize description editor
- ✅ Entry method selector (automatic/manual)
- ✅ Winner count configuration
- ✅ Configuration persistence
- ✅ Status management (draft → ready)

## Future Enhancements

Potential improvements:
- Image upload for prize visualization
- Multiple prize tiers
- Entry restrictions (e.g., minimum participation requirements)
- Custom winner announcement messages
- Entry deadline configuration
