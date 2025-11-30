# Activity Management Components

This document describes the activity management components created for the event-activities platform.

## Components

### 1. ActivityCard

**Location:** `frontend/src/components/ActivityCard.tsx`

**Purpose:** Displays an individual activity with its details, status, and action buttons.

**Props:**
- `activity: Activity` - The activity to display
- `isActive: boolean` - Whether this activity is currently active
- `onActivate: (activityId: string) => void` - Handler for activating the activity
- `onDeactivate: (activityId: string) => void` - Handler for deactivating the activity
- `onEdit: (activityId: string) => void` - Handler for editing the activity
- `onDelete: (activityId: string) => void` - Handler for deleting the activity

**Features:**
- Visual indicators for activity type (quiz ❓, poll 📊, raffle 🎁)
- Status badges (draft, ready, active, completed)
- Type-specific details display
- Activate/deactivate buttons (context-aware)
- Edit and delete buttons (when appropriate)
- Active activity highlighting with animated border

### 2. AddActivityDialog

**Location:** `frontend/src/components/AddActivityDialog.tsx`

**Purpose:** Modal dialog for selecting activity type and naming a new activity.

**Props:**
- `isOpen: boolean` - Controls dialog visibility
- `onClose: () => void` - Handler for closing the dialog
- `onAdd: (type: ActivityType, name: string) => void` - Handler for adding a new activity

**Features:**
- Three activity type cards (Quiz, Poll, Raffle)
- Feature descriptions for each type
- Activity name input field
- Form validation
- Responsive design

### 3. ActivityList

**Location:** `frontend/src/components/ActivityList.tsx`

**Purpose:** Main container component that manages and displays all activities for an event.

**Props:**
- `eventId: string` - The event ID to load activities for
- `organizerId: string` - The organizer ID for authentication
- `onActivityEdit?: (activityId: string) => void` - Optional handler for editing activities

**Features:**
- Fetches activities from API
- Activity type filtering (All, Quiz, Poll, Raffle)
- Active activity banner
- Add activity button
- CRUD operations (Create, Read, Update, Delete)
- Activity activation/deactivation
- Loading and error states
- Empty state with call-to-action

**API Integration:**
- `GET /api/events/:eventId/activities` - List activities
- `POST /api/events/:eventId/activities` - Create activity
- `POST /api/activities/:activityId/activate` - Activate activity
- `POST /api/activities/:activityId/deactivate` - Deactivate activity
- `DELETE /api/activities/:activityId` - Delete activity

## Usage Example

### Basic Integration

```tsx
import ActivityList from '../components/ActivityList';

function EventManagementPage() {
  const eventId = 'event-123';
  const organizerId = 'organizer-456';

  const handleActivityEdit = (activityId: string) => {
    // Navigate to activity configuration page
    navigate(`/organizer/${eventId}/activity/${activityId}`);
  };

  return (
    <div>
      <h1>Event Activities</h1>
      <ActivityList
        eventId={eventId}
        organizerId={organizerId}
        onActivityEdit={handleActivityEdit}
      />
    </div>
  );
}
```

### Complete Page Example

See `frontend/src/pages/EventActivities.tsx` for a complete example of integrating the ActivityList component into a page with:
- Event header
- Connection status
- Navigation
- Error handling
- Loading states

## Integration with Organizer Dashboard

To integrate activity management into the existing organizer dashboard:

### Option 1: Add Activities Tab to QuizManagement

Add a tab to the QuizManagement page that shows activities:

```tsx
// In QuizManagement.tsx or QuizModeManager.tsx
import ActivityList from '../components/ActivityList';

// Add a tab for activities
<Tabs>
  <Tab label="Questions">
    <QuestionList />
  </Tab>
  <Tab label="Activities">
    <ActivityList eventId={eventId} organizerId={organizerId} />
  </Tab>
</Tabs>
```

### Option 2: Create Dedicated Event Activities Page

Create a new route for event activities management:

```tsx
// In App.tsx or router configuration
<Route path="/organizer/:eventId/activities" element={<EventActivities />} />
```

Then add a link from the organizer dashboard:

```tsx
// In OrganizerDashboard.tsx or QuizCard.tsx
<Link to={`/organizer/${eventId}/activities`}>
  Manage Activities
</Link>
```

### Option 3: Replace Quiz-Centric View

For the full event-activities platform migration, replace the quiz-centric view with an event-centric view:

```tsx
// In OrganizerDashboard.tsx
// Instead of showing quiz cards, show event cards
// Each event card links to EventActivities page
<EventCard event={event} onClick={() => navigate(`/organizer/${event.id}/activities`)} />
```

## Styling

The components use Tailwind CSS and follow the existing Kahoot-inspired design system:

- **Colors:**
  - Primary: `kahoot-purple-dark`
  - Accent: `answer-yellow`
  - Status colors: red (live), blue (ready), gray (draft), purple (completed)

- **Animations:**
  - Pulse effect for active activities
  - Hover transitions
  - Loading spinners

## API Types

The components use TypeScript interfaces defined in `frontend/src/types/api.ts`:

- `CreateActivityRequest`
- `CreateActivityResponse`
- `GetActivitiesResponse`
- `ActivateActivityResponse`
- `DeactivateActivityResponse`
- `DeleteActivityResponse`

## Next Steps

To complete the activity management integration:

1. **Activity Configuration Components** (Tasks 22-24)
   - Create QuizActivityConfig component
   - Create PollActivityConfig component
   - Create RaffleActivityConfig component

2. **Activity Control Panel** (Task 25)
   - Create ActivityControlPanel component for live event management

3. **Update Organizer Dashboard** (Task 26)
   - Integrate ActivityList into the main dashboard
   - Update navigation and routing

4. **WebSocket Integration** (Tasks 33-34)
   - Add real-time activity updates
   - Handle activity state changes via WebSocket

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 2.1:** Quiz activity creation ✓
- **Requirement 2.2:** Poll activity creation ✓
- **Requirement 2.3:** Raffle activity creation ✓
- **Requirement 2.4:** Activity viewing and grouping ✓
- **Requirement 2.5:** Activity deletion ✓

The components provide a complete CRUD interface for activity management with proper error handling, loading states, and user feedback.
