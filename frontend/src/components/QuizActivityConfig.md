# QuizActivityConfig Component

## Overview

The `QuizActivityConfig` component provides a comprehensive interface for configuring quiz activities within the event-activities platform. It allows organizers to:

1. Configure quiz-specific settings (scoring, speed bonus, streak tracking)
2. Add, edit, and delete questions
3. Mark the activity as ready for activation

## Features

### Quiz Settings

- **Scoring Enabled**: Toggle whether to track participant scores and display leaderboards
- **Speed Bonus**: Award bonus points for faster correct answers (requires scoring to be enabled)
- **Streak Tracking**: Track consecutive correct answers and award streak bonuses (requires scoring to be enabled)

### Question Management

The component reuses the existing `QuestionForm` functionality but adapts it to work with `activityId` instead of `eventId`. This ensures:

- All existing quiz features are preserved (question images, multiple choice, timers)
- Questions are properly associated with the activity
- The same familiar interface for organizers

### Status Management

- Activities start in `draft` status
- Once at least one question is added, the activity can be marked as `ready`
- Ready activities can be activated by the organizer

## Usage

```tsx
import QuizActivityConfig from '../components/QuizActivityConfig';
import { QuizActivity } from '../types/models';

function MyComponent() {
  const [activity, setActivity] = useState<QuizActivity>(...);

  const handleUpdate = () => {
    // Refresh activity data
    console.log('Activity updated');
  };

  const handleCancel = () => {
    // Navigate back or close config
    console.log('Cancelled');
  };

  return (
    <QuizActivityConfig
      activity={activity}
      onUpdate={handleUpdate}
      onCancel={handleCancel}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activity` | `QuizActivity` | Yes | The quiz activity to configure |
| `onUpdate` | `() => void` | Yes | Callback when activity is updated |
| `onCancel` | `() => void` | No | Callback to cancel and go back |

## API Integration

The component interacts with the following API endpoints:

- `GET /api/activities/:activityId` - Fetch activity details and questions
- `PUT /api/activities/:activityId` - Update activity settings
- `POST /api/activities/:activityId/questions` - Add a new question
- `PUT /api/activities/:activityId/questions/:questionId` - Update a question
- `DELETE /api/activities/:activityId/questions/:questionId` - Delete a question
- `POST /api/activities/:activityId/questions/:questionId/image` - Upload question image

## Implementation Notes

### Reusing Existing Components

The component includes an embedded `QuestionFormWrapper` that adapts the question form to work with activities. This approach:

- Maintains consistency with the existing quiz interface
- Avoids code duplication
- Ensures all question features work correctly

### Activity vs Event

The key difference from the old quiz-centric model:

- **Old**: Questions belonged to events (`eventId`)
- **New**: Questions belong to quiz activities (`activityId`)

The component handles this transition seamlessly by using the activity-specific endpoints.

## Requirements Validation

This component satisfies the following requirements:

- **Requirement 3.1**: Allows configuring quiz activities with questions and answers
- **Requirement 10.4**: Supports quiz-specific settings (scoring, speed bonus, streaks)

## Future Enhancements

Potential improvements:

1. Drag-and-drop question reordering
2. Question preview mode
3. Bulk question import
4. Question templates
5. Question bank/library
