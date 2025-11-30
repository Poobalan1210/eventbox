# Organizer UX Improvements - Implementation Tasks

## Overview

This document outlines the implementation tasks for enhancing the organizer experience with improved workflows, quiz management, privacy controls, and template functionality.

---

## Task List

- [x] 1. Backend: Extend Event Model and Database Schema
  - Add new fields to Event model: status, visibility, isTemplate, lastModified, participantCount, topic, description
  - Update DynamoDB table schema with new attributes
  - Create database migration script for existing events
  - Add indexes for efficient querying by organizerId and status
  - _Requirements: 21.1, 22.1, 23.1, 24.1_

- [ ]* 1.1 Write property test for event model validation
  - **Property 1: Mode Transition Validity**
  - **Validates: Requirements 21.3**

- [x] 2. Backend: Implement Template Service
  - Create Template model and repository
  - Implement createTemplate endpoint (POST /api/templates)
  - Implement getTemplates endpoint (GET /api/templates/organizer/:organizerId)
  - Implement createFromTemplate endpoint (POST /api/events/from-template)
  - Implement getPublicTemplates endpoint (GET /api/templates/public)
  - Add template validation logic
  - _Requirements: 24.1, 24.2, 24.3, 24.5_

- [ ]* 2.1 Write property test for template creation
  - **Property 4: Template Creation Preservation**
  - **Validates: Requirements 24.3**

- [x] 3. Backend: Implement Quiz History and Status Management
  - Create getOrganizerQuizzes endpoint (GET /api/events/organizer/:organizerId)
  - Implement updateEventStatus endpoint (PATCH /api/events/:eventId/status)
  - Implement updateEventVisibility endpoint (PATCH /api/events/:eventId/visibility)
  - Add quiz categorization logic (live, upcoming, past)
  - Implement sorting by status and date
  - _Requirements: 22.1, 22.2, 22.5, 23.1, 23.5_

- [ ]* 3.1 Write property test for quiz categorization
  - **Property 2: Quiz Categorization Consistency**
  - **Validates: Requirements 22.2**

- [ ]* 3.2 Write property test for dashboard sorting
  - **Property 6: Dashboard Sorting Order**
  - **Validates: Requirements 22.5**

- [x] 4. Backend: Implement Public Quiz Discovery
  - Create getPublicQuizzes endpoint (GET /api/events/public)
  - Add filtering by status (live, upcoming)
  - Implement search functionality by name and topic
  - Add pagination support
  - _Requirements: 28.1, 28.2, 28.3, 28.4_

- [ ]* 4.1 Write property test for privacy enforcement
  - **Property 3: Privacy Enforcement**
  - **Validates: Requirements 23.2**

- [ ]* 4.2 Write property test for public quiz discoverability
  - **Property 7: Public Quiz Discoverability**
  - **Validates: Requirements 28.1**

- [x] 5. Backend: Add Access Control and Security
  - Implement organizer authorization middleware
  - Add privacy check logic for quiz access
  - Implement quiz validation before mode transitions
  - Add error handling for unauthorized access
  - _Requirements: 23.2, 23.3_

- [x] 6. Frontend: Create OrganizerDashboard Component
  - Create OrganizerDashboard component with card-based layout
  - Implement quiz categorization UI (Live, Upcoming, Past tabs)
  - Add search and filter functionality
  - Create QuizCard component for displaying quiz information
  - Add quick action buttons (Create New, Create from Template)
  - Implement real-time updates for live quizzes
  - Add loading and error states
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 27.1_

- [ ]* 6.1 Write unit tests for dashboard filtering and search
  - Test quiz categorization logic
  - Test search functionality
  - Test filter combinations

- [x] 7. Frontend: Implement SetupMode Component
  - Create SetupMode component with distinct UI
  - Implement question list with drag-and-drop reordering
  - Add question form for creating/editing questions
  - Create preview mode for participant view
  - Add "Ready to Start" button with validation
  - Implement save as draft functionality
  - Hide live control buttons in setup mode
  - _Requirements: 21.1, 21.2, 25.1, 25.2, 25.3, 25.4, 25.5_

- [ ]* 7.1 Write property test for mode-specific UI visibility
  - **Property 5: Mode-Specific UI Visibility**
  - **Validates: Requirements 21.2, 21.4**

- [ ]* 7.2 Write unit tests for setup mode validation
  - Test "Ready to Start" validation
  - Test question reordering
  - Test draft saving

- [x] 8. Frontend: Implement LiveMode Component
  - Create LiveMode component with focused interface
  - Display current question and participant information
  - Show real-time answer submission status
  - Add progress indicator for quiz completion
  - Implement quiz control buttons (Next, Show Results, End)
  - Hide question editing controls in live mode
  - Highlight "Next Question" when all answered
  - _Requirements: 21.3, 21.4, 26.1, 26.2, 26.3, 26.4, 26.5_

- [ ]* 8.1 Write unit tests for live mode controls
  - Test progress calculation
  - Test answer submission tracking
  - Test control button states

- [x] 9. Frontend: Create Mode Transition Logic
  - Implement state machine for quiz modes (draft → setup → live → completed)
  - Add mode transition validation
  - Create confirmation dialog for starting quiz
  - Display Game PIN and join information on quiz start
  - Add visual mode indicators
  - Handle mode transition errors with rollback
  - _Requirements: 21.1, 21.3, 21.5, 25.4_

- [ ]* 9.1 Write integration test for mode transitions
  - Test complete workflow: draft → setup → live → completed
  - Test validation prevents invalid transitions
  - Test error handling and rollback

- [x] 10. Frontend: Implement PrivacySelector Component
  - Create PrivacySelector component with toggle/radio interface
  - Add clear labels and icons (lock for private, globe for public)
  - Implement onChange handler
  - Add disabled state for live quizzes
  - Display privacy setting in quiz creation and editing
  - _Requirements: 23.1, 23.4, 23.5_

- [ ]* 10.1 Write unit tests for privacy selector
  - Test value changes
  - Test disabled state
  - Test visual indicators

- [x] 11. Frontend: Implement TemplateSelector Component
  - Create TemplateSelector component with grid layout
  - Display template cards with metadata (name, description, question count)
  - Add template preview on hover
  - Implement "Start from Blank" option
  - Add template selection handler
  - Fetch and display organizer's templates
  - _Requirements: 24.2, 24.4, 24.5_

- [ ]* 11.1 Write unit tests for template selector
  - Test template selection
  - Test blank quiz creation
  - Test template preview

- [x] 12. Frontend: Create Template Management Features
  - Add "Save as Template" button in quiz editing
  - Create template creation dialog (name, description, public/private)
  - Implement template creation API call
  - Add success/error notifications
  - Update UI after template creation
  - _Requirements: 24.1, 24.2_

- [ ]* 12.1 Write integration test for template workflow
  - Test creating quiz from template
  - Test saving quiz as template
  - Test template reusability

- [x] 13. Frontend: Implement Dashboard Navigation
  - Add "My Quizzes" link in navigation header
  - Create "Back to Dashboard" button in quiz views
  - Implement navigation state preservation
  - Add support for multiple quiz tabs
  - Display notifications badge for active quizzes
  - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5_

- [ ]* 13.1 Write property test for state preservation
  - **Property 8: Quiz State Preservation**
  - **Validates: Requirements 27.3**

- [x] 14. Frontend: Create Public Quiz Browser
  - Create PublicQuizBrowser component
  - Display public quizzes in grid layout
  - Add status filter (All, Live, Upcoming)
  - Implement search by name and topic
  - Show quiz metadata (name, topic, participants, status)
  - Add "Join Quiz" button for each quiz
  - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5_

- [ ]* 14.1 Write unit tests for public quiz browser
  - Test filtering by status
  - Test search functionality
  - Test quiz selection

- [x] 15. Frontend: Update Existing Components for New Workflow
  - Update CreateEvent page to use SetupMode component
  - Update OrganizerDashboard page to use new dashboard component
  - Modify quiz start flow to transition to LiveMode
  - Update navigation to include dashboard link
  - Add privacy selector to event creation
  - _Requirements: 21.1, 21.3, 22.1, 23.1_

- [x] 16. Frontend: Implement Real-time Dashboard Updates
  - Add WebSocket listener for quiz status changes
  - Update dashboard when quiz goes live
  - Update participant counts in real-time
  - Add visual indicators for live quiz activity
  - Implement notification system for quiz events
  - _Requirements: 22.1, 27.5_

- [ ]* 16.1 Write integration test for real-time updates
  - Test WebSocket connection
  - Test status change updates
  - Test participant count updates

- [x] 17. Backend: Implement Data Migration
  - Create migration script for existing events
  - Set default values for new fields (status, visibility, etc.)
  - Calculate participant counts from existing data
  - Verify data integrity after migration
  - Create rollback script for safety
  - _Requirements: All (backward compatibility)_

- [x] 18. Testing: Integration Tests for Complete Workflows
  - Test complete organizer workflow: create → setup → live → complete
  - Test template workflow: create → save as template → create from template
  - Test privacy workflow: create private quiz → verify access control
  - Test dashboard workflow: view dashboard → select quiz → edit → return
  - Test public quiz workflow: create public quiz → search → join
  - _Requirements: All_

- [x] 19. Testing: Performance and Load Testing
  - Test dashboard loading with 100+ quizzes
  - Test search performance with large datasets
  - Test real-time updates with multiple concurrent quizzes
  - Test template loading and creation performance
  - Verify performance targets are met
  - _Requirements: All (performance)_

- [x] 20. Documentation and Deployment
  - Update API documentation with new endpoints
  - Create user guide for new organizer features
  - Document migration procedures
  - Update deployment scripts
  - Create feature announcement for users
  - _Requirements: All_

---

## Task Dependencies

### Critical Path

```
Task 1 (DB Schema) → Task 3 (History API) → Task 6 (Dashboard UI) → Task 9 (Mode Transitions) → Task 15 (Integration)
```

### Parallel Development Tracks

**Track 1: Backend Foundation (Week 1)**
- Task 1: Database schema updates
- Task 2: Template service
- Task 3: History and status management
- Task 4: Public quiz discovery
- Task 5: Access control

**Track 2: Frontend Components (Week 2-3)**
- Task 6: Dashboard component
- Task 7: Setup mode component
- Task 8: Live mode component
- Task 10: Privacy selector
- Task 11: Template selector

**Track 3: Integration (Week 3-4)**
- Task 9: Mode transitions
- Task 12: Template management
- Task 13: Navigation
- Task 14: Public quiz browser
- Task 15: Component updates
- Task 16: Real-time updates

**Track 4: Testing & Deployment (Week 4-5)**
- Task 17: Data migration
- Task 18: Integration tests
- Task 19: Performance testing
- Task 20: Documentation

---

## Estimated Timeline

- **Week 1**: Backend foundation (Tasks 1-5)
- **Week 2**: Core frontend components (Tasks 6-8)
- **Week 3**: Additional features and integration (Tasks 9-16)
- **Week 4**: Testing and refinement (Tasks 17-19)
- **Week 5**: Documentation and deployment (Task 20)

**Total Estimated Time**: 4-5 weeks

---

## Testing Summary

### Property-Based Tests (7 properties)
1. Mode Transition Validity (Task 1.1)
2. Quiz Categorization Consistency (Task 3.1)
3. Privacy Enforcement (Task 4.1)
4. Template Creation Preservation (Task 2.1)
5. Mode-Specific UI Visibility (Task 7.1)
6. Dashboard Sorting Order (Task 3.2)
7. Public Quiz Discoverability (Task 4.2)
8. Quiz State Preservation (Task 13.1)

### Unit Tests
- Dashboard filtering and search (Task 6.1)
- Setup mode validation (Task 7.2)
- Live mode controls (Task 8.1)
- Privacy selector (Task 10.1)
- Template selector (Task 11.1)
- Public quiz browser (Task 14.1)

### Integration Tests
- Mode transitions (Task 9.1)
- Template workflow (Task 12.1)
- Real-time updates (Task 16.1)
- Complete workflows (Task 18)

---

## Success Criteria

- [ ] All 8 correctness properties pass property-based tests (100+ iterations each)
- [ ] All unit tests pass with >90% code coverage
- [ ] All integration tests pass
- [ ] Dashboard loads in <2 seconds with 100 quizzes
- [ ] Mode transitions complete in <500ms
- [ ] Search results appear in <300ms
- [ ] No breaking changes to existing functionality
- [ ] Migration completes successfully for all existing events
- [ ] User documentation is complete and clear

---

## Notes

- Optional tasks (marked with *) focus on testing and can be adjusted based on timeline
- Property-based tests use fast-check library with 100 iterations minimum
- Each property test must reference its corresponding correctness property from the design document
- Integration tests should cover complete user workflows
- Performance testing should validate all targets from design document
