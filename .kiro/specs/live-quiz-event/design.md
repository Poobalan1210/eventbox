# Design Document: Live Quiz Event System

## Overview

The Live Quiz Event System is a real-time web application that enables organizers to host interactive quiz sessions with live leaderboards. The system uses WebSocket connections for real-time synchronization, a responsive mobile-first UI, and is designed for deployment on AWS infrastructure.

### Technology Stack

- **Frontend**: React with TypeScript for type safety and component-based architecture
- **Styling**: Tailwind CSS for responsive, mobile-first design
- **Animations**: Framer Motion for smooth transitions and visual feedback
- **Real-time Communication**: WebSocket (Socket.io) for bidirectional event-based communication
- **Backend**: Node.js with Express for REST API and WebSocket server
- **Database**: DynamoDB for serverless, scalable data storage
- **File Storage**: S3 for question images and media
- **Hosting**: AWS (API Gateway + Lambda for REST, EC2/ECS for WebSocket server, S3 + CloudFront for frontend)
- **QR Code Generation**: qrcode library for generating event join QR codes
- **Image Processing**: Sharp for image optimization and resizing

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   CloudFront    │ (Static Frontend Distribution)
│   + S3 Bucket   │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
┌────────▼────────┐  ┌──────▼──────────┐
│   API Gateway   │  │  WebSocket      │
│   + Lambda      │  │  Server (ECS)   │
└────────┬────────┘  └──────┬──────────┘
         │                  │
         └──────────┬───────┘
                    │
            ┌───────▼────────┐
            │   DynamoDB     │
            │   - Events     │
            │   - Questions  │
            │   - Answers    │
            └────────────────┘
                    │
            ┌───────▼────────┐
            │   S3 Bucket    │
            │ (Question      │
            │  Images)       │
            └────────────────┘
```

### Component Architecture

**Frontend Components:**
- Organizer Dashboard (Event Creation, Quiz Control)
- Participant Interface (Join, Answer Questions)
- Leaderboard Display (Real-time Rankings)
- Podium Display (Top 3 Celebration)
- Answer Statistics Chart (Response Distribution)
- Colorful Answer Buttons (Geometric Shapes)
- Nickname Generator (Fun Name Suggestions)
- Shared UI Components (Timer, Question Display, Animations)

**Backend Services:**
- REST API (Event CRUD, Question Management, Image Upload)
- WebSocket Server (Real-time State Synchronization)
- Scoring Engine (Speed-based Points Calculation and Rankings)
- Game PIN Generator (Unique 6-digit Code Generation)
- Statistics Calculator (Answer Distribution Analysis)
- Image Processing Service (Upload, Resize, Optimize)

## Components and Interfaces

### 1. Frontend Components

#### OrganizerDashboard Component
**Responsibilities:**
- Create new events
- Display event join link and QR code
- Add/edit questions
- Control quiz flow (start, next question, end)
- View participant list

**Key Props:**
```typescript
interface OrganizerDashboardProps {
  eventId?: string;
}
```

**State Management:**
- Current event details
- Question list
- Participant list
- Quiz state (waiting, active, completed)

#### ParticipantInterface Component
**Responsibilities:**
- Join event via link
- Enter display name
- Display waiting screen
- Show current question and answer options
- Submit answers
- Display leaderboard after each question

**Key Props:**
```typescript
interface ParticipantInterfaceProps {
  eventId: string;
}
```

**State Management:**
- Participant name
- Current question
- Selected answer
- Quiz state
- Personal score and rank

#### Leaderboard Component
**Responsibilities:**
- Display ranked list of participants
- Show score and rank for each participant
- Update in real-time
- Responsive mobile layout

**Key Props:**
```typescript
interface LeaderboardProps {
  participants: ParticipantScore[];
  showTime?: boolean;
}

interface ParticipantScore {
  rank: number;
  name: string;
  score: number;
  totalAnswerTime: number;
}
```

#### QuestionDisplay Component
**Responsibilities:**
- Render question text and optional image
- Display colorful answer buttons with geometric shapes
- Show countdown timer
- Handle answer selection with animations
- Display current streak indicator
- Disable after submission or timeout

**Key Props:**
```typescript
interface QuestionDisplayProps {
  question: Question;
  onAnswerSubmit: (answerId: string, responseTime: number) => void;
  disabled: boolean;
  currentStreak: number;
}
```

#### ColorfulAnswerButton Component
**Responsibilities:**
- Render answer option with color and geometric shape
- Provide hover and click animations
- Show selected state
- Display correct/incorrect feedback after submission

**Key Props:**
```typescript
interface ColorfulAnswerButtonProps {
  option: AnswerOption;
  color: 'red' | 'blue' | 'yellow' | 'green' | 'purple';
  shape: 'triangle' | 'diamond' | 'circle' | 'square' | 'pentagon';
  selected: boolean;
  disabled: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  onClick: () => void;
}
```

#### AnswerStatisticsChart Component
**Responsibilities:**
- Display bar chart of answer distribution
- Highlight correct answer
- Show percentages and counts
- Animate bar growth

**Key Props:**
```typescript
interface AnswerStatisticsChartProps {
  statistics: AnswerStatistics;
  question: Question;
}
```

#### PodiumDisplay Component
**Responsibilities:**
- Show top 3 participants on podium
- Animate podium entrance
- Display names and scores
- Position participants correctly (1st center, 2nd left, 3rd right)

**Key Props:**
```typescript
interface PodiumDisplayProps {
  topThree: ParticipantScore[];
}
```

#### NicknameGenerator Component
**Responsibilities:**
- Generate 3 random nickname suggestions
- Allow regeneration of suggestions
- Enable selection of suggested nickname
- Provide custom name input option

**Key Props:**
```typescript
interface NicknameGeneratorProps {
  onSelectName: (name: string) => void;
}
```

#### GamePINInput Component
**Responsibilities:**
- Accept 6-digit PIN input
- Validate PIN format
- Submit PIN to join event
- Display error for invalid PINs

**Key Props:**
```typescript
interface GamePINInputProps {
  onSubmit: (pin: string) => void;
}
```

### 2. Backend API Endpoints

#### REST API (API Gateway + Lambda)

**POST /api/events**
- Create new event
- Request: `{ name: string }`
- Response: `{ eventId: string, gamePin: string, joinLink: string, qrCode: string }`

**GET /api/events/:eventId**
- Get event details
- Response: `{ id: string, name: string, status: string, questions: Question[] }`

**GET /api/events/by-pin/:gamePin**
- Get event by game PIN
- Response: `{ eventId: string, name: string }`

**POST /api/events/:eventId/questions**
- Add question to event
- Request: `{ text: string, imageFile?: File, options: string[], correctOptionIndex: number, timerSeconds?: number }`
- Response: `{ questionId: string, imageUrl?: string }`

**POST /api/events/:eventId/questions/:questionId/image**
- Upload image for question
- Request: Multipart form data with image file
- Response: `{ imageUrl: string }`

**PUT /api/events/:eventId/questions/:questionId**
- Update question
- Request: Same as POST
- Response: `{ success: boolean }`

**DELETE /api/events/:eventId/questions/:questionId**
- Delete question
- Response: `{ success: boolean }`

#### WebSocket Events (Socket.io)

**Client → Server Events:**

```typescript
// Participant joins event
socket.emit('join-event', { 
  eventId: string, 
  participantName: string 
});

// Organizer starts quiz
socket.emit('start-quiz', { 
  eventId: string 
});

// Organizer advances to next question
socket.emit('next-question', { 
  eventId: string, 
  questionId: string 
});

// Participant submits answer
socket.emit('submit-answer', { 
  eventId: string, 
  questionId: string, 
  answerId: string, 
  responseTime: number 
});

// Request nickname suggestions
socket.emit('get-nickname-suggestions', {
  count: number
});

// Organizer ends quiz
socket.emit('end-quiz', { 
  eventId: string 
});
```

**Server → Client Events:**

```typescript
// Participant successfully joined
socket.on('participant-joined', { 
  participantId: string, 
  participantName: string 
});

// Updated participant list
socket.on('participants-updated', { 
  participants: Participant[] 
});

// Quiz started
socket.on('quiz-started', { 
  eventId: string 
});

// New question displayed
socket.on('question-displayed', { 
  question: Question, 
  questionNumber: number, 
  totalQuestions: number,
  startTime: number 
});

// Timer tick
socket.on('timer-tick', { 
  remainingSeconds: number 
});

// Question ended
socket.on('question-ended', { 
  questionId: string 
});

// Answer result for participant
socket.on('answer-result', {
  isCorrect: boolean,
  pointsEarned: number,
  correctOptionId: string,
  currentStreak: number
});

// Answer statistics after question ends
socket.on('answer-statistics', {
  statistics: AnswerStatistics
});

// Leaderboard update
socket.on('leaderboard-updated', { 
  leaderboard: ParticipantScore[] 
});

// Quiz ended with podium
socket.on('quiz-ended', { 
  finalLeaderboard: ParticipantScore[],
  topThree: ParticipantScore[]
});

// Nickname suggestions response
socket.on('nickname-suggestions', {
  suggestions: string[]
});
```

### 3. Data Models

#### Event
```typescript
interface Event {
  id: string;                    // Unique event identifier
  name: string;                  // Event name
  gamePin: string;               // 6-digit numeric PIN for joining
  organizerId: string;           // Socket ID of organizer
  status: 'waiting' | 'active' | 'completed';
  currentQuestionIndex: number;  // Current question being displayed
  createdAt: number;             // Timestamp
  joinLink: string;              // Full URL to join event
}
```

#### Question
```typescript
interface Question {
  id: string;
  eventId: string;
  text: string;
  imageUrl?: string;             // Optional S3 URL for question image
  options: AnswerOption[];
  correctOptionId: string;
  timerSeconds?: number;         // Optional countdown timer
  order: number;                 // Question sequence
}

interface AnswerOption {
  id: string;
  text: string;
  color: 'red' | 'blue' | 'yellow' | 'green' | 'purple';
  shape: 'triangle' | 'diamond' | 'circle' | 'square' | 'pentagon';
}

// Color-shape mapping
const ANSWER_STYLES = [
  { color: 'red', shape: 'triangle' },
  { color: 'blue', shape: 'diamond' },
  { color: 'yellow', shape: 'circle' },
  { color: 'green', shape: 'square' },
  { color: 'purple', shape: 'pentagon' }
];
```

#### Participant
```typescript
interface Participant {
  id: string;                    // Socket ID
  eventId: string;
  name: string;
  score: number;                 // Total points earned
  totalAnswerTime: number;       // Sum of response times in milliseconds
  currentStreak: number;         // Consecutive correct answers
  longestStreak: number;         // Best streak achieved
  answers: Answer[];
  joinedAt: number;
}
```

#### Answer
```typescript
interface Answer {
  participantId: string;
  questionId: string;
  selectedOptionId: string;
  responseTime: number;          // Time taken to answer in milliseconds
  isCorrect: boolean;
  pointsEarned: number;          // Points awarded (500-1000 for correct, 0 for incorrect)
  submittedAt: number;
}

interface AnswerStatistics {
  questionId: string;
  totalResponses: number;
  optionCounts: {
    [optionId: string]: {
      count: number;
      percentage: number;
    };
  };
  correctOptionId: string;
}
```

### 4. Scoring Engine

**Responsibilities:**
- Calculate speed-based points for each answer
- Track answer streaks
- Apply time-based tie-breaking logic
- Generate ranked leaderboard
- Calculate answer statistics

**Speed-Based Points Algorithm:**
```typescript
function calculatePoints(isCorrect: boolean, responseTime: number, timerSeconds: number): number {
  if (!isCorrect) return 0;
  
  const maxTime = timerSeconds * 1000; // Convert to milliseconds
  const minPoints = 500;
  const maxPoints = 1000;
  const pointRange = maxPoints - minPoints;
  
  // Award max points for answers in first 25% of time
  const fastThreshold = maxTime * 0.25;
  if (responseTime <= fastThreshold) {
    return maxPoints;
  }
  
  // Linear decrease from max to min points
  const timeRatio = (responseTime - fastThreshold) / (maxTime - fastThreshold);
  const points = maxPoints - (pointRange * timeRatio);
  
  return Math.max(minPoints, Math.round(points));
}
```

**Streak Tracking:**
```typescript
function updateStreak(participant: Participant, isCorrect: boolean): void {
  if (isCorrect) {
    participant.currentStreak += 1;
    participant.longestStreak = Math.max(
      participant.longestStreak,
      participant.currentStreak
    );
  } else {
    participant.currentStreak = 0;
  }
}
```

**Leaderboard Ranking Algorithm:**
```typescript
function calculateLeaderboard(participants: Participant[]): ParticipantScore[] {
  return participants
    .map(p => ({
      rank: 0,
      name: p.name,
      score: p.score,
      totalAnswerTime: p.totalAnswerTime,
      currentStreak: p.currentStreak
    }))
    .sort((a, b) => {
      // Primary: Sort by score (descending)
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      // Secondary: Sort by total answer time (ascending)
      if (a.totalAnswerTime !== b.totalAnswerTime) {
        return a.totalAnswerTime - b.totalAnswerTime;
      }
      // Tertiary: Sort alphabetically by name
      return a.name.localeCompare(b.name);
    })
    .map((p, index) => ({
      ...p,
      rank: index + 1
    }));
}
```

**Answer Statistics Calculator:**
```typescript
function calculateAnswerStatistics(
  questionId: string,
  answers: Answer[],
  correctOptionId: string
): AnswerStatistics {
  const totalResponses = answers.length;
  const optionCounts: { [key: string]: { count: number; percentage: number } } = {};
  
  // Count answers for each option
  answers.forEach(answer => {
    if (!optionCounts[answer.selectedOptionId]) {
      optionCounts[answer.selectedOptionId] = { count: 0, percentage: 0 };
    }
    optionCounts[answer.selectedOptionId].count += 1;
  });
  
  // Calculate percentages
  Object.keys(optionCounts).forEach(optionId => {
    optionCounts[optionId].percentage = 
      (optionCounts[optionId].count / totalResponses) * 100;
  });
  
  return {
    questionId,
    totalResponses,
    optionCounts,
    correctOptionId
  };
}
```

### 5. Game PIN Generator

**Responsibilities:**
- Generate unique 6-digit numeric PINs
- Ensure PIN uniqueness across active events
- Validate PIN format

**Algorithm:**
```typescript
function generateGamePin(): string {
  // Generate random 6-digit number
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  return pin;
}

async function generateUniqueGamePin(): Promise<string> {
  let pin: string;
  let isUnique = false;
  
  while (!isUnique) {
    pin = generateGamePin();
    // Check if PIN exists in active events
    const existingEvent = await eventRepository.getEventByPin(pin);
    if (!existingEvent || existingEvent.status === 'completed') {
      isUnique = true;
    }
  }
  
  return pin!;
}
```

### 6. Nickname Generator

**Responsibilities:**
- Generate fun, family-friendly nickname suggestions
- Combine adjectives and nouns randomly
- Ensure appropriate content

**Word Lists:**
```typescript
const ADJECTIVES = [
  'Happy', 'Clever', 'Swift', 'Brave', 'Mighty', 'Wise', 'Cool', 'Epic',
  'Super', 'Mega', 'Ultra', 'Turbo', 'Cosmic', 'Electric', 'Blazing', 'Stellar'
];

const NOUNS = [
  'Panda', 'Tiger', 'Eagle', 'Dolphin', 'Phoenix', 'Dragon', 'Ninja', 'Wizard',
  'Knight', 'Pirate', 'Robot', 'Rocket', 'Thunder', 'Lightning', 'Champion', 'Hero'
];

function generateNickname(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective}${noun}`;
}

function generateNicknameSuggestions(count: number = 3): string[] {
  const suggestions = new Set<string>();
  while (suggestions.size < count) {
    suggestions.add(generateNickname());
  }
  return Array.from(suggestions);
}
```

### 7. Image Processing Service

**Responsibilities:**
- Handle image uploads to S3
- Resize and optimize images
- Generate signed URLs for access
- Validate image format and size

**Implementation:**
```typescript
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async function uploadQuestionImage(
  file: Buffer,
  eventId: string,
  questionId: string
): Promise<string> {
  // Resize and optimize image
  const optimizedImage = await sharp(file)
    .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  
  // Upload to S3
  const key = `questions/${eventId}/${questionId}.jpg`;
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.QUESTION_IMAGES_BUCKET,
    Key: key,
    Body: optimizedImage,
    ContentType: 'image/jpeg',
    CacheControl: 'max-age=31536000'
  }));
  
  // Return CloudFront URL
  return `${process.env.CLOUDFRONT_URL}/${key}`;
}
```

## Data Flow

### Event Creation Flow
1. Organizer submits event name via REST API
2. Lambda function creates event record in DynamoDB
3. Generate unique event ID and join link
4. Generate QR code containing join link
5. Return event details to organizer

### Participant Join Flow
1. Participant accesses join link
2. Frontend displays name entry form
3. Participant submits name
4. WebSocket connection established
5. Emit 'join-event' with eventId and name
6. Server validates and adds participant to event
7. Broadcast 'participants-updated' to organizer
8. Send 'participant-joined' confirmation to participant

### Quiz Execution Flow
1. Organizer clicks "Start Quiz"
2. Emit 'start-quiz' event
3. Server updates event status to 'active'
4. Broadcast 'quiz-started' to all participants with animations
5. Organizer clicks "Next Question"
6. Emit 'next-question' with questionId
7. Server broadcasts 'question-displayed' with question data (including image URL if present) and start time
8. Participants see colorful answer buttons with geometric shapes
9. Timer starts (if configured)
10. Participants submit answers via 'submit-answer'
11. Server records answer with response time
12. Calculate speed-based points (500-1000 for correct, 0 for incorrect)
13. Update participant score and streak
14. Send 'answer-result' to participant with points earned and correct answer
15. When all answered or timer expires, emit 'question-ended'
16. Calculate answer statistics (distribution across options)
17. Broadcast 'answer-statistics' showing bar chart of responses
18. Calculate leaderboard using scoring engine
19. Broadcast 'leaderboard-updated' to all users with animated rank changes
20. Repeat steps 5-19 for each question
21. After final question, calculate top 3 for podium
22. Emit 'quiz-ended' with final leaderboard and podium display

## Visual Design and Animations

### Color Palette
- **Red Triangle**: `#E21B3C` (Primary red)
- **Blue Diamond**: `#1368CE` (Primary blue)
- **Yellow Circle**: `#FFA602` (Primary yellow)
- **Green Square**: `#26890C` (Primary green)
- **Purple Pentagon**: `#9C27B0` (Primary purple)
- **Background**: `#46178F` (Deep purple, Kahoot-style)
- **Text**: `#FFFFFF` (White for contrast)

### Answer Button Design
```typescript
// Geometric shape SVG paths
const SHAPES = {
  triangle: 'M 50 10 L 90 90 L 10 90 Z',
  diamond: 'M 50 10 L 90 50 L 50 90 L 10 50 Z',
  circle: 'M 50 50 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0',
  square: 'M 20 20 L 80 20 L 80 80 L 20 80 Z',
  pentagon: 'M 50 10 L 85 40 L 70 85 L 30 85 L 15 40 Z'
};
```

### Animation Specifications

**Answer Button Hover:**
- Scale: 1.05
- Duration: 200ms
- Easing: ease-out

**Answer Button Click:**
- Scale: 0.95 → 1.0
- Duration: 150ms
- Easing: ease-in-out

**Correct Answer Feedback:**
- Background pulse: green glow
- Confetti animation
- Duration: 500ms

**Incorrect Answer Feedback:**
- Shake animation
- Red border flash
- Duration: 300ms

**Leaderboard Rank Change:**
- Slide animation
- Duration: 400ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

**Podium Entrance:**
- Stagger animation (2nd, 3rd, then 1st)
- Scale from 0 to 1
- Duration: 600ms per participant
- Delay: 200ms between each

**Streak Indicator:**
- Fade in with scale
- Fire emoji animation for 3+ streak
- Duration: 300ms

**Question Transition:**
- Fade out current question
- Slide in new question from right
- Duration: 400ms

### Framer Motion Implementation
```typescript
// Example animation variants
const answerButtonVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
  correct: {
    backgroundColor: ['#26890C', '#4CAF50', '#26890C'],
    transition: { duration: 0.5 }
  },
  incorrect: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.3 }
  }
};

const podiumVariants = {
  hidden: { y: 100, opacity: 0 },
  visible: (custom: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: custom * 0.2,
      duration: 0.6,
      ease: 'easeOut'
    }
  })
};
```

## Mobile Responsiveness Strategy

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Optimizations
- Stack answer options vertically on mobile
- Increase touch target sizes (minimum 44px height)
- Use bottom sheet for leaderboard on mobile
- Simplified navigation with hamburger menu
- Larger font sizes for readability
- Optimized QR code size for mobile scanning

### Tailwind CSS Approach
```typescript
// Example responsive classes
<button className="w-full md:w-auto px-6 py-3 text-lg">
  Submit Answer
</button>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Answer options */}
</div>
```

## AWS Deployment Architecture

### Frontend Deployment
- **S3 Bucket**: Host static React build files
- **CloudFront**: CDN for global distribution and HTTPS
- **Route 53**: Custom domain management (optional)

### Backend Deployment

#### Option 1: Serverless (Recommended for MVP)
- **API Gateway + Lambda**: REST API endpoints
- **EC2 or ECS Fargate**: WebSocket server (Socket.io requires persistent connections)
- **Application Load Balancer**: Route WebSocket traffic to ECS tasks
- **DynamoDB**: NoSQL database for events, questions, participants, answers

#### Option 2: Container-based
- **ECS Fargate**: Run both REST API and WebSocket server in containers
- **Application Load Balancer**: Route HTTP and WebSocket traffic
- **DynamoDB**: Database layer

### Database Schema (DynamoDB)

**Events Table**
- Partition Key: `eventId` (String)
- Attributes: name, organizerId, status, currentQuestionIndex, createdAt, joinLink

**Questions Table**
- Partition Key: `eventId` (String)
- Sort Key: `questionId` (String)
- Attributes: text, options (List), correctOptionId, timerSeconds, order
- GSI: eventId-order-index for ordered retrieval

**Participants Table**
- Partition Key: `eventId` (String)
- Sort Key: `participantId` (String)
- Attributes: name, score, totalAnswerTime, joinedAt

**Answers Table**
- Partition Key: `participantId` (String)
- Sort Key: `questionId` (String)
- Attributes: eventId, selectedOptionId, responseTime, isCorrect, pointsEarned, submittedAt
- GSI: eventId-questionId-index for aggregation

**GamePins Table** (for quick PIN lookup)
- Partition Key: `gamePin` (String)
- Attributes: eventId, createdAt, expiresAt
- TTL: expiresAt (auto-delete after 24 hours)

### S3 Buckets

**Question Images Bucket**
- Store uploaded question images
- Lifecycle policy: Delete after 30 days of event completion
- Public read access via CloudFront
- CORS configuration for uploads

**Frontend Assets Bucket**
- Store static React build files
- CloudFront distribution for global CDN

### Infrastructure as Code
Use AWS CDK or CloudFormation for reproducible deployments:
- VPC configuration for ECS
- Security groups for load balancer and containers
- IAM roles for Lambda and ECS task execution
- DynamoDB tables with appropriate indexes
- S3 buckets for frontend and question images
- CloudFront distributions for both buckets
- Image upload presigned URL generation

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Game PIN Properties

**Property 1: Game PIN format validity**
*For any* generated Game PIN, the PIN should be exactly 6 digits and contain only numeric characters
**Validates: Requirements 11.1**

**Property 2: Game PIN lookup correctness**
*For any* event with a Game PIN, looking up that PIN should return the correct event ID
**Validates: Requirements 11.3**

**Property 3: Invalid PIN rejection**
*For any* PIN that doesn't exist in the system, lookup should return an error
**Validates: Requirements 11.4**

**Property 4: Game PIN uniqueness**
*For any* set of active events, no two events should have the same Game PIN
**Validates: Requirements 11.5**

### Answer Button Color-Shape Properties

**Property 5: Color-shape mapping consistency**
*For any* two questions with the same number of answer options, the color-shape assignments should be identical
**Validates: Requirements 12.2, 12.3, 12.4, 12.5, 12.6**

### Speed-Based Scoring Properties

**Property 6: Points vary with response time**
*For any* two correct answers to the same question, the answer with shorter response time should earn equal or more points
**Validates: Requirements 13.1, 13.3**

**Property 7: Maximum points for fast answers**
*For any* correct answer submitted within the first 25% of available time, the points awarded should be exactly 1000
**Validates: Requirements 13.2, 13.5**

**Property 8: Minimum points for correct answers**
*For any* correct answer regardless of response time, the points awarded should be at least 500
**Validates: Requirements 13.4**

**Property 9: Points upper bound**
*For any* correct answer, the points awarded should not exceed 1000
**Validates: Requirements 13.5**

**Property 10: Zero points for incorrect answers**
*For any* incorrect answer, the points awarded should be exactly 0
**Validates: Requirements 13.6**

### Answer Statistics Properties

**Property 11: Answer count accuracy**
*For any* set of submitted answers to a question, the sum of counts across all options should equal the total number of answers
**Validates: Requirements 14.1**

**Property 12: Percentage calculation correctness**
*For any* answer statistics, the sum of all option percentages should equal 100 (within rounding tolerance of 0.1%)
**Validates: Requirements 14.2**

### Answer Result Properties

**Property 13: Correct answer revelation**
*For any* question that has ended, the response should include the correct answer ID
**Validates: Requirements 15.1**

**Property 14: Correctness flag accuracy**
*For any* submitted answer, the isCorrect flag should be true if and only if the selected option equals the correct option
**Validates: Requirements 15.4**

**Property 15: Points earned consistency**
*For any* answer result, the points shown should match the points calculated by the scoring algorithm
**Validates: Requirements 15.5**

### Image Processing Properties

**Property 16: Aspect ratio preservation**
*For any* uploaded image, the resized image dimensions should maintain the same aspect ratio as the original (within 1% tolerance)
**Validates: Requirements 17.4**

### Streak Tracking Properties

**Property 17: Streak increment on correct answer**
*For any* participant with current streak N, submitting a correct answer should result in streak N+1
**Validates: Requirements 18.1, 18.2**

**Property 18: Streak reset on incorrect answer**
*For any* participant who submits an incorrect answer, their streak should be reset to 0
**Validates: Requirements 18.3**

**Property 19: Streak tracking across questions**
*For any* sequence of answers by a participant, the final streak should equal the number of consecutive correct answers at the end of the sequence
**Validates: Requirements 18.1**

### Nickname Generation Properties

**Property 20: Nickname format validity**
*For any* generated nickname, it should match the pattern of one adjective from the approved list followed by one noun from the approved list
**Validates: Requirements 19.2**

### Leaderboard Ranking Properties

**Property 21: Score-based ranking**
*For any* two participants in the leaderboard, if participant A has a higher score than participant B, then A's rank should be lower (better) than B's rank
**Validates: Requirements 6.2**

**Property 22: Time-based tie-breaking**
*For any* two participants with equal scores, the participant with lower total answer time should have a better rank
**Validates: Requirements 6.3**

**Property 23: Alphabetical tie-breaking**
*For any* two participants with equal scores and equal total answer time, the participant whose name comes first alphabetically should have a better rank
**Validates: Requirements 6.4**

## Error Handling

### Frontend Error Scenarios

**WebSocket Connection Failures**
- Display "Connection lost" message
- Attempt automatic reconnection with exponential backoff
- Show reconnection status to user
- Preserve local state during reconnection

**Answer Submission Failures**
- Show error message to participant
- Allow retry if within time limit
- Log error for debugging

**Invalid Event Access**
- Display "Event not found" message
- Provide link to create new event

### Backend Error Scenarios

**Participant Disconnection**
- Remove participant from active list after 30-second timeout
- Preserve participant data for potential reconnection
- Broadcast updated participant list

**Invalid Question Data**
- Validate question structure before saving
- Return 400 Bad Request with specific error message
- Ensure at least 2 options and exactly 1 correct answer

**Database Operation Failures**
- Implement retry logic with exponential backoff
- Return 500 Internal Server Error to client
- Log errors to CloudWatch for monitoring

**Race Conditions**
- Use DynamoDB conditional writes for concurrent updates
- Implement optimistic locking for score updates
- Handle duplicate answer submissions (accept first only)

## Testing Strategy

### Property-Based Testing

We will use **fast-check** (for TypeScript/JavaScript) as our property-based testing library. Each property-based test should run a minimum of 100 iterations to ensure thorough coverage.

**Property-Based Tests to Implement:**
- Property 1: Game PIN format validity (generate random events, verify PIN format)
- Property 2: Game PIN lookup correctness (generate events with PINs, verify lookup)
- Property 3: Invalid PIN rejection (generate random invalid PINs, verify errors)
- Property 4: Game PIN uniqueness (generate multiple events, verify no duplicate PINs)
- Property 5: Color-shape mapping consistency (generate questions with varying option counts)
- Property 6: Points vary with response time (generate answers with different times)
- Property 7: Maximum points for fast answers (generate fast answers, verify 1000 points)
- Property 8: Minimum points for correct answers (generate slow correct answers, verify ≥500 points)
- Property 9: Points upper bound (generate all correct answers, verify ≤1000 points)
- Property 10: Zero points for incorrect answers (generate incorrect answers, verify 0 points)
- Property 11: Answer count accuracy (generate random answer sets, verify sum)
- Property 12: Percentage calculation correctness (generate statistics, verify sum to 100%)
- Property 13: Correct answer revelation (generate ended questions, verify correct ID included)
- Property 14: Correctness flag accuracy (generate answers, verify isCorrect matches selection)
- Property 15: Points earned consistency (generate answers, verify points match calculation)
- Property 16: Aspect ratio preservation (generate images with various dimensions)
- Property 17: Streak increment on correct answer (generate correct answer sequences)
- Property 18: Streak reset on incorrect answer (generate mixed answer sequences)
- Property 19: Streak tracking across questions (generate full answer sequences)
- Property 20: Nickname format validity (generate nicknames, verify pattern)
- Property 21: Score-based ranking (generate participants with different scores)
- Property 22: Time-based tie-breaking (generate participants with equal scores)
- Property 23: Alphabetical tie-breaking (generate participants with equal scores and times)

**Test Tagging Format:**
Each property-based test must be tagged with a comment in this exact format:
```typescript
// **Feature: live-quiz-event, Property 1: Game PIN format validity**
```

### Unit Tests
- Scoring engine logic (speed-based points calculation)
- Answer validation
- Timer countdown logic
- QR code generation
- Data model validation
- Nickname generation
- Image upload and processing
- Game PIN generation
- Answer statistics calculation

### Integration Tests
- REST API endpoints (including image upload)
- WebSocket event handlers (including new events for statistics, streaks)
- Database operations (DynamoDB including GamePins table)
- End-to-end event creation flow with Game PIN
- S3 image upload and retrieval

### End-to-End Tests
- Complete quiz flow from creation to completion with new features
- Multi-participant scenarios with speed-based scoring
- Mobile responsive behavior with colorful buttons
- Real-time synchronization across multiple clients
- Answer statistics display after each question
- Podium display at quiz end
- Streak tracking throughout quiz

### Performance Tests
- Load testing with 100+ concurrent participants
- WebSocket connection stability
- Database query performance
- Leaderboard calculation with large participant counts
- Image upload and processing performance
- Answer statistics calculation with many participants

### Manual Testing Checklist
- QR code scanning on mobile devices
- Game PIN entry flow
- Cross-browser compatibility (Chrome, Safari, Firefox)
- Mobile device testing (iOS and Android)
- Network interruption recovery
- Timer accuracy across devices
- Colorful answer button animations
- Podium display animations
- Streak indicator display
- Answer statistics bar chart rendering
- Question image display and responsiveness

## Security Considerations

### Input Validation
- Sanitize participant names (prevent XSS)
- Validate event IDs and question IDs
- Limit question text and answer option lengths
- Rate limiting on API endpoints

### WebSocket Security
- Validate event membership before broadcasting
- Prevent participants from impersonating organizers
- Implement connection limits per IP

### AWS Security
- Enable HTTPS only (CloudFront and ALB)
- Configure CORS appropriately
- Use IAM roles with least privilege
- Enable DynamoDB encryption at rest
- Configure security groups to restrict access

## Performance Optimizations

### Frontend
- Code splitting for organizer and participant routes
- Lazy load leaderboard component
- Memoize expensive calculations (React.memo, useMemo)
- Debounce WebSocket events if needed
- Optimize bundle size with tree shaking

### Backend
- Cache event and question data in memory on WebSocket server
- Use DynamoDB batch operations where possible
- Implement connection pooling
- Compress WebSocket messages
- Use CloudFront caching for static assets

### Database
- Design efficient DynamoDB indexes
- Use projection expressions to fetch only needed attributes
- Implement pagination for large result sets
- Consider DynamoDB Streams for real-time updates

## Monitoring and Observability

### Metrics to Track
- WebSocket connection count
- Active events count
- Average response time per question
- API endpoint latency
- Database operation latency
- Error rates

### Logging
- CloudWatch Logs for Lambda and ECS
- Structured logging with correlation IDs
- Log levels: ERROR, WARN, INFO, DEBUG
- Log WebSocket connection/disconnection events

### Alerts
- High error rate threshold
- WebSocket server health checks
- DynamoDB throttling events
- CloudFront 5xx errors
