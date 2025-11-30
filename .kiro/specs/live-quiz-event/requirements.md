# Requirements Document

## Introduction

This document specifies the requirements for a live quiz event system where organizers can create quiz events and participants can join to answer questions in real-time. The system displays live leaderboards after each question with time-based tie-breaking logic.

## Glossary

- **Quiz System**: The complete application enabling live quiz events
- **Organizer**: A user who creates and controls quiz events
- **Participant**: A user who joins quiz events and answers questions
- **Event**: A quiz session containing multiple questions
- **Question**: A quiz item with multiple answer options and one correct answer
- **Leaderboard**: A ranked display of participants based on score and response time
- **Response Time**: The duration between question display and participant answer submission
- **Total Answer Time**: The cumulative sum of response times for all answered questions by a participant
- **Mobile View**: A responsive user interface optimized for mobile device screens
- **AWS**: Amazon Web Services cloud platform for application hosting
- **Game PIN**: A short numeric code used to join an event as an alternative to links
- **Answer Statistics**: Aggregated data showing the distribution of answers across all participants
- **Podium**: A visual display highlighting the top three participants
- **Streak**: A consecutive sequence of correct answers by a participant
- **Answer Button**: A colored, geometric-shaped interactive element for selecting answers
- **Question Media**: Images or visual content attached to quiz questions

## Requirements

### Requirement 1: Event Creation

**User Story:** As an Organizer, I want to create a new quiz event with a unique name, so that I can host a live quiz session for participants.

#### Acceptance Criteria

1. WHEN the Organizer submits a valid event name, THE Quiz System SHALL create a new event with a unique identifier
2. WHEN the Quiz System creates an event, THE Quiz System SHALL generate a unique join link for that event
3. WHEN the Quiz System creates an event, THE Quiz System SHALL generate a QR code containing the join link
4. THE Quiz System SHALL display the join link and QR code to the Organizer immediately after event creation

### Requirement 2: Participant Joining

**User Story:** As a Participant, I want to join an event using a link or QR code and enter my display name, so that I can participate in the quiz without creating an account.

#### Acceptance Criteria

1. WHEN a Participant accesses a valid event join link, THE Quiz System SHALL display a name entry interface
2. WHEN the Participant submits a display name, THE Quiz System SHALL add the Participant to the event participant list
3. THE Quiz System SHALL display a waiting screen to the Participant until the quiz begins
4. THE Quiz System SHALL NOT require authentication credentials from the Participant
5. WHEN a Participant joins, THE Quiz System SHALL display the Participant in the participant list visible to the Organizer

### Requirement 3: Question Management

**User Story:** As an Organizer, I want to add multiple quiz questions with answer options and optional timers, so that I can prepare the quiz content before starting.

#### Acceptance Criteria

1. THE Quiz System SHALL allow the Organizer to add multiple questions to an event
2. WHEN the Organizer creates a question, THE Quiz System SHALL require question text input
3. WHEN the Organizer creates a question, THE Quiz System SHALL require between 2 and 5 answer options
4. WHEN the Organizer creates a question, THE Quiz System SHALL require exactly one answer option to be marked as correct
5. THE Quiz System SHALL allow the Organizer to optionally set a countdown timer duration for each question

### Requirement 4: Quiz Flow Control

**User Story:** As an Organizer, I want to start the quiz and manually control progression through questions, so that I can pace the quiz appropriately for my audience.

#### Acceptance Criteria

1. WHEN the Organizer initiates quiz start, THE Quiz System SHALL transition all Participants from waiting state to active quiz state
2. WHEN the Organizer advances to a question, THE Quiz System SHALL display that question to all Participants in real-time
3. THE Quiz System SHALL allow the Organizer to manually advance from one question to the next
4. WHERE a question has a countdown timer, THE Quiz System SHALL display the remaining time to all Participants
5. WHERE a question has a countdown timer, WHEN the timer reaches zero, THE Quiz System SHALL prevent new answer submissions for that question

### Requirement 5: Answer Submission

**User Story:** As a Participant, I want to view questions in real-time and submit my answer before the timer ends, so that I can compete in the quiz.

#### Acceptance Criteria

1. WHEN the Organizer displays a question, THE Quiz System SHALL show the question and answer options to all Participants within 2 seconds
2. THE Quiz System SHALL allow each Participant to submit exactly one answer per question
3. WHEN a Participant submits an answer, THE Quiz System SHALL record the response time from question display to submission
4. WHERE a countdown timer is active, WHEN the timer expires, THE Quiz System SHALL reject answer submissions for that question
5. WHEN a Participant submits an answer, THE Quiz System SHALL provide immediate visual confirmation of submission

### Requirement 6: Leaderboard Ranking Logic

**User Story:** As a Participant, I want my ranking determined by total score with tie-breaking rules, so that my position reflects my overall performance.

#### Acceptance Criteria

1. THE Quiz System SHALL calculate each Participant's total score as the sum of points earned across all questions
2. WHEN ranking Participants, THE Quiz System SHALL rank the Participant with the highest total score first
3. WHEN ranking Participants with equal total scores, THE Quiz System SHALL rank the Participant with lower Total Answer Time higher
4. WHEN ranking Participants with equal total scores and equal Total Answer Time, THE Quiz System SHALL rank Participants alphabetically by display name
5. THE Quiz System SHALL update rankings after each question based on cumulative scores

### Requirement 7: Leaderboard Display

**User Story:** As a Participant, I want to see an updated leaderboard after each question, so that I can track my performance and ranking throughout the quiz.

#### Acceptance Criteria

1. WHEN all Participants have submitted answers or the timer expires, THE Quiz System SHALL display the leaderboard to all users
2. THE Quiz System SHALL update the leaderboard display without requiring browser refresh
3. THE Quiz System SHALL display rank, participant name, and points for each Participant on the leaderboard
4. THE Quiz System SHALL order leaderboard entries by rank from highest to lowest
5. WHEN the quiz ends, THE Quiz System SHALL display a final leaderboard showing complete results

### Requirement 8: Real-Time Synchronization

**User Story:** As an Organizer and Participant, I want all quiz state changes to appear in real-time across all connected devices, so that everyone experiences the quiz simultaneously.

#### Acceptance Criteria

1. WHEN the Organizer advances to a new question, THE Quiz System SHALL display the question to all Participants within 2 seconds
2. WHEN a Participant joins the event, THE Quiz System SHALL update the participant list for the Organizer within 2 seconds
3. WHEN the leaderboard updates, THE Quiz System SHALL display the updated leaderboard to all users within 2 seconds
4. THE Quiz System SHALL maintain real-time synchronization without requiring manual page refresh from any user

### Requirement 9: Mobile Compatibility

**User Story:** As a Participant and Organizer, I want to access the quiz system from my mobile device with an optimized interface, so that I can participate or manage quizzes on the go.

#### Acceptance Criteria

1. THE Quiz System SHALL render a responsive interface that adapts to mobile device screen sizes
2. THE Quiz System SHALL display all quiz functionality on mobile devices with screen widths of 320 pixels or greater
3. THE Quiz System SHALL ensure touch targets for buttons and interactive elements are at least 44 pixels in height on mobile devices
4. THE Quiz System SHALL maintain readability of question text and answer options on mobile screens without horizontal scrolling
5. THE Quiz System SHALL display the leaderboard in a mobile-optimized format that shows all required information

### Requirement 10: AWS Deployment

**User Story:** As a System Administrator, I want the quiz system deployed on AWS infrastructure, so that it can scale reliably and be accessible to users globally.

#### Acceptance Criteria

1. THE Quiz System SHALL be deployable to AWS cloud infrastructure
2. THE Quiz System SHALL utilize AWS services that support real-time communication requirements
3. THE Quiz System SHALL be accessible via a public URL when deployed to AWS
4. THE Quiz System SHALL maintain performance requirements when hosted on AWS infrastructure

### Requirement 11: Game PIN Access

**User Story:** As a Participant, I want to join an event using a short numeric PIN code, so that I can quickly enter the quiz without typing long URLs.

#### Acceptance Criteria

1. WHEN the Quiz System creates an event, THE Quiz System SHALL generate a unique 6-digit numeric Game PIN
2. THE Quiz System SHALL display the Game PIN prominently to the Organizer
3. WHEN a Participant enters a valid Game PIN, THE Quiz System SHALL navigate to the corresponding event join page
4. WHEN a Participant enters an invalid Game PIN, THE Quiz System SHALL display an error message indicating the PIN is not found
5. THE Quiz System SHALL ensure Game PINs are unique across all active events

### Requirement 12: Colorful Answer Buttons

**User Story:** As a Participant, I want to see answer options displayed as colorful geometric shapes, so that the quiz interface is engaging and visually distinctive.

#### Acceptance Criteria

1. THE Quiz System SHALL display answer options as colored buttons with geometric shapes
2. WHEN a question has 2 answer options, THE Quiz System SHALL use red triangle and blue diamond shapes
3. WHEN a question has 3 answer options, THE Quiz System SHALL use red triangle, blue diamond, and yellow circle shapes
4. WHEN a question has 4 answer options, THE Quiz System SHALL use red triangle, blue diamond, yellow circle, and green square shapes
5. WHEN a question has 5 answer options, THE Quiz System SHALL add a purple pentagon shape
6. THE Quiz System SHALL maintain consistent color-shape associations across all questions

### Requirement 13: Speed-Based Scoring

**User Story:** As a Participant, I want to earn more points for answering correctly and quickly, so that both accuracy and speed are rewarded.

#### Acceptance Criteria

1. WHEN a Participant submits a correct answer, THE Quiz System SHALL calculate points based on response time
2. THE Quiz System SHALL award maximum points for correct answers submitted in the first 25% of available time
3. THE Quiz System SHALL award progressively fewer points as response time increases
4. THE Quiz System SHALL award a minimum of 500 points for any correct answer regardless of response time
5. THE Quiz System SHALL award a maximum of 1000 points for the fastest correct answers
6. WHEN a Participant submits an incorrect answer, THE Quiz System SHALL award 0 points

### Requirement 14: Live Answer Statistics

**User Story:** As an Organizer and Participant, I want to see how many people selected each answer option after the question ends, so that I can understand the distribution of responses.

#### Acceptance Criteria

1. WHEN a question ends, THE Quiz System SHALL calculate the count of participants who selected each answer option
2. WHEN a question ends, THE Quiz System SHALL calculate the percentage of participants who selected each answer option
3. THE Quiz System SHALL display answer statistics as a bar chart showing the distribution across all options
4. THE Quiz System SHALL highlight the correct answer in the statistics display
5. THE Quiz System SHALL display answer statistics to all users within 2 seconds of question ending

### Requirement 15: Question Result Reveal

**User Story:** As a Participant, I want to see which answer was correct after I submit my response, so that I can learn from the quiz.

#### Acceptance Criteria

1. WHEN a question ends, THE Quiz System SHALL reveal the correct answer to all Participants
2. THE Quiz System SHALL visually highlight the correct answer option with a distinct color or indicator
3. WHERE a Participant submitted an incorrect answer, THE Quiz System SHALL display both their selected answer and the correct answer
4. THE Quiz System SHALL display whether the Participant answered correctly or incorrectly
5. THE Quiz System SHALL show the points earned for that question

### Requirement 16: Podium Display

**User Story:** As a Participant, I want to see a celebratory podium display for the top 3 participants, so that achievements are recognized in an engaging way.

#### Acceptance Criteria

1. WHEN the quiz ends, THE Quiz System SHALL display a podium visualization showing the top 3 participants
2. THE Quiz System SHALL position the first-place participant in the center at the highest level
3. THE Quiz System SHALL position the second-place participant on the left at a medium level
4. THE Quiz System SHALL position the third-place participant on the right at the lowest level
5. THE Quiz System SHALL display participant names and final scores on the podium
6. WHERE fewer than 3 participants exist, THE Quiz System SHALL display only the available participants on the podium

### Requirement 17: Question Media Support

**User Story:** As an Organizer, I want to add images to my quiz questions, so that I can create more engaging and visual quizzes.

#### Acceptance Criteria

1. THE Quiz System SHALL allow the Organizer to optionally upload an image for each question
2. THE Quiz System SHALL support common image formats including JPEG, PNG, and GIF
3. WHEN a question includes an image, THE Quiz System SHALL display the image above the question text
4. THE Quiz System SHALL resize images to fit within the question display area while maintaining aspect ratio
5. THE Quiz System SHALL limit image file size to 5 megabytes maximum

### Requirement 18: Answer Streak Tracking

**User Story:** As a Participant, I want to see my current answer streak, so that I am motivated to maintain consecutive correct answers.

#### Acceptance Criteria

1. THE Quiz System SHALL track the number of consecutive correct answers for each Participant
2. WHEN a Participant answers correctly, THE Quiz System SHALL increment their answer streak by 1
3. WHEN a Participant answers incorrectly or does not answer, THE Quiz System SHALL reset their answer streak to 0
4. THE Quiz System SHALL display the current answer streak to each Participant during the quiz
5. WHEN a Participant achieves a streak of 3 or more, THE Quiz System SHALL display a visual streak indicator

### Requirement 19: Nickname Suggestions

**User Story:** As a Participant, I want to see fun nickname suggestions when joining, so that I can quickly choose an entertaining display name.

#### Acceptance Criteria

1. WHEN a Participant accesses the name entry interface, THE Quiz System SHALL display 3 randomly generated nickname suggestions
2. THE Quiz System SHALL generate nicknames by combining an adjective and a noun
3. THE Quiz System SHALL allow the Participant to regenerate nickname suggestions by clicking a refresh button
4. THE Quiz System SHALL allow the Participant to select a suggested nickname or enter a custom name
5. THE Quiz System SHALL ensure suggested nicknames are appropriate and family-friendly

### Requirement 20: Visual Feedback and Animations

**User Story:** As a Participant and Organizer, I want to see smooth animations and visual feedback throughout the quiz, so that the experience feels polished and engaging.

#### Acceptance Criteria

1. WHEN a Participant selects an answer, THE Quiz System SHALL provide immediate visual feedback with a highlight animation
2. WHEN a question ends, THE Quiz System SHALL animate the transition to the results screen
3. WHEN the leaderboard updates, THE Quiz System SHALL animate rank changes with smooth transitions
4. WHEN a Participant joins, THE Quiz System SHALL display a brief welcome animation
5. THE Quiz System SHALL complete all animations within 500 milliseconds to maintain responsiveness
