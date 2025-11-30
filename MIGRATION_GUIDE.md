# Migration Guide: Quiz-Centric to Event Activities Platform

## Overview

This guide helps you migrate from the quiz-centric model to the new event activities platform. The migration involves both conceptual changes and practical code updates.

---

## Table of Contents

1. [What's Changed](#whats-changed)
2. [Conceptual Changes](#conceptual-changes)
3. [Data Migration](#data-migration)
4. [API Changes](#api-changes)
5. [WebSocket Changes](#websocket-changes)
6. [Frontend Changes](#frontend-changes)
7. [Step-by-Step Migration](#step-by-step-migration)
8. [Rollback Procedure](#rollback-procedure)
9. [FAQ](#faq)

---

## What's Changed

### High-Level Changes

**Before:**
- Participants joined individual quizzes
- Each quiz was a standalone entity
- Public quiz browsing available
- Templates for quiz creation

**After:**
- Participants join events (containers)
- Events contain multiple activities (quiz, poll, raffle)
- Organizers control which activity is active
- No public browsing (events are private or join-code only)
- Activity presets replace templates

### Key Benefits

1. **Multi-Activity Events**: Run quizzes, polls, and raffles in a single event
2. **Better Control**: Organizers decide when to show each activity
3. **Seamless Transitions**: Switch between activities without participants leaving
4. **Unified Experience**: Single join code for all activities
5. **Extensibility**: Easy to add new activity types in the future

---

## Conceptual Changes

### Data Model Evolution

#### Old Model
```
Quiz (Event)
├── Questions
├── Participants
└── Answers
```

#### New Model
```
Event
├── Activity 1: Quiz
│   ├── Questions
│   └── Quiz-specific config
├── Activity 2: Poll
│   ├── Options
│   └── Votes
└── Activity 3: Raffle
    ├── Entries
    └── Winners
```

### Terminology Changes

| Old Term | New Term | Notes |
|----------|----------|-------|
| Quiz | Event | Top-level container |
| Quiz Session | Quiz Activity | One type of activity |
| Join Quiz | Join Event | Participants join events |
| Quiz Code | Join Code / Game PIN | Same concept, different context |
| Public Quiz | N/A | Feature removed |
| Template | Activity Preset | Configuration before activation |

---

## Data Migration

### Automatic Migration Script

We provide a migration script that automatically converts your existing data:

```bash
# Run migration
npx tsx scripts/migrate-to-activities.ts

# Verify migration
npx tsx scripts/verify-migration.ts

# Check migration report
cat migration-report.json
```

### What the Migration Does

1. **Schema Updates**
   - Adds `activeActivityId` field to Events table
   - Creates Activities table
   - Creates PollVotes table
   - Creates RaffleEntries table
   - Adds GSI for event-activity lookups

2. **Data Transformation**
   - Each existing event becomes an event with one quiz activity
   - All questions are migrated to reference the new activity
   - GamePins are preserved
   - Privacy settings are maintained
   - All participant data is preserved

3. **Validation**
   - Verifies all events have corresponding activities
   - Checks all questions reference valid activities
   - Confirms no data loss
   - Generates detailed report

### Migration Report Example

```json
{
  "timestamp": "2025-11-30T12:00:00Z",
  "status": "success",
  "eventsProcessed": 150,
  "activitiesCreated": 150,
  "questionsMigrated": 1500,
  "errors": [],
  "warnings": [
    "Event event-123 had no questions"
  ]
}
```

### Manual Migration Steps

If you need to migrate manually:

1. **Backup your data**
   ```bash
   # Export current data
   aws dynamodb scan --table-name Events > events-backup.json
   aws dynamodb scan --table-name Questions > questions-backup.json
   ```

2. **Update schema**
   ```bash
   # Run schema migration
   npx tsx scripts/migrate-schema.ts
   ```

3. **Transform data**
   ```bash
   # Run data transformation
   npx tsx scripts/migrate-data.ts
   ```

4. **Verify**
   ```bash
   # Run verification
   npx tsx scripts/verify-migration.ts
   ```

---

## API Changes

### Event Creation

#### Before
```javascript
// Create a quiz directly
POST /api/events
{
  "name": "My Quiz",
  "organizerId": "org-123"
}
```

#### After
```javascript
// Step 1: Create an event
POST /api/events
{
  "name": "My Event",
  "organizerId": "org-123",
  "visibility": "private"
}

// Step 2: Add a quiz activity
POST /api/events/:eventId/activities
{
  "name": "My Quiz",
  "type": "quiz",
  "scoringEnabled": true
}
```

### Question Management

#### Before
```javascript
// Add question to event
POST /api/events/:eventId/questions
{
  "text": "What is 2 + 2?",
  "options": [...],
  "correctOptionId": "opt2"
}
```

#### After
```javascript
// Add question to quiz activity
POST /api/activities/:activityId/questions
{
  "text": "What is 2 + 2?",
  "options": [...],
  "correctOptionId": "opt2"
}
```

**Note:** Old endpoints still work for backward compatibility but are deprecated.

### Activity Control (New)

```javascript
// Activate an activity
POST /api/activities/:activityId/activate

// Deactivate an activity
POST /api/activities/:activityId/deactivate

// Switch to a different activity
POST /api/activities/:anotherActivityId/activate
```

### Removed Endpoints

The following endpoints have been removed:

```javascript
// Public quiz browsing (removed)
GET /api/events/public

// Template management (removed)
GET /api/templates
POST /api/templates
PUT /api/templates/:templateId
DELETE /api/templates/:templateId
```

---

## WebSocket Changes

### Connection

#### Before
```javascript
// Join a quiz
socket.emit('join-event', { eventId: quizId });
```

#### After
```javascript
// Join an event (same emit, different concept)
socket.emit('join-event', { eventId: eventId });
```

### New Events to Handle

```javascript
// Activity lifecycle
socket.on('activity-activated', (data) => {
  // Handle activity activation
  const { activity } = data;
  
  if (activity.type === 'quiz') {
    showQuizInterface(activity);
  } else if (activity.type === 'poll') {
    showPollInterface(activity);
  } else if (activity.type === 'raffle') {
    showRaffleInterface(activity);
  }
});

socket.on('activity-deactivated', () => {
  // Return to waiting state
  showWaitingScreen();
});

socket.on('waiting-for-activity', (data) => {
  // Show waiting screen
  showWaitingScreen(data);
});
```

### Quiz Events (Unchanged)

Quiz-specific events remain the same:
- `quiz-started`
- `question-revealed`
- `answer-submitted`
- `answer-results-revealed`
- `leaderboard-updated`
- `quiz-ended`

---

## Frontend Changes

### Component Structure

#### Before
```
App
├── QuizList
├── QuizView
│   ├── QuestionDisplay
│   └── Leaderboard
└── ParticipantView
    └── QuizInterface
```

#### After
```
App
├── EventList
├── EventView
│   ├── ActivityList
│   ├── ActivityControlPanel
│   └── ActivityConfig (Quiz/Poll/Raffle)
└── ParticipantView
    ├── WaitingForActivity
    └── ParticipantActivityView
        ├── QuizInterface
        ├── PollInterface
        └── RaffleInterface
```

### Participant View Updates

#### Before
```javascript
// Participant always sees quiz interface
function ParticipantView() {
  return <QuizInterface />;
}
```

#### After
```javascript
// Participant sees dynamic interface based on active activity
function ParticipantView() {
  const { activeActivity, isWaiting } = useActivityState(eventId);
  
  if (isWaiting) {
    return <WaitingForActivity />;
  }
  
  return (
    <ParticipantActivityView activity={activeActivity} />
  );
}
```

### Organizer Dashboard Updates

#### Before
```javascript
// Organizer manages quiz questions
function OrganizerDashboard() {
  return (
    <div>
      <QuestionList />
      <AddQuestionForm />
      <StartQuizButton />
    </div>
  );
}
```

#### After
```javascript
// Organizer manages multiple activities
function OrganizerDashboard() {
  return (
    <div>
      <ActivityList />
      <AddActivityDialog />
      <ActivityControlPanel />
      {selectedActivity && (
        <ActivityConfig activity={selectedActivity} />
      )}
    </div>
  );
}
```

---

## Step-by-Step Migration

### Phase 1: Preparation (Day 1)

1. **Backup Data**
   ```bash
   npm run backup-data
   ```

2. **Review Changes**
   - Read this migration guide
   - Review API documentation
   - Check WebSocket events reference

3. **Test Migration Script**
   ```bash
   # Test on development environment
   npm run test-migration
   ```

### Phase 2: Backend Migration (Day 2-3)

1. **Update Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Run Schema Migration**
   ```bash
   npx tsx scripts/migrate-schema.ts
   ```

3. **Run Data Migration**
   ```bash
   npx tsx scripts/migrate-to-activities.ts
   ```

4. **Verify Migration**
   ```bash
   npx tsx scripts/verify-migration.ts
   ```

5. **Test Endpoints**
   ```bash
   npm run test-endpoints
   ```

### Phase 3: Frontend Migration (Day 4-5)

1. **Update Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Update Components**
   - Replace quiz-centric components with event-centric ones
   - Add activity switching logic
   - Implement waiting state

3. **Update WebSocket Handlers**
   - Add activity lifecycle event handlers
   - Update quiz event handlers to work with activities

4. **Test UI**
   ```bash
   npm run dev
   # Manual testing of all flows
   ```

### Phase 4: Integration Testing (Day 6)

1. **End-to-End Tests**
   ```bash
   npm run test:integration
   ```

2. **Manual Testing**
   - Create event
   - Add multiple activities
   - Activate/deactivate activities
   - Test participant experience
   - Test activity switching

3. **Performance Testing**
   ```bash
   npm run test:performance
   ```

### Phase 5: Deployment (Day 7)

1. **Deploy Backend**
   ```bash
   npm run deploy:backend
   ```

2. **Deploy Frontend**
   ```bash
   npm run deploy:frontend
   ```

3. **Monitor**
   - Check logs for errors
   - Monitor WebSocket connections
   - Verify data integrity

---

## Rollback Procedure

If you need to rollback the migration:

### Automatic Rollback

```bash
# Rollback to previous state
npx tsx scripts/rollback-activity-migration.ts

# Verify rollback
npx tsx scripts/verify-rollback.ts
```

### Manual Rollback

1. **Restore Data**
   ```bash
   # Restore from backup
   aws dynamodb batch-write-item --request-items file://events-backup.json
   ```

2. **Revert Schema**
   ```bash
   # Remove new tables
   npx tsx scripts/revert-schema.ts
   ```

3. **Redeploy Old Code**
   ```bash
   git checkout pre-migration-tag
   npm run deploy
   ```

---

## FAQ

### Q: Will my existing quiz data be lost?

**A:** No. The migration script preserves all existing data including questions, answers, participants, and settings.

### Q: Can I still use the old API endpoints?

**A:** Yes, for a transition period. Old endpoints are deprecated but still functional. However, new features will only be available through new endpoints.

### Q: What happens to public quizzes?

**A:** Public quiz browsing has been removed. All events are now private (join code only) or public (accessible via join code, not browsable).

### Q: Can I create quiz-only events?

**A:** Yes. You can create an event with a single quiz activity, which functions similarly to the old model.

### Q: How do I migrate custom integrations?

**A:** Update your integration code to use the new API endpoints and WebSocket events. See the API documentation for details.

### Q: What if the migration fails?

**A:** The migration script includes rollback functionality. If migration fails, run the rollback script to restore your previous state.

### Q: Do I need to update my mobile app?

**A:** Yes, if you have a mobile app, you'll need to update it to use the new API endpoints and handle new WebSocket events.

### Q: Can I test the migration without affecting production?

**A:** Yes, test the migration on a development or staging environment first. The migration script can be run multiple times safely.

### Q: How long does migration take?

**A:** For most installations, migration takes 5-10 minutes. Large installations (1000+ events) may take longer.

### Q: Will participants need to rejoin?

**A:** No, existing participant sessions will continue to work. However, they may need to refresh their browser to see the new interface.

---

## Support

If you encounter issues during migration:

1. Check the migration report for errors
2. Review the troubleshooting section in API documentation
3. Run the verification script to identify issues
4. Check server logs for detailed error messages

---

## Checklist

Use this checklist to track your migration progress:

- [ ] Backup all data
- [ ] Review migration guide
- [ ] Test migration script on development
- [ ] Run schema migration
- [ ] Run data migration
- [ ] Verify migration success
- [ ] Update backend code
- [ ] Test backend endpoints
- [ ] Update frontend code
- [ ] Test frontend UI
- [ ] Run integration tests
- [ ] Deploy to staging
- [ ] Test staging environment
- [ ] Deploy to production
- [ ] Monitor production
- [ ] Update documentation
- [ ] Notify users of changes

---

**Last Updated:** November 30, 2025
**Migration Version:** 2.0
