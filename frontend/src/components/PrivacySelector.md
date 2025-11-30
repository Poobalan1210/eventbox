# PrivacySelector Component

## Overview

The `PrivacySelector` component provides a user-friendly interface for organizers to control quiz visibility settings. It allows users to choose between private and public quiz modes with clear visual indicators.

## Features

- **Clear Visual Design**: Uses icons (🔒 for private, 🌐 for public) and color-coded selections
- **Radio Button Interface**: Intuitive selection with visual feedback
- **Disabled State**: Prevents changes to live quizzes with appropriate messaging
- **Responsive Layout**: Works on mobile and desktop with grid layout
- **Accessibility**: Proper button semantics and keyboard navigation

## Props

```typescript
interface PrivacySelectorProps {
  value: EventVisibility;           // Current visibility setting ('private' | 'public')
  onChange: (value: EventVisibility) => void;  // Callback when selection changes
  disabled?: boolean;                // Optional: Disable the selector (default: false)
}
```

## Usage Examples

### Basic Usage in Quiz Creation

```tsx
import PrivacySelector from '../components/PrivacySelector';
import { EventVisibility } from '../types/models';

function CreateQuiz() {
  const [visibility, setVisibility] = useState<EventVisibility>('private');

  return (
    <form>
      <PrivacySelector
        value={visibility}
        onChange={setVisibility}
      />
    </form>
  );
}
```

### Usage in Quiz Editing (with API update)

```tsx
import PrivacySelector from '../components/PrivacySelector';
import { EventVisibility } from '../types/models';

function EditQuiz({ eventId, currentStatus }) {
  const [visibility, setVisibility] = useState<EventVisibility>('private');

  const handleVisibilityChange = async (newVisibility: EventVisibility) => {
    try {
      const response = await fetch(`/api/events/${eventId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (response.ok) {
        setVisibility(newVisibility);
      }
    } catch (err) {
      console.error('Failed to update visibility:', err);
    }
  };

  return (
    <PrivacySelector
      value={visibility}
      onChange={handleVisibilityChange}
      disabled={currentStatus === 'live'}
    />
  );
}
```

### Disabled State for Live Quizzes

```tsx
<PrivacySelector
  value={visibility}
  onChange={setVisibility}
  disabled={true}  // Prevents changes to live quizzes
/>
```

## Visual States

### Private Selected
- Blue highlight (answer-blue color)
- Lock icon (🔒)
- Radio button filled
- Description: "Requires Game PIN or link to join"

### Public Selected
- Green highlight (answer-green color)
- Globe icon (🌐)
- Radio button filled
- Description: "Discoverable in public quiz browser"

### Disabled State
- Reduced opacity (50%)
- Cursor not-allowed
- Helper text: "Privacy settings cannot be changed for live quizzes"

## Requirements Validation

This component satisfies the following requirements:

- **Requirement 23.1**: Allows organizers to select Private or Public visibility when creating an event
- **Requirement 23.4**: Defaults new quizzes to Private visibility (handled by parent component)
- **Requirement 23.5**: Allows organizers to change quiz visibility before the quiz starts (disabled state prevents changes during live mode)

## Styling

The component uses Tailwind CSS classes and follows the Kahoot-inspired theme:
- `answer-blue` for private selection
- `answer-green` for public selection
- White text on colored backgrounds
- Backdrop blur effects for glassmorphism
- Smooth transitions for hover and selection states

## Accessibility

- Uses semantic `<button>` elements for keyboard navigation
- Clear visual indicators for selected state
- Descriptive labels and helper text
- Disabled state properly communicated
- Touch-friendly minimum height (56px)

## Integration Points

The component is integrated in:
1. **CreateEvent page** - For setting initial quiz visibility
2. **SetupMode component** - For editing quiz visibility before starting
3. **QuizManagement page** - Can be added for quiz editing (future enhancement)

## API Integration

The component expects the parent to handle API calls. Typical API endpoint:

```
PATCH /api/events/:eventId/visibility
Body: { visibility: 'private' | 'public' }
```

## Testing

To test the component:
1. Create a new quiz and verify default is 'private'
2. Toggle between private and public options
3. Verify visual feedback (colors, icons, radio buttons)
4. Start a quiz and verify the selector becomes disabled
5. Check responsive layout on mobile devices
