# Implementation Plan

## Phase 1: Foundation - Data Models and Repositories

- [x] 1. Create Activity data models and type definitions
  - Define ActivityType, ActivityStatus, BaseActivity, QuizActivity, PollActivity, RaffleActivity types in backend/src/types/models.ts
  - Define PollOption, PollVote, RaffleEntry types
  - Update Event interface to include activeActivityId field
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [ ]* 1.1 Write property test for activity creation
  - **Property 5: Activity creation succeeds for all types**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 2. Implement ActivityRepository
  - Create backend/src/db/repositories/ActivityRepository.ts
  - Implement create, findById, findByEventId, update, delete, setStatus methods
  - Add DynamoDB operations for Activities table with GSI support
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ]* 2.1 Write property test for activity updates
  - **Property 7: Activity updates preserve identity**
  - **Validates: Requirements 3.5**

- [ ]* 2.2 Write property test for activity deletion
  - **Property 6: Activity deletion is selective**
  - **Validates: Requirements 2.5**

- [x] 3. Implement PollRepository
  - Create backend/src/db/repositories/PollRepository.ts
  - Implement createVote, getVotes, getVoteByParticipant, getResults methods
  - Add DynamoDB operations for PollVotes table with GSI
  - _Requirements: 3.2_

- [x] 4. Implement RaffleRepository
  - Create backend/src/db/repositories/RaffleRepository.ts
  - Implement createEntry, getEntries, getEntryByParticipant, setWinners methods
  - Add DynamoDB operations for RaffleEntries table with GSI
  - _Requirements: 3.3_

- [x] 5. Update EventRepository to support activities
  - Add setActiveActivity, getActiveActivity, listActivities methods to EventRepository
  - Update Event model operations to include activeActivityId field
  - Implement cascade delete for activities when event is deleted
  - _Requirements: 1.4, 4.1, 4.2_

- [ ]* 5.1 Write property test for event deletion cascade
  - **Property 3: Event deletion cascades completely**
  - **Validates: Requirements 1.4**

- [ ]* 5.2 Write property test for event updates
  - **Property 2: Event updates preserve identity**
  - **Validates: Requirements 1.5**

## Phase 2: Service Layer - Activity Management

- [x] 6. Implement ActivityService
  - Create backend/src/services/activityService.ts
  - Implement createActivity, getActivity, updateActivity, deleteActivity methods
  - Implement activateActivity, deactivateActivity methods
  - Add type-specific getters: getQuizActivity, getPollActivity, getRaffleActivity
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 4.1, 4.2_

- [ ]* 6.1 Write property test for activity activation mutual exclusion
  - **Property 9: Activity activation is mutually exclusive**
  - **Validates: Requirements 4.2**

- [ ]* 6.2 Write property test for activity deactivation
  - **Property 10: Activity deactivation returns to waiting state**
  - **Validates: Requirements 4.4**

- [x] 7. Refactor quiz logic into QuizActivityService
  - Create backend/src/services/quizActivityService.ts
  - Move quiz-specific logic from existing services
  - Implement addQuestion, updateQuestion, deleteQuestion for activities
  - Implement startQuiz, nextQuestion, endQuiz, submitAnswer for activities
  - Update to work with activityId instead of eventId
  - _Requirements: 3.1, 10.1, 10.2, 10.3, 10.4_

- [ ]* 7.1 Write property test for quiz feature preservation
  - **Property 21: Quiz activities preserve all features**
  - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [x] 8. Implement PollActivityService
  - Create backend/src/services/pollActivityService.ts
  - Implement configurePoll, startPoll, submitVote, getResults, endPoll methods
  - Add vote validation and duplicate vote prevention
  - Implement real-time results calculation
  - _Requirements: 3.2_

- [x] 9. Implement RaffleActivityService
  - Create backend/src/services/raffleActivityService.ts
  - Implement configureRaffle, startRaffle, enterRaffle, drawWinners, endRaffle methods
  - Add random winner selection algorithm
  - Implement entry validation and duplicate prevention
  - _Requirements: 3.3_

- [x] 10. Update EventService for activity integration
  - Add setActiveActivity, getActiveActivity, listActivities methods
  - Update createEvent to initialize empty activity list
  - Update deleteEvent to cascade delete activities
  - Update getEvent to include activities list
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2_

- [ ]* 10.1 Write property test for event creation
  - **Property 1: Event creation produces unique, valid events**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 10.2 Write property test for event retrieval
  - **Property 4: Event retrieval is complete**
  - **Validates: Requirements 1.3**

## Phase 3: API Layer - REST Endpoints

- [x] 11. Create activity API endpoints
  - Add POST /api/events/:eventId/activities - create activity
  - Add GET /api/events/:eventId/activities - list activities
  - Add GET /api/activities/:activityId - get activity details
  - Add PUT /api/activities/:activityId - update activity
  - Add DELETE /api/activities/:activityId - delete activity
  - Add POST /api/activities/:activityId/activate - activate activity
  - Add POST /api/activities/:activityId/deactivate - deactivate activity
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.4_

- [x] 12. Create quiz activity API endpoints
  - Add POST /api/activities/:activityId/questions - add question
  - Add PUT /api/activities/:activityId/questions/:questionId - update question
  - Add DELETE /api/activities/:activityId/questions/:questionId - delete question
  - Update existing quiz endpoints to work with activities
  - _Requirements: 3.1_

- [x] 13. Create poll activity API endpoints
  - Add POST /api/activities/:activityId/configure-poll - configure poll
  - Add POST /api/activities/:activityId/start-poll - start poll
  - Add POST /api/activities/:activityId/vote - submit vote
  - Add GET /api/activities/:activityId/poll-results - get results
  - Add POST /api/activities/:activityId/end-poll - end poll
  - _Requirements: 3.2_

- [x] 14. Create raffle activity API endpoints
  - Add POST /api/activities/:activityId/configure-raffle - configure raffle
  - Add POST /api/activities/:activityId/start-raffle - start raffle
  - Add POST /api/activities/:activityId/enter - enter raffle
  - Add POST /api/activities/:activityId/draw-winners - draw winners
  - Add POST /api/activities/:activityId/end-raffle - end raffle
  - _Requirements: 3.3_

- [x] 15. Update API type definitions
  - Add activity-related request/response types to backend/src/types/api.ts
  - Add CreateActivityRequest, UpdateActivityRequest, ActivityResponse types
  - Add poll and raffle specific request/response types
  - Update existing types to reference activities
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

## Phase 4: WebSocket Layer - Real-time Communication

- [x] 16. Update WebSocket event types
  - Add activity lifecycle events to backend/src/types/websocket.ts
  - Add 'activity-activated', 'activity-deactivated', 'activity-updated' events
  - Add poll events: 'poll-started', 'poll-vote-submitted', 'poll-results-updated', 'poll-ended'
  - Add raffle events: 'raffle-started', 'raffle-entry-confirmed', 'raffle-drawing', 'raffle-winners-announced', 'raffle-ended'
  - Add 'waiting-for-activity' event
  - _Requirements: 4.1, 4.4, 6.1_

- [x] 17. Implement activity WebSocket handlers
  - Update backend/src/services/websocketService.ts
  - Add handlers for activity activation/deactivation
  - Implement broadcast logic for activity state changes
  - Add participant waiting state handling
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 6.1_

- [ ]* 17.1 Write property test for activity visibility control
  - **Property 8: Activity configuration remains hidden until activation**
  - **Validates: Requirements 3.4**

- [x] 18. Implement poll WebSocket handlers
  - Add poll lifecycle event handlers
  - Implement real-time vote broadcasting
  - Add live results update broadcasting
  - _Requirements: 3.2_

- [x] 19. Implement raffle WebSocket handlers
  - Add raffle lifecycle event handlers
  - Implement entry confirmation broadcasting
  - Add winner announcement broadcasting with animation triggers
  - _Requirements: 3.3_

- [x] 20. Update quiz WebSocket handlers for activities
  - Refactor existing quiz handlers to work with activityId
  - Ensure quiz events are scoped to activities not events
  - Maintain all existing quiz WebSocket functionality
  - _Requirements: 10.1_

## Phase 5: Frontend - Organizer Interface

- [x] 21. Create Activity management components
  - Create frontend/src/components/ActivityList.tsx - display all activities
  - Create frontend/src/components/ActivityCard.tsx - individual activity display
  - Create frontend/src/components/AddActivityDialog.tsx - activity type selection
  - Add activity CRUD operations to organizer dashboard
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 22. Create Quiz activity configuration component
  - Create frontend/src/components/QuizActivityConfig.tsx
  - Reuse existing QuestionForm and QuestionList components
  - Update to work with activityId instead of eventId
  - Add quiz-specific settings (scoring, speed bonus, streaks)
  - _Requirements: 3.1, 10.4_

- [x] 23. Create Poll activity configuration component
  - Create frontend/src/components/PollActivityConfig.tsx
  - Add poll question and options editor
  - Add settings for multiple votes and live results
  - Implement poll preview
  - _Requirements: 3.2_

- [x] 24. Create Raffle activity configuration component
  - Create frontend/src/components/RaffleActivityConfig.tsx
  - Add prize description editor
  - Add entry method selector (automatic/manual)
  - Add winner count configuration
  - _Requirements: 3.3_

- [x] 25. Create Activity control panel
  - Create frontend/src/components/ActivityControlPanel.tsx
  - Add activate/deactivate buttons for each activity
  - Show currently active activity indicator
  - Add activity status badges (draft/ready/active/completed)
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 26. Update OrganizerDashboard for activities
  - Update frontend/src/pages/OrganizerDashboard.tsx
  - Replace quiz-centric view with event-centric view
  - Integrate ActivityList and ActivityControlPanel
  - Add activity creation workflow
  - _Requirements: 1.3, 2.4_

## Phase 6: Frontend - Participant Interface

- [x] 27. Create unified participant activity view
  - Create frontend/src/components/ParticipantActivityView.tsx
  - Implement dynamic rendering based on active activity type
  - Add waiting state component
  - Handle activity transitions without page refresh
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 27.1 Write property test for activity type interface rendering
  - **Property 15: Activity type determines interface**
  - **Validates: Requirements 6.2, 6.3, 6.4**

- [ ]* 27.2 Write property test for activity transitions
  - **Property 16: Activity transitions update view dynamically**
  - **Validates: Requirements 6.5**

- [x] 28. Create Poll participant interface
  - Create frontend/src/components/PollParticipantView.tsx
  - Add poll question display
  - Add voting interface with option selection
  - Add live results display (if enabled)
  - Add vote confirmation feedback
  - _Requirements: 6.3_

- [x] 29. Create Raffle participant interface
  - Create frontend/src/components/RaffleParticipantView.tsx
  - Add prize description display
  - Add entry button/confirmation
  - Add winner announcement display with animations
  - Add entry status indicator
  - _Requirements: 6.4_

- [x] 30. Update Quiz participant interface for activities
  - Update existing quiz components to work with activities
  - Ensure QuestionDisplay, ColorfulAnswerButton, Leaderboard work with activityId
  - Maintain all existing quiz participant features
  - _Requirements: 6.2, 10.5_

- [x] 31. Create waiting state component
  - Create frontend/src/components/WaitingForActivity.tsx
  - Add engaging waiting animation
  - Display event name and participant count
  - Show "Waiting for organizer to start an activity" message
  - _Requirements: 4.3, 6.1_

- [x] 32. Update ParticipantView for activity system
  - Update frontend/src/pages/ParticipantView.tsx
  - Integrate ParticipantActivityView
  - Handle activity-activated WebSocket events
  - Implement smooth transitions between activities
  - _Requirements: 6.5_

## Phase 7: Frontend - WebSocket Integration

- [x] 33. Update WebSocket context for activities
  - Update frontend/src/contexts/WebSocketContext.tsx
  - Add activity lifecycle event listeners
  - Add poll event listeners
  - Add raffle event listeners
  - Add waiting state event listener
  - _Requirements: 4.1, 4.4, 6.5_

- [x] 34. Create activity-specific WebSocket hooks
  - Create frontend/src/hooks/useActivityState.ts - track active activity
  - Create frontend/src/hooks/usePollEvents.ts - handle poll events
  - Create frontend/src/hooks/useRaffleEvents.ts - handle raffle events
  - Update existing quiz hooks to work with activities
  - _Requirements: 4.1, 6.5_

## Phase 8: Data Migration

- [x] 35. Create database migration script
  - Create scripts/migrate-to-activities.ts
  - Add activeActivityId column to Events table
  - Create Activities, PollVotes, RaffleEntries tables
  - Create GSI for event-activity lookups
  - _Requirements: 8.1_

- [x] 36. Implement data migration logic
  - For each existing event, create a QuizActivity
  - Migrate all questions to reference activityId
  - Set activity status based on event status
  - Preserve all existing data (questions, answers, participants)
  - Maintain gamePins and privacy settings
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 36.1 Write property test for migration data preservation
  - **Property 19: Migration preserves quiz data completely**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 37. Create migration verification script
  - Create scripts/verify-migration.ts
  - Verify all events have corresponding activities
  - Verify all questions reference valid activityIds
  - Verify no data loss occurred
  - Generate migration report
  - _Requirements: 8.2_

- [x] 38. Create rollback script
  - Create scripts/rollback-activity-migration.ts
  - Implement reverse migration if needed
  - Restore original event structure
  - Preserve data integrity during rollback
  - _Requirements: 8.1_

## Phase 9: Cleanup and Deprecation

- [x] 39. Remove public quiz browsing
  - Remove GET /api/events/public endpoint
  - Remove frontend/src/pages/PublicQuizzes.tsx
  - Remove frontend/src/components/PublicQuizBrowser.tsx
  - Update navigation to remove public quiz links
  - _Requirements: 8.5_

- [x] 40. Remove template system
  - Remove template-related API endpoints
  - Remove TemplateRepository
  - Remove template-related frontend components
  - Update documentation to reflect activity presets
  - _Requirements: 8.5_

- [x] 41. Update API documentation
  - Document all new activity endpoints
  - Document WebSocket events for activities
  - Add migration guide for API consumers
  - Update examples to use activity-based approach
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

## Phase 10: Testing and Validation

- [x] 42. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 43. Write integration tests for activity workflows
  - Test complete organizer workflow: create event, add activities, activate quiz
  - Test complete participant workflow: join event, wait, participate in quiz/poll/raffle
  - Test activity switching: activate quiz, complete, activate poll, complete, activate raffle
  - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.5_

- [ ]* 44. Write property test for join code validation
  - **Property 11: Valid join codes connect to events**
  - **Property 12: Invalid join codes are rejected**
  - **Validates: Requirements 5.1, 5.2**

- [ ]* 45. Write property test for participant registration
  - **Property 13: Participant registration is complete**
  - **Validates: Requirements 5.3**

- [ ]* 46. Write property test for session restoration
  - **Property 14: Session restoration preserves state**
  - **Validates: Requirements 5.5**

- [ ]* 47. Write property test for reconnection sync
  - **Property 20: Reconnection synchronizes state**
  - **Validates: Requirements 9.5**

- [ ]* 48. Write property test for privacy controls
  - **Property 17: Privacy settings are configurable and enforced**
  - **Property 18: Private events are access-controlled**
  - **Validates: Requirements 7.1, 7.2, 7.4**

- [ ]* 49. Write performance tests
  - Test 100+ concurrent participants
  - Test rapid activity switching
  - Test WebSocket message delivery times
  - Test database query performance
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 50. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
