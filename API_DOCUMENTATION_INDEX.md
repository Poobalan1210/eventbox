# Event Activities Platform - Documentation Index

Welcome to the Event Activities Platform API documentation. This index helps you find the right documentation for your needs.

---

## 📚 Documentation Overview

### For New Users

Start here if you're new to the Event Activities Platform:

1. **[API Quick Reference](./API_QUICK_REFERENCE.md)** - Get started quickly with common examples
2. **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
3. **[WebSocket Events Reference](./WEBSOCKET_EVENTS_REFERENCE.md)** - Real-time events guide

### For Migrating Users

If you're migrating from the quiz-centric model:

1. **[Migration Guide](./MIGRATION_GUIDE.md)** - Step-by-step migration instructions
2. **[API Documentation](./API_DOCUMENTATION.md)** - See what's changed in the API
3. **[WebSocket Events Reference](./WEBSOCKET_EVENTS_REFERENCE.md)** - New events to handle

### For Developers

Deep dive into the platform:

1. **[Design Document](./.kiro/specs/event-activities-platform/design.md)** - Architecture and design decisions
2. **[Requirements Document](./.kiro/specs/event-activities-platform/requirements.md)** - Feature requirements
3. **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference

---

## 📖 Documentation Files

### [API Documentation](./API_DOCUMENTATION.md)
**Complete API reference with all endpoints, request/response formats, and examples.**

**Contents:**
- Overview and architecture
- REST API endpoints (Events, Activities, Quiz, Poll, Raffle)
- WebSocket events
- Error handling
- Migration guide
- Code examples

**Best for:** Comprehensive API reference, understanding the full platform

---

### [API Quick Reference](./API_QUICK_REFERENCE.md)
**Quick reference guide with common workflows and code snippets.**

**Contents:**
- Common workflows (create event, add activities, etc.)
- Endpoint cheat sheet
- WebSocket events cheat sheet
- Code snippets (React, Node.js, Python)
- Testing commands
- Common errors

**Best for:** Quick lookups, copy-paste examples, getting started fast

---

### [WebSocket Events Reference](./WEBSOCKET_EVENTS_REFERENCE.md)
**Comprehensive guide to all real-time WebSocket events.**

**Contents:**
- Connection and room management
- Activity lifecycle events
- Quiz, Poll, and Raffle events
- Event flow diagrams
- Client implementation examples
- Best practices

**Best for:** Real-time features, WebSocket integration, event handling

---

### [Migration Guide](./MIGRATION_GUIDE.md)
**Step-by-step guide for migrating from quiz-centric to event activities model.**

**Contents:**
- What's changed
- Conceptual changes
- Data migration procedures
- API changes
- WebSocket changes
- Frontend changes
- Rollback procedures
- FAQ

**Best for:** Migrating existing applications, understanding breaking changes

---

## 🎯 Quick Navigation

### By Use Case

#### I want to...

**Create an event with activities**
→ [API Quick Reference - Common Workflows](./API_QUICK_REFERENCE.md#common-workflows)

**Understand the API endpoints**
→ [API Documentation - REST API Endpoints](./API_DOCUMENTATION.md#rest-api-endpoints)

**Handle real-time events**
→ [WebSocket Events Reference](./WEBSOCKET_EVENTS_REFERENCE.md)

**Migrate from old version**
→ [Migration Guide](./MIGRATION_GUIDE.md)

**See code examples**
→ [API Quick Reference - Code Snippets](./API_QUICK_REFERENCE.md#code-snippets)

**Understand the architecture**
→ [Design Document](./.kiro/specs/event-activities-platform/design.md)

**Debug an error**
→ [API Documentation - Error Handling](./API_DOCUMENTATION.md#error-handling)

**Test the API**
→ [API Quick Reference - Testing Commands](./API_QUICK_REFERENCE.md#testing-commands)

---

### By Activity Type

#### Quiz Activities
- [API Docs - Quiz Activities](./API_DOCUMENTATION.md#quiz-activities)
- [WebSocket - Quiz Events](./WEBSOCKET_EVENTS_REFERENCE.md#quiz-events)
- [Quick Ref - Quiz Examples](./API_QUICK_REFERENCE.md#1-create-event-with-quiz)

#### Poll Activities
- [API Docs - Poll Activities](./API_DOCUMENTATION.md#poll-activities)
- [WebSocket - Poll Events](./WEBSOCKET_EVENTS_REFERENCE.md#poll-events)
- [Quick Ref - Poll Examples](./API_QUICK_REFERENCE.md#2-create-event-with-poll)

#### Raffle Activities
- [API Docs - Raffle Activities](./API_DOCUMENTATION.md#raffle-activities)
- [WebSocket - Raffle Events](./WEBSOCKET_EVENTS_REFERENCE.md#raffle-events)
- [Quick Ref - Raffle Examples](./API_QUICK_REFERENCE.md#3-create-event-with-raffle)

---

## 🚀 Getting Started

### 1. Quick Start (5 minutes)

```javascript
// Create an event
const event = await fetch('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My First Event',
    organizerId: 'org-123',
    visibility: 'private'
  })
}).then(r => r.json());

// Add a quiz activity
const quiz = await fetch(`/api/events/${event.eventId}/activities`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Quick Quiz',
    type: 'quiz',
    scoringEnabled: true
  })
}).then(r => r.json());

// Activate it
await fetch(`/api/activities/${quiz.activityId}/activate`, {
  method: 'POST'
});
```

**Next:** [API Quick Reference](./API_QUICK_REFERENCE.md)

---

### 2. Full Tutorial (30 minutes)

Follow the complete workflow in [API Documentation - Examples](./API_DOCUMENTATION.md#examples)

**Topics covered:**
- Creating events
- Adding multiple activities
- Managing questions/options
- Activating activities
- Handling WebSocket events
- Participant interactions

---

### 3. Migration (1-2 hours)

If migrating from the old system, follow [Migration Guide](./MIGRATION_GUIDE.md)

**Steps:**
1. Backup data
2. Run migration script
3. Update API calls
4. Update WebSocket handlers
5. Test thoroughly

---

## 📋 Cheat Sheets

### REST API Endpoints

```
Events:
  POST   /api/events                          Create event
  GET    /api/events/:eventId                 Get event
  PUT    /api/events/:eventId                 Update event
  DELETE /api/events/:eventId                 Delete event

Activities:
  POST   /api/events/:eventId/activities      Create activity
  GET    /api/events/:eventId/activities      List activities
  GET    /api/activities/:activityId          Get activity
  PUT    /api/activities/:activityId          Update activity
  DELETE /api/activities/:activityId          Delete activity
  POST   /api/activities/:activityId/activate Activate
  POST   /api/activities/:activityId/deactivate Deactivate

Quiz:
  POST   /api/activities/:activityId/questions           Add question
  PUT    /api/activities/:activityId/questions/:qId      Update question
  DELETE /api/activities/:activityId/questions/:qId      Delete question

Poll:
  POST   /api/activities/:activityId/configure-poll      Configure
  POST   /api/activities/:activityId/start-poll          Start
  POST   /api/activities/:activityId/vote                Vote
  GET    /api/activities/:activityId/poll-results        Results
  POST   /api/activities/:activityId/end-poll            End

Raffle:
  POST   /api/activities/:activityId/configure-raffle    Configure
  POST   /api/activities/:activityId/start-raffle        Start
  POST   /api/activities/:activityId/enter               Enter
  POST   /api/activities/:activityId/draw-winners        Draw
  POST   /api/activities/:activityId/end-raffle          End
```

### WebSocket Events

```
Activity Lifecycle:
  activity-activated          Activity becomes active
  activity-deactivated        Activity is deactivated
  waiting-for-activity        No activity active

Quiz:
  quiz-started                Quiz begins
  question-revealed           New question
  answer-results-revealed     Answer shown
  leaderboard-updated         Scores change
  quiz-ended                  Quiz completes

Poll:
  poll-started                Poll begins
  poll-vote-submitted         Vote recorded
  poll-results-updated        Results change
  poll-ended                  Poll completes

Raffle:
  raffle-started              Raffle begins
  raffle-entry-confirmed      Entry recorded
  raffle-drawing              Drawing starts
  raffle-winners-announced    Winners revealed
  raffle-ended                Raffle completes
```

---

## 🔧 Development Resources

### Test Scripts

```bash
# Backend tests
npx tsx backend/test-activity-endpoints.ts
npx tsx backend/test-poll-endpoints.ts
npx tsx backend/test-raffle-endpoints.ts
npx tsx backend/test-quiz-activity-endpoints.ts

# Migration
npx tsx scripts/migrate-to-activities.ts
npx tsx scripts/verify-migration.ts
npx tsx scripts/rollback-activity-migration.ts
```

### Example Files

- `backend/test-*.ts` - API endpoint examples
- `frontend/src/components/*.example.tsx` - Component examples
- `scripts/test-*.ts` - Migration test examples

---

## 📞 Support

### Common Issues

**Issue:** Can't connect to WebSocket
→ [WebSocket Events Reference - Troubleshooting](./WEBSOCKET_EVENTS_REFERENCE.md#troubleshooting)

**Issue:** Migration failed
→ [Migration Guide - Rollback Procedure](./MIGRATION_GUIDE.md#rollback-procedure)

**Issue:** API returns 400 error
→ [API Documentation - Error Handling](./API_DOCUMENTATION.md#error-handling)

**Issue:** Activity won't activate
→ Check activity status is 'ready', not 'draft'

---

## 📝 Additional Resources

### Specification Documents

- [Design Document](./.kiro/specs/event-activities-platform/design.md) - System architecture
- [Requirements Document](./.kiro/specs/event-activities-platform/requirements.md) - Feature requirements
- [Tasks Document](./.kiro/specs/event-activities-platform/tasks.md) - Implementation tasks

### Implementation Guides

- [Activity Management Components](./frontend/ACTIVITY_MANAGEMENT_COMPONENTS.md)
- [Activity Hooks Usage](./frontend/src/hooks/ACTIVITY_HOOKS_USAGE.md)
- [Quiz Activity Service](./backend/src/services/QUIZ_ACTIVITY_SERVICE_README.md)

### Migration Resources

- [Activities Migration README](./scripts/ACTIVITIES_MIGRATION_README.md)
- [Data Migration README](./scripts/DATA_MIGRATION_README.md)
- [Verification README](./scripts/VERIFICATION_README.md)
- [Rollback README](./scripts/ROLLBACK_README.md)

---

## 🎓 Learning Path

### Beginner
1. Read [API Quick Reference](./API_QUICK_REFERENCE.md)
2. Try the Quick Start example
3. Explore [API Documentation](./API_DOCUMENTATION.md)

### Intermediate
1. Study [WebSocket Events Reference](./WEBSOCKET_EVENTS_REFERENCE.md)
2. Build a complete event with multiple activities
3. Implement real-time updates

### Advanced
1. Review [Design Document](./.kiro/specs/event-activities-platform/design.md)
2. Understand the architecture
3. Contribute to the platform

---

## 📅 Version History

**Version 2.0** (November 30, 2025)
- Event Activities Platform launch
- Multi-activity support (Quiz, Poll, Raffle)
- Activity activation control
- Migration from quiz-centric model

**Version 1.0** (Previous)
- Quiz-centric model
- Public quiz browsing
- Template system

---

## 🤝 Contributing

To contribute to the documentation:

1. Identify gaps or errors
2. Submit updates via pull request
3. Follow the documentation style guide
4. Include examples where helpful

---

**Last Updated:** November 30, 2025
**Documentation Version:** 2.0
