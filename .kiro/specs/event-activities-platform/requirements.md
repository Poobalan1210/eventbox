# Requirements Document

## Introduction

This document specifies the requirements for transforming the existing quiz application into a comprehensive event activities platform. The system will enable organizers to create events (e.g., "SCD2025") that contain multiple interactive activities including quizzes, polls, and raffles. Participants will join events rather than individual quizzes, and the organizer controls which activity is currently active. This replaces the previous quiz-centric model and public quiz browsing functionality.

## Glossary

- **Event**: A named container (e.g., "SCD2025") that hosts multiple activities and has a unique join code
- **Activity**: An interactive component within an event (quiz, poll, or raffle)
- **Organizer**: The user who creates and manages events and controls which activities are active
- **Participant**: A user who joins an event using a join code and participates in active activities
- **Active Activity**: The current activity that the organizer has made visible to participants
- **Event Privacy**: A setting determining whether an event is private (invite-only) or public (discoverable)
- **Activity Preset**: Pre-configured content for an activity (quiz questions, poll options, raffle entries) set up before the event goes live
- **Event System**: The backend and frontend components that manage events, activities, and participant sessions

## Requirements

### Requirement 1: Event Creation and Management

**User Story:** As an organizer, I want to create named events that can contain multiple activities, so that I can run comprehensive interactive sessions for my audience.

#### Acceptance Criteria

1. WHEN an organizer creates a new event THEN the Event System SHALL generate a unique event with a name, unique join code, and privacy setting
2. WHEN an event is created THEN the Event System SHALL initialize an empty activity list for that event
3. WHEN an organizer views their event THEN the Event System SHALL display the event name, join code, privacy setting, and all configured activities
4. WHEN an organizer deletes an event THEN the Event System SHALL remove the event and all associated activities and participant data
5. WHEN an organizer updates event details THEN the Event System SHALL persist the changes and maintain the existing join code

### Requirement 2: Activity Type Support

**User Story:** As an organizer, I want to add different types of activities (quiz, poll, raffle) to my event, so that I can provide varied interactive experiences.

#### Acceptance Criteria

1. WHEN an organizer adds a quiz activity THEN the Event System SHALL create a quiz activity with configurable questions and answers
2. WHEN an organizer adds a poll activity THEN the Event System SHALL create a poll activity with configurable questions and voting options
3. WHEN an organizer adds a raffle activity THEN the Event System SHALL create a raffle activity with configurable entry rules and prize information
4. WHEN an organizer views activities THEN the Event System SHALL display all activities grouped by type with their configuration status
5. WHEN an organizer deletes an activity THEN the Event System SHALL remove the activity while preserving other activities in the event

### Requirement 3: Activity Preset Configuration

**User Story:** As an organizer, I want to pre-configure activity content before the event starts, so that I can prepare all materials in advance.

#### Acceptance Criteria

1. WHEN an organizer configures a quiz activity THEN the Event System SHALL allow adding, editing, and removing questions with multiple choice answers
2. WHEN an organizer configures a poll activity THEN the Event System SHALL allow defining poll questions and response options
3. WHEN an organizer configures a raffle activity THEN the Event System SHALL allow setting entry criteria and prize details
4. WHEN an organizer saves activity configuration THEN the Event System SHALL persist the configuration without making it visible to participants
5. WHEN an organizer edits a preset activity THEN the Event System SHALL update the configuration while maintaining activity identity

### Requirement 4: Activity Activation Control

**User Story:** As an organizer, I want to control which activity is currently active for participants, so that I can guide the event flow.

#### Acceptance Criteria

1. WHEN an organizer activates an activity THEN the Event System SHALL make that activity visible to all connected participants
2. WHEN an organizer activates a new activity THEN the Event System SHALL deactivate any previously active activity
3. WHEN no activity is active THEN the Event System SHALL display a waiting state to participants
4. WHEN an organizer deactivates an activity THEN the Event System SHALL return participants to the waiting state
5. WHEN an activity is activated THEN the Event System SHALL notify all connected participants in real-time

### Requirement 5: Participant Event Joining

**User Story:** As a participant, I want to join an event using a join code, so that I can participate in the activities the organizer runs.

#### Acceptance Criteria

1. WHEN a participant enters a valid join code THEN the Event System SHALL connect them to the corresponding event
2. WHEN a participant enters an invalid join code THEN the Event System SHALL reject the connection and display an error message
3. WHEN a participant joins an event THEN the Event System SHALL prompt for a nickname and register them as an active participant
4. WHEN a participant is connected THEN the Event System SHALL maintain their session until they disconnect or the event ends
5. WHEN a participant rejoins with the same nickname THEN the Event System SHALL restore their previous session state

### Requirement 6: Unified Participant Activity View

**User Story:** As a participant, I want to see and interact with whatever activity the organizer is currently running, so that I can participate in the event seamlessly.

#### Acceptance Criteria

1. WHEN no activity is active THEN the Event System SHALL display a waiting screen to the participant
2. WHEN a quiz activity becomes active THEN the Event System SHALL display the quiz interface to the participant
3. WHEN a poll activity becomes active THEN the Event System SHALL display the poll interface to the participant
4. WHEN a raffle activity becomes active THEN the Event System SHALL display the raffle interface to the participant
5. WHEN the active activity changes THEN the Event System SHALL transition the participant view to the new activity without requiring page refresh

### Requirement 7: Event Privacy Controls

**User Story:** As an organizer, I want to set whether my event is private or public, so that I can control event discoverability.

#### Acceptance Criteria

1. WHEN an organizer creates an event THEN the Event System SHALL allow selecting between private and public privacy settings
2. WHEN an event is set to private THEN the Event System SHALL make it accessible only via join code
3. WHEN an event is set to public THEN the Event System SHALL make it accessible via join code
4. WHEN an organizer changes privacy settings THEN the Event System SHALL update the event visibility immediately
5. WHEN an event is private THEN the Event System SHALL not display it in any public listings

### Requirement 8: Migration from Quiz-Centric Model

**User Story:** As a system administrator, I want to migrate existing quiz data to the new event-activities model, so that existing content is preserved.

#### Acceptance Criteria

1. WHEN the migration process runs THEN the Event System SHALL convert each existing quiz into an event containing a single quiz activity
2. WHEN converting quizzes THEN the Event System SHALL preserve all question data, answers, and configuration
3. WHEN converting quizzes THEN the Event System SHALL maintain existing join codes as event join codes
4. WHEN the migration completes THEN the Event System SHALL mark all migrated events with appropriate privacy settings based on previous public/private status
5. WHEN the migration completes THEN the Event System SHALL remove deprecated public quiz browsing functionality

### Requirement 9: Real-time Activity Synchronization

**User Story:** As a participant, I want to see activity updates in real-time, so that I stay synchronized with the organizer's actions.

#### Acceptance Criteria

1. WHEN an organizer starts an activity THEN the Event System SHALL broadcast the activity start to all participants within 500 milliseconds
2. WHEN an organizer advances a quiz question THEN the Event System SHALL update all participant views simultaneously
3. WHEN an organizer reveals poll results THEN the Event System SHALL display results to all participants in real-time
4. WHEN a participant submits a response THEN the Event System SHALL acknowledge receipt within 500 milliseconds
5. WHEN network connectivity is restored THEN the Event System SHALL resynchronize participant state with the current activity

### Requirement 10: Activity-Specific Functionality Preservation

**User Story:** As an organizer, I want quiz activities to retain all existing quiz features, so that functionality is not lost in the migration.

#### Acceptance Criteria

1. WHEN a quiz activity is active THEN the Event System SHALL support all existing quiz features including scoring, leaderboards, and answer reveal
2. WHEN a quiz activity runs THEN the Event System SHALL maintain speed-based scoring and streak tracking
3. WHEN a quiz activity completes THEN the Event System SHALL display final results and podium
4. WHEN a quiz activity is configured THEN the Event System SHALL support question images and multiple choice answers
5. WHEN participants answer quiz questions THEN the Event System SHALL use the existing colorful answer button interface
