# PollActivityConfig Component

## Overview

The `PollActivityConfig` component provides a configuration interface for poll activities within events. It allows organizers to set up poll questions, define voting options, and configure poll behavior settings.

## Features

### Poll Configuration
- **Question Editor**: Text area for entering the poll question
- **Options Management**: Add, edit, and remove poll options (2-10 options)
- **Settings**:
  - Allow Multiple Votes: Enable participants to select multiple options
  - Show Results Live: Display real-time voting results to participants

### Poll Preview
- Interactive preview showing how the poll will appear to participants
- Displays configured question and options
- Shows enabled settings (multiple votes, live results)

### Status Management
- Save configuration without changing activity status
- Mark activity as "ready" when configuration is complete
- Validation ensures minimum requirements are met before marking ready

## Props

```typescript
interface PollActivityConfigProps {
  activity: PollActivity;      // The poll activity to configure
  onUpdate: () => void;         // Callback when activity is updated
  onCancel?: () => void;        // Optional callback to cancel editing
}
```

## Usage

```tsx
import PollActivityConfig from '../components/PollActivityConfig';
import { PollActivity } from '../types/models';

function EventActivities() {
  const [editingActivity, setEditingActivity] = useState<PollActivity | null>(null);

  const handleUpdate = () => {
    // Refresh activity list
    setEditingActivity(null);
  };

  return (
    <PollActivityConfig
      activity={editingActivity}
      onUpdate={handleUpdate}
      onCancel={() => setEditingActivity(null)}
    />
  );
}
```

## Validation Rules

1. **Question**: Must not be empty
2. **Options**: 
   - Minimum 2 options required
   - Maximum 10 options allowed
   - All options must have text
3. **Ready Status**: Can only mark as ready when all validation rules pass

## API Integration

The component interacts with the following endpoints:

- `GET /api/activities/:activityId` - Fetch current poll configuration
- `PUT /api/activities/:activityId` - Update poll configuration
- `PUT /api/activities/:activityId` (with status) - Mark activity as ready

## State Management

- **Local State**: Manages form inputs and UI state
- **Server State**: Fetches and syncs with backend on mount and after updates
- **Validation**: Client-side validation before API calls

## Design Pattern

Follows the same pattern as `QuizActivityConfig`:
- Separate sections for configuration and preview
- Inline validation with error messages
- Success feedback after saves
- Disabled state during API operations

## Requirements Validation

Validates **Requirement 3.2** from the design document:
- Poll question and options editor ✓
- Settings for multiple votes ✓
- Settings for live results ✓
- Poll preview ✓
