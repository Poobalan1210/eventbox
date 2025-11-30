# Requirements Document

## Introduction

This document specifies the requirements for improving the organizer experience in the Live Quiz Event System. The enhancements focus on better quiz management workflows, clearer separation between setup and live modes, quiz history management, and privacy controls.

## Glossary

- **Quiz System**: The complete application enabling live quiz events
- **Organizer**: A user who creates and controls quiz events
- **Setup Mode**: The interface state where organizers create and configure quiz questions
- **Live Mode**: The interface state where organizers actively run a quiz session
- **Quiz History**: A list of all quizzes created by an organizer, including past and current quizzes
- **Private Quiz**: A quiz that requires the Game PIN or direct link to join
- **Public Quiz**: A quiz that can be discovered and joined by anyone
- **Quiz Template**: A reusable quiz configuration that can be duplicated for future events
- **Event Dashboard**: The main organizer interface showing all quiz management options

## Requirements

### Requirement 21: Improved Organizer Workflow

**User Story:** As an Organizer, I want a clear separation between setting up my quiz and running it live, so that I can focus on the appropriate tasks at each stage.

#### Acceptance Criteria

1. WHEN an Organizer creates an event, THE Quiz System SHALL display a Setup Mode interface for adding and editing questions
2. WHEN the Organizer is in Setup Mode, THE Quiz System SHALL hide live quiz controls
3. WHEN the Organizer starts the quiz, THE Quiz System SHALL transition to Live Mode interface
4. WHEN the Organizer is in Live Mode, THE Quiz System SHALL hide question editing controls
5. THE Quiz System SHALL display a clear visual indicator showing the current mode

### Requirement 22: Quiz History Management

**User Story:** As an Organizer, I want to see a list of all my quizzes including live and past events, so that I can manage multiple quizzes and access previous content.

#### Acceptance Criteria

1. THE Quiz System SHALL display a dashboard showing all quizzes created by the Organizer
2. THE Quiz System SHALL categorize quizzes as Live, Upcoming, or Past based on their status
3. WHEN displaying quiz history, THE Quiz System SHALL show quiz name, creation date, participant count, and status
4. THE Quiz System SHALL allow the Organizer to navigate to any quiz from the history list
5. THE Quiz System SHALL sort quizzes with Live quizzes first, then Upcoming, then Past by date

### Requirement 23: Quiz Privacy Controls

**User Story:** As an Organizer, I want to control whether my quiz is private or public, so that I can manage who can discover and join my events.

#### Acceptance Criteria

1. WHEN creating an event, THE Quiz System SHALL allow the Organizer to select Private or Public visibility
2. WHEN a quiz is set to Private, THE Quiz System SHALL require the Game PIN or direct link to join
3. WHEN a quiz is set to Public, THE Quiz System SHALL display the quiz in a public quiz browser
4. THE Quiz System SHALL default new quizzes to Private visibility
5. THE Quiz System SHALL allow the Organizer to change quiz visibility before the quiz starts

### Requirement 24: Quiz Template System

**User Story:** As an Organizer, I want to save quizzes as templates and reuse them, so that I can quickly create similar quizzes without recreating all questions.

#### Acceptance Criteria

1. THE Quiz System SHALL allow the Organizer to mark a quiz as a template
2. WHEN creating a new quiz, THE Quiz System SHALL offer an option to create from template
3. WHEN creating from template, THE Quiz System SHALL copy all questions and settings to the new quiz
4. THE Quiz System SHALL allow the Organizer to edit template-based quizzes before starting
5. THE Quiz System SHALL display available templates in the quiz creation interface

### Requirement 25: Enhanced Setup Mode Interface

**User Story:** As an Organizer, I want a streamlined interface for adding questions in Setup Mode, so that quiz creation is faster and more intuitive.

#### Acceptance Criteria

1. WHEN in Setup Mode, THE Quiz System SHALL display the question list and add question form prominently
2. THE Quiz System SHALL show a preview of how questions will appear to participants
3. THE Quiz System SHALL display a "Ready to Start" button when at least one question exists
4. WHEN the Organizer clicks "Ready to Start", THE Quiz System SHALL show a confirmation with participant join information
5. THE Quiz System SHALL allow the Organizer to reorder questions using drag-and-drop

### Requirement 26: Enhanced Live Mode Interface

**User Story:** As an Organizer, I want a focused interface during Live Mode, so that I can concentrate on running the quiz without distractions.

#### Acceptance Criteria

1. WHEN in Live Mode, THE Quiz System SHALL display only quiz control buttons and participant information
2. THE Quiz System SHALL show the current question being displayed to participants
3. THE Quiz System SHALL display real-time participant count and answer submission status
4. THE Quiz System SHALL show a progress indicator for quiz completion
5. WHEN all participants have answered, THE Quiz System SHALL highlight the "Next Question" button

### Requirement 27: Quiz Dashboard Navigation

**User Story:** As an Organizer, I want easy navigation between my quiz dashboard and individual quiz management, so that I can efficiently manage multiple quizzes.

#### Acceptance Criteria

1. THE Quiz System SHALL provide a "My Quizzes" dashboard accessible from all organizer pages
2. WHEN viewing a quiz, THE Quiz System SHALL display a "Back to Dashboard" button
3. THE Quiz System SHALL preserve quiz state when navigating between dashboard and quiz pages
4. THE Quiz System SHALL allow the Organizer to open multiple quizzes in different browser tabs
5. THE Quiz System SHALL display unread notifications for active quizzes on the dashboard

### Requirement 28: Public Quiz Discovery

**User Story:** As a Participant, I want to browse and join public quizzes, so that I can participate in quizzes without needing a specific invitation.

#### Acceptance Criteria

1. THE Quiz System SHALL display a public quiz browser showing all public quizzes
2. WHEN displaying public quizzes, THE Quiz System SHALL show quiz name, topic, participant count, and status
3. THE Quiz System SHALL allow filtering public quizzes by status
4. THE Quiz System SHALL allow searching public quizzes by name or topic
5. WHEN a Participant selects a public quiz, THE Quiz System SHALL navigate to the join page

