# Implementation Plan

- [x] 1. Initialize project structure and dependencies
  - Create monorepo structure with frontend and backend directories
  - Initialize React TypeScript project with Vite for frontend
  - Initialize Node.js TypeScript project for backend
  - Install core dependencies: React, Express, Socket.io, AWS SDK, Tailwind CSS
  - Configure TypeScript for both frontend and backend
  - Set up ESLint and Prettier configurations
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Set up backend data models and types
  - Create TypeScript interfaces for Event, Question, AnswerOption, Participant, Answer
  - Create TypeScript interfaces for WebSocket event payloads
  - Create TypeScript interfaces for API request/response types
  - Implement data validation schemas using Zod or similar library
  - _Requirements: 1.1, 2.1, 3.2, 5.1, 6.1_

- [x] 3. Implement DynamoDB data access layer
  - Create DynamoDB client configuration with AWS SDK v3
  - Implement EventRepository with methods: createEvent, getEvent, updateEventStatus
  - Implement QuestionRepository with methods: addQuestion, getQuestions, updateQuestion, deleteQuestion
  - Implement ParticipantRepository with methods: addParticipant, getParticipants, updateParticipantScore
  - Implement AnswerRepository with methods: saveAnswer, getAnswersByParticipant, getAnswersByQuestion
  - _Requirements: 1.1, 2.1, 3.1, 5.3, 6.1_

- [x] 4. Build REST API endpoints for event management
  - Create Express server with TypeScript
  - Implement POST /api/events endpoint to create new event
  - Generate unique event ID and join link in event creation
  - Integrate QR code generation library and return QR code data URL
  - Implement GET /api/events/:eventId endpoint to retrieve event details
  - Implement POST /api/events/:eventId/questions to add questions
  - Implement PUT /api/events/:eventId/questions/:questionId to update questions
  - Implement DELETE /api/events/:eventId/questions/:questionId to delete questions
  - Add input validation middleware for all endpoints
  - Add error handling middleware
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4_

- [x] 5. Implement WebSocket server for real-time communication
  - Set up Socket.io server integrated with Express
  - Implement connection handling and room management by eventId
  - Implement 'join-event' handler to add participants and broadcast updates
  - Implement 'start-quiz' handler to transition event to active state
  - Implement 'next-question' handler to broadcast question to all participants
  - Implement timer logic to emit 'timer-tick' events and 'question-ended' when timer expires
  - Implement 'submit-answer' handler to record answers with response time
  - Implement 'end-quiz' handler to finalize quiz and broadcast final leaderboard
  - Add WebSocket error handling and disconnection cleanup
  - _Requirements: 2.2, 4.1, 4.2, 4.3, 5.1, 5.3, 8.1, 8.2, 8.3, 8.4_

- [x] 6. Create scoring engine
  - Implement function to calculate if answer is correct and award points
  - Implement function to calculate total answer time for each participant
  - Implement leaderboard ranking algorithm with score, time, and name sorting
  - Create function to generate leaderboard after each question
  - Integrate scoring engine with 'submit-answer' and 'question-ended' handlers
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.4_

- [x] 7. Build frontend routing and layout structure
  - Set up React Router with routes for organizer and participant views
  - Create route: /create for event creation
  - Create route: /organizer/:eventId for organizer dashboard
  - Create route: /join/:eventId for participant join and quiz interface
  - Create responsive layout component with mobile-first approach
  - Implement navigation component with mobile hamburger menu
  - _Requirements: 9.1, 9.2_

- [x] 8. Implement WebSocket client connection manager
  - Create React context for WebSocket connection management
  - Implement connection initialization with Socket.io client
  - Implement automatic reconnection logic with exponential backoff
  - Create hooks for emitting events and subscribing to server events
  - Add connection status indicator component
  - Handle connection errors and display user-friendly messages
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 9. Build event creation interface for organizers
  - Create EventCreationForm component with event name input
  - Implement form submission to POST /api/events endpoint
  - Display generated join link with copy-to-clipboard functionality
  - Display QR code image for event joining
  - Add mobile-responsive styling with Tailwind CSS
  - Navigate to organizer dashboard after event creation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1, 9.3, 9.4_

- [x] 10. Build question management interface for organizers
  - Create QuestionForm component for adding/editing questions
  - Implement question text input field
  - Implement dynamic answer options (2-5 options) with add/remove buttons
  - Implement radio button selection for correct answer
  - Implement optional timer input field
  - Implement form submission to POST /api/events/:eventId/questions
  - Create QuestionList component displaying all questions with edit/delete actions
  - Implement question update via PUT endpoint
  - Implement question deletion via DELETE endpoint
  - Add mobile-responsive form layout
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.3, 9.4_

- [x] 11. Build organizer quiz control dashboard
  - Create OrganizerDashboard component
  - Display participant list with real-time updates via 'participants-updated' event
  - Implement "Start Quiz" button that emits 'start-quiz' event
  - Implement "Next Question" button that emits 'next-question' event
  - Display current question number and total questions
  - Implement "End Quiz" button that emits 'end-quiz' event
  - Show leaderboard after each question
  - Add mobile-responsive dashboard layout
  - _Requirements: 2.5, 4.1, 4.2, 4.3, 7.5, 8.2, 9.1, 9.4_

- [x] 12. Build participant join interface
  - Create ParticipantJoin component for name entry
  - Implement name input form with validation (non-empty, max length)
  - Emit 'join-event' with eventId and participant name on form submission
  - Listen for 'participant-joined' confirmation event
  - Display waiting screen after successful join
  - Show "Waiting for quiz to start" message
  - Add mobile-responsive join form
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.3, 9.4_

- [x] 13. Build question display and answer submission interface
  - Create QuestionDisplay component
  - Listen for 'quiz-started' event to transition from waiting screen
  - Listen for 'question-displayed' event and render question text and options
  - Record question display timestamp for response time calculation
  - Implement answer option selection with visual feedback
  - Implement countdown timer display that updates via 'timer-tick' events
  - Implement "Submit Answer" button that emits 'submit-answer' with response time
  - Calculate response time as difference between submission and question display time
  - Disable answer submission after participant submits or timer expires
  - Show visual confirmation after answer submission
  - Add mobile-responsive question layout with vertical answer stacking
  - Ensure touch targets are minimum 44px height on mobile
  - _Requirements: 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.3, 9.4_

- [x] 14. Build leaderboard display component
  - Create Leaderboard component accepting participants array prop
  - Display table with columns: Rank, Name, Points
  - Implement responsive table that adapts to mobile screens
  - Use bottom sheet or modal for mobile leaderboard display
  - Listen for 'leaderboard-updated' event and update display
  - Listen for 'quiz-ended' event and display final leaderboard
  - Add visual indicators for top 3 ranks (gold, silver, bronze)
  - Ensure leaderboard updates without page refresh
  - Add mobile-optimized leaderboard layout
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.5_

- [x] 15. Implement mobile-responsive styling with Tailwind CSS
  - Configure Tailwind CSS with mobile-first breakpoints
  - Apply responsive utility classes to all components
  - Ensure all interactive elements have minimum 44px touch targets on mobile
  - Test layouts on mobile viewport (320px width minimum)
  - Implement responsive typography that scales appropriately
  - Add responsive spacing and padding for mobile screens
  - Test horizontal scrolling and ensure content fits within viewport
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 16. Set up AWS infrastructure for deployment
  - Create AWS CDK or CloudFormation project for infrastructure as code
  - Define S3 bucket for frontend static hosting
  - Define CloudFront distribution for S3 bucket with HTTPS
  - Define DynamoDB tables: Events, Questions, Participants, Answers with appropriate keys
  - Define ECS Fargate cluster and task definition for WebSocket server
  - Define Application Load Balancer for WebSocket traffic routing
  - Define security groups for ALB and ECS tasks
  - Define IAM roles for ECS task execution and DynamoDB access
  - Configure environment variables for backend (DynamoDB table names, region)
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 17. Create deployment scripts and configuration
  - Create frontend build script that outputs to dist directory
  - Create backend build script that compiles TypeScript to JavaScript
  - Create Dockerfile for backend WebSocket server
  - Create deployment script to upload frontend build to S3
  - Create deployment script to invalidate CloudFront cache
  - Create deployment script to build and push Docker image to ECR
  - Create deployment script to update ECS service with new task definition
  - Configure environment-specific settings (dev, staging, production)
  - _Requirements: 10.1, 10.3, 10.4_

- [x] 18. Implement error handling and edge cases
  - Add try-catch blocks to all async operations in backend
  - Implement error responses with appropriate HTTP status codes
  - Add frontend error boundaries for React components
  - Implement "Event not found" error page for invalid event IDs
  - Handle WebSocket disconnection with reconnection UI
  - Implement duplicate answer submission prevention (accept first only)
  - Add validation for minimum 2 answer options and maximum 5
  - Add validation for exactly one correct answer per question
  - Handle race conditions in concurrent answer submissions
  - _Requirements: All requirements benefit from proper error handling_

- [ ]* 19. Write integration tests for backend
  - Write tests for REST API endpoints (event creation, question CRUD)
  - Write tests for WebSocket event handlers (join, start, next, submit, end)
  - Write tests for scoring engine ranking algorithm
  - Write tests for DynamoDB repository methods
  - Set up test database or use DynamoDB Local for testing
  - _Requirements: 1.1, 3.1, 4.1, 5.1, 6.4_

- [ ]* 20. Write end-to-end tests
  - Set up Playwright or Cypress for E2E testing
  - Write test for complete organizer flow: create event, add questions, start quiz
  - Write test for complete participant flow: join event, answer questions, view leaderboard
  - Write test for multi-participant scenario with leaderboard ranking
  - Write test for timer expiration and automatic question ending
  - Write test for mobile responsive behavior
  - _Requirements: All requirements_

- [x] 21. Final integration and deployment
  - Test complete flow locally with frontend and backend running
  - Deploy infrastructure to AWS using CDK/CloudFormation
  - Deploy frontend build to S3 and invalidate CloudFront cache
  - Deploy backend Docker image to ECS
  - Verify WebSocket connections work through ALB
  - Test complete flow on deployed AWS environment
  - Verify mobile responsiveness on actual mobile devices
  - Test QR code scanning from mobile devices
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

## Phase 2: Kahoot-Style Enhancements

- [-] 22. Implement Game PIN system
- [x] 22.1 Add gamePin field to Event model and DynamoDB schema
  - Update Event interface to include gamePin field
  - Create GamePins DynamoDB table with PIN as partition key
  - Add TTL configuration for automatic PIN expiration after 24 hours
  - _Requirements: 11.1, 11.5_

- [x] 22.2 Create Game PIN generator service
  - Implement generateGamePin function to create 6-digit numeric codes
  - Implement generateUniqueGamePin with uniqueness checking
  - Add PIN validation function
  - _Requirements: 11.1, 11.5_

- [ ]* 22.3 Write property tests for Game PIN generation
  - **Property 1: Game PIN format validity**
  - **Validates: Requirements 11.1**

- [ ]* 22.4 Write property test for Game PIN uniqueness
  - **Property 4: Game PIN uniqueness**
  - **Validates: Requirements 11.5**

- [x] 22.5 Update event creation endpoint to generate and store Game PIN
  - Modify POST /api/events to call generateUniqueGamePin
  - Store PIN in both Events and GamePins tables
  - Return gamePin in response
  - _Requirements: 11.1, 11.2_

- [x] 22.6 Create Game PIN lookup endpoint
  - Implement GET /api/events/by-pin/:gamePin endpoint
  - Query GamePins table and return event details
  - Handle invalid PIN errors
  - _Requirements: 11.3, 11.4_

- [ ]* 22.7 Write property tests for Game PIN lookup
  - **Property 2: Game PIN lookup correctness**
  - **Property 3: Invalid PIN rejection**
  - **Validates: Requirements 11.3, 11.4**

- [x] 22.8 Create Game PIN input component
  - Build GamePINInput component with 6-digit input field
  - Add PIN format validation
  - Implement PIN submission and navigation to event
  - Display error message for invalid PINs
  - Add mobile-responsive styling
  - _Requirements: 11.3, 11.4_

- [x] 22.9 Update event creation UI to display Game PIN
  - Show Game PIN prominently on organizer dashboard
  - Add copy-to-clipboard functionality for PIN
  - Update QR code to include PIN in join URL
  - _Requirements: 11.2_

- [x] 23. Implement colorful answer buttons with geometric shapes
- [x] 23.1 Define color-shape constants and mapping
  - Create ANSWER_STYLES constant array with color-shape pairs
  - Define SVG paths for each geometric shape
  - Create color palette constants
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 23.2 Update AnswerOption model to include color and shape
  - Add color and shape fields to AnswerOption interface
  - Update question creation logic to assign colors and shapes based on option index
  - _Requirements: 12.1, 12.6_

- [ ]* 23.3 Write property test for color-shape mapping consistency
  - **Property 5: Color-shape mapping consistency**
  - **Validates: Requirements 12.2, 12.3, 12.4, 12.5, 12.6**

- [x] 23.4 Create ColorfulAnswerButton component
  - Build component with SVG geometric shapes
  - Apply color styling based on color prop
  - Implement hover and click animations with Framer Motion
  - Add selected state styling
  - Add correct/incorrect feedback animations
  - Ensure 44px minimum touch target on mobile
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 20.1_

- [x] 23.5 Update QuestionDisplay to use ColorfulAnswerButton
  - Replace existing answer buttons with ColorfulAnswerButton components
  - Pass color and shape props from answer options
  - Update layout for mobile responsiveness
  - _Requirements: 12.1_

- [x] 24. Implement speed-based scoring system
- [x] 24.1 Create speed-based points calculation function
  - Implement calculatePoints function with time-based algorithm
  - Award 1000 points for answers in first 25% of time
  - Linear decrease to 500 points minimum
  - Return 0 points for incorrect answers
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ]* 24.2 Write property tests for speed-based scoring
  - **Property 6: Points vary with response time**
  - **Property 7: Maximum points for fast answers**
  - **Property 8: Minimum points for correct answers**
  - **Property 9: Points upper bound**
  - **Property 10: Zero points for incorrect answers**
  - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6**

- [x] 24.3 Update Answer model to include pointsEarned field
  - Add pointsEarned to Answer interface
  - Update DynamoDB Answers table schema
  - _Requirements: 13.1_

- [x] 24.4 Integrate speed-based scoring into submit-answer handler
  - Call calculatePoints when processing answer submissions
  - Store pointsEarned in answer record
  - Update participant total score with earned points
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 24.5 Update answer-result WebSocket event to include points
  - Add pointsEarned to answer-result payload
  - Send points to participant after answer submission
  - _Requirements: 15.5_

- [ ]* 24.6 Write property test for points earned consistency
  - **Property 15: Points earned consistency**
  - **Validates: Requirements 15.5**

- [x] 24.7 Update leaderboard to display total points instead of simple score 
  - Modify leaderboard display to show cumulative points
  - Update sorting to use total points
  - _Requirements: 6.1, 6.2_

- [-] 25. Implement answer statistics and visualization
- [x] 25.1 Create answer statistics calculator function
  - Implement calculateAnswerStatistics function
  - Count answers for each option
  - Calculate percentages
  - Return AnswerStatistics object
  - _Requirements: 14.1, 14.2_

- [ ]* 25.2 Write property tests for answer statistics
  - **Property 11: Answer count accuracy**
  - **Property 12: Percentage calculation correctness**
  - **Validates: Requirements 14.1, 14.2**

- [x] 25.3 Update question-ended handler to calculate and broadcast statistics
  - Call calculateAnswerStatistics when question ends
  - Emit answer-statistics event to all participants
  - Include correct answer ID in statistics
  - _Requirements: 14.1, 14.2, 14.5, 15.1_

- [ ]* 25.4 Write property test for correct answer revelation
  - **Property 13: Correct answer revelation**
  - **Validates: Requirements 15.1**

- [x] 25.5 Create AnswerStatisticsChart component
  - Build bar chart visualization using CSS or chart library
  - Display option text, count, and percentage for each option
  - Highlight correct answer with distinct styling
  - Animate bar growth with Framer Motion
  - Add mobile-responsive layout
  - _Requirements: 14.3, 14.4, 20.2_

- [x] 25.6 Integrate AnswerStatisticsChart into participant and organizer views
  - Listen for answer-statistics event
  - Display chart after question ends
  - Show before leaderboard update
  - _Requirements: 14.3, 14.4, 14.5_

- [x] 26. Implement answer result reveal
- [x] 26.1 Update answer submission to return immediate feedback
  - Send answer-result event immediately after submission
  - Include isCorrect, pointsEarned, and correctOptionId
  - _Requirements: 15.1, 15.4, 15.5_

- [ ]* 26.2 Write property test for correctness flag accuracy
  - **Property 14: Correctness flag accuracy**
  - **Validates: Requirements 15.4**

- [x] 26.3 Create answer feedback UI in QuestionDisplay
  - Show correct/incorrect indicator after submission
  - Highlight correct answer
  - Display points earned
  - Show participant's selected answer if incorrect
  - Add celebration animation for correct answers
  - Add shake animation for incorrect answers
  - _Requirements: 15.2, 15.3, 15.4, 15.5, 20.1_

- [x] 27. Implement podium display for top 3
- [x] 27.1 Create podium calculation function
  - Extract top 3 participants from final leaderboard
  - Handle cases with fewer than 3 participants
  - _Requirements: 16.6_

- [x] 27.2 Update quiz-ended event to include top 3
  - Add topThree field to quiz-ended payload
  - Calculate and include podium participants
  - _Requirements: 16.1_

- [x] 27.3 Create PodiumDisplay component
  - Build podium visualization with three levels
  - Position 1st place center (highest), 2nd left (medium), 3rd right (lowest)
  - Display participant names and scores
  - Implement staggered entrance animation with Framer Motion
  - Add confetti or celebration effects
  - Add mobile-responsive layout
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 20.2_

- [x] 27.4 Integrate PodiumDisplay into quiz end screen
  - Show podium before final leaderboard
  - Animate transition from last question to podium
  - _Requirements: 16.1_

- [x] 28. Implement question image support
- [x] 28.1 Set up S3 bucket for question images
  - Create S3 bucket in CDK/CloudFormation
  - Configure CORS for image uploads
  - Set up CloudFront distribution for image delivery
  - Configure lifecycle policy for cleanup
  - _Requirements: 17.1_

- [x] 28.2 Create image processing service
  - Install and configure Sharp library
  - Implement uploadQuestionImage function
  - Resize images to max 1200x800 maintaining aspect ratio
  - Optimize image quality
  - Upload to S3 and return CloudFront URL
  - _Requirements: 17.4_

- [ ]* 28.3 Write property test for aspect ratio preservation
  - **Property 16: Aspect ratio preservation**
  - **Validates: Requirements 17.4**

- [x] 28.4 Create image upload endpoint
  - Implement POST /api/events/:eventId/questions/:questionId/image
  - Accept multipart form data
  - Validate image format (JPEG, PNG, GIF)
  - Validate file size (max 5MB)
  - Process and upload image
  - Return image URL
  - _Requirements: 17.1, 17.2, 17.5_

- [x] 28.5 Update Question model to include imageUrl field
  - Add optional imageUrl to Question interface
  - Update DynamoDB Questions table schema
  - _Requirements: 17.1_

- [x] 28.6 Add image upload to QuestionForm component
  - Add file input for image upload
  - Show image preview after selection
  - Validate file type and size on client side
  - Upload image when question is saved
  - Display uploaded image URL
  - _Requirements: 17.1, 17.2, 17.5_

- [x] 28.7 Update QuestionDisplay to show question images
  - Display image above question text when imageUrl exists
  - Ensure responsive image sizing
  - Maintain aspect ratio
  - Add loading state for images
  - _Requirements: 17.3, 17.4_

- [x] 29. Implement answer streak tracking
- [x] 29.1 Add streak fields to Participant model
  - Add currentStreak and longestStreak to Participant interface
  - Update DynamoDB Participants table schema
  - Initialize streaks to 0 when participant joins
  - _Requirements: 18.1_

- [x] 29.2 Create streak tracking functions
  - Implement updateStreak function
  - Increment streak on correct answer
  - Reset streak to 0 on incorrect answer
  - Update longestStreak if current exceeds it
  - _Requirements: 18.1, 18.2, 18.3_

- [ ]* 29.3 Write property tests for streak tracking
  - **Property 17: Streak increment on correct answer**
  - **Property 18: Streak reset on incorrect answer**
  - **Property 19: Streak tracking across questions**
  - **Validates: Requirements 18.1, 18.2, 18.3**

- [x] 29.4 Integrate streak tracking into answer submission
  - Call updateStreak when processing answers
  - Include currentStreak in answer-result event
  - _Requirements: 18.1, 18.2, 18.3_

- [x] 29.5 Create streak indicator UI component
  - Display current streak number
  - Show fire emoji or special indicator for streaks of 3+
  - Animate streak updates
  - Position prominently in participant view
  - _Requirements: 18.4, 18.5, 20.1_

- [x] 29.6 Update QuestionDisplay to show streak indicator
  - Pass currentStreak prop to QuestionDisplay
  - Display streak indicator during quiz
  - Animate streak changes
  - _Requirements: 18.4, 18.5_

- [x] 30. Implement nickname generator
- [x] 30.1 Create nickname generation service
  - Define ADJECTIVES and NOUNS word lists
  - Implement generateNickname function
  - Implement generateNicknameSuggestions function
  - Ensure family-friendly content
  - _Requirements: 19.1, 19.2, 19.5_

- [ ]* 30.2 Write property test for nickname format
  - **Property 20: Nickname format validity**
  - **Validates: Requirements 19.2**

- [x] 30.3 Create get-nickname-suggestions WebSocket handler
  - Implement handler to generate and return suggestions
  - Emit nickname-suggestions event with array of names
  - _Requirements: 19.1_

- [x] 30.4 Create NicknameGenerator component
  - Display 3 nickname suggestions
  - Add refresh button to regenerate suggestions
  - Allow clicking suggestion to select it
  - Provide custom name input option
  - Add mobile-responsive styling
  - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [x] 30.5 Integrate NicknameGenerator into participant join flow
  - Show nickname suggestions on join screen
  - Allow selection or custom input
  - Submit chosen name when joining event
  - _Requirements: 19.1, 19.4_

- [x] 31. Implement visual feedback and animations
- [x] 31.1 Install and configure Framer Motion
  - Add framer-motion dependency
  - Set up animation variants
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [x] 31.2 Add answer button animations
  - Implement hover scale animation
  - Implement click/tap animation
  - Add selection highlight animation
  - Add correct answer celebration (confetti, pulse)
  - Add incorrect answer shake animation
  - _Requirements: 20.1_

- [x] 31.3 Add question transition animations
  - Fade out current question
  - Slide in new question
  - Animate timer appearance
  - _Requirements: 20.2_

- [x] 31.4 Add leaderboard rank change animations
  - Animate position changes with smooth transitions
  - Highlight rank improvements
  - Stagger animation for multiple changes
  - _Requirements: 20.3_

- [x] 31.5 Add participant join animation
  - Show welcome message with fade-in
  - Animate participant name appearance
  - _Requirements: 20.4_

- [x] 31.6 Optimize animation performance
  - Ensure all animations complete within 500ms
  - Use CSS transforms for performance
  - Test on mobile devices
  - _Requirements: 20.5_

- [x] 32. Update visual design with Kahoot-style theme
- [x] 32.1 Implement color palette
  - Update Tailwind config with Kahoot-inspired colors
  - Apply deep purple background (#46178F)
  - Use white text for contrast
  - Apply answer button colors (red, blue, yellow, green, purple)
  - _Requirements: 12.1_

- [x] 32.2 Update typography and spacing
  - Use bold, large fonts for questions
  - Increase spacing for mobile readability
  - Apply consistent padding and margins
  - _Requirements: 9.4_

- [x] 32.3 Add fun visual elements
  - Add background patterns or gradients
  - Include playful icons and emojis
  - Add sound effect triggers (optional)
  - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [x] 33. Update AWS infrastructure for new features
- [x] 33.1 Add S3 bucket for question images to CDK stack
  - Define S3 bucket resource
  - Configure CORS settings
  - Set up CloudFront distribution
  - Add lifecycle policies
  - _Requirements: 17.1_

- [x] 33.2 Add GamePins DynamoDB table to CDK stack
  - Define GamePins table with PIN as partition key
  - Configure TTL attribute
  - Set up appropriate indexes
  - _Requirements: 11.1, 11.5_

- [x] 33.3 Update IAM roles for S3 access
  - Grant ECS tasks permission to upload to S3
  - Grant Lambda functions permission to read from S3
  - _Requirements: 17.1_

- [x] 33.4 Update environment variables
  - Add QUESTION_IMAGES_BUCKET variable
  - Add CLOUDFRONT_URL variable
  - Update backend configuration
  - _Requirements: 17.1_

- [x] 34. Integration testing for new features
- [x] 34.1 Test Game PIN flow end-to-end
  - Create event and verify PIN generation
  - Join event using PIN
  - Verify PIN lookup and navigation
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 34.2 Test speed-based scoring flow
  - Submit answers at different times
  - Verify points calculation
  - Check leaderboard ranking with new scores
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 34.3 Test answer statistics display
  - Complete question with multiple participants
  - Verify statistics calculation
  - Check bar chart rendering
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 34.4 Test streak tracking
  - Answer multiple questions correctly and incorrectly
  - Verify streak increments and resets
  - Check streak indicator display
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [x] 34.5 Test image upload and display
  - Upload images of various formats and sizes
  - Verify image processing and optimization
  - Check image display in questions
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 34.6 Test podium display
  - Complete quiz with multiple participants
  - Verify top 3 calculation
  - Check podium animation and layout
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 34.7 Test nickname generator
  - Request nickname suggestions
  - Verify format and uniqueness
  - Test selection and custom input
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 34.8 Test colorful answer buttons
  - Verify color-shape assignments
  - Test animations and interactions
  - Check mobile responsiveness
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 35. Final deployment and testing of Phase 2 features
  - Deploy updated infrastructure with S3 and GamePins table
  - Deploy updated backend with new endpoints and WebSocket handlers
  - Deploy updated frontend with new components
  - Test complete flow with all new features on AWS
  - Verify mobile responsiveness of new UI elements
  - Test performance with multiple concurrent users
  - Verify animations work smoothly across devices
  - _Requirements: All Phase 2 requirements_
