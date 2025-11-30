# QuizActivityService Implementation

## Overview
The QuizActivityService has been successfully created to encapsulate all quiz-specific logic that was previously scattered across the WebSocketService and other components. This service is designed to work with `activityId` instead of `eventId`, aligning with the new event-activities platform architecture.

## Key Features

### Question Management
- **addQuestion**: Add questions to quiz activities with validation
- **updateQuestion**: Update existing questions
- **deleteQuestion**: Remove questions from quiz activities
- **getQuestions**: Retrieve all questions for a quiz activity

### Quiz Lifecycle
- **startQuiz**: Activate a quiz activity
- **nextQuestion**: Get the next question in sequence
- **endQuiz**: Complete a quiz and generate final results

### Answer Processing
- **submitAnswer**: Process participant answers with:
  - Answer validation
  - Correctness checking
  - Speed-based scoring
  - Streak tracking
  - Duplicate submission prevention

### Statistics & Leaderboards
- **getAnswerStatistics**: Calculate answer distribution for questions
- **getLeaderboard**: Generate real-time leaderboards

## Architecture

The service integrates with:
- **ActivityRepository**: For activity metadata and status
- **QuestionRepository**: For question CRUD operations
- **AnswerRepository**: For answer storage and retrieval
- **ParticipantRepository**: For participant score and streak updates
- **ScoringEngine**: For points calculation and leaderboard generation

## Key Design Decisions

1. **Activity-Centric**: All methods work with `activityId` as the primary identifier
2. **Type Safety**: Validates that activities are of type 'quiz' before operations
3. **Error Handling**: Comprehensive error messages for invalid operations
4. **Backward Compatibility**: Still uses `eventId` internally for database operations during the transition period

## Usage Example

```typescript
import { QuizActivityService } from './services/quizActivityService.js';

const quizService = new QuizActivityService();

// Add a question
const question = await quizService.addQuestion(activityId, {
  eventId: eventId,
  text: 'What is 2 + 2?',
  options: [...],
  correctOptionId: 'opt2',
  timerSeconds: 30,
  order: 1
});

// Submit an answer
const result = await quizService.submitAnswer(
  activityId,
  participantId,
  questionId,
  answerId,
  responseTime
);

// End the quiz
const results = await quizService.endQuiz(activityId);
```

## Next Steps

This service is ready to be integrated into:
1. WebSocket handlers (task 20)
2. REST API endpoints (task 12)
3. Activity management workflows

## Testing

A test file has been created at `backend/src/__tests__/quizActivityService.test.ts` that demonstrates the service's functionality. The tests require a properly configured DynamoDB environment to run.
