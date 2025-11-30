# Organizer UX Improvements - Design Document

## Overview

This design document outlines the technical approach for enhancing the organizer experience in the Live Quiz Event System. The improvements focus on creating distinct Setup and Live modes, implementing quiz history management, adding privacy controls, and introducing a template system for quiz reusability.

### Design Goals

1. **Clear Mode Separation**: Distinct UI states for setup vs live quiz management
2. **Efficient Navigation**: Intuitive dashboard for managing multiple quizzes
3. **Privacy Control**: Flexible visibility options for quiz events
4. **Reusability**: Template system to accelerate quiz creation
5. **Minimal Disruption**: Build on existing architecture without breaking changes

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │  Setup Mode  │  │  Live Mode   │      │
│  │   Component  │  │  Component   │  │  Component   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │  Quiz State │                          │
│                    │  Management │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼──────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   REST API     │
                    └───────┬────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                    Backend (Express)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Event     │  │   Template   │  │   History    │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │ Repositories │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼──────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   DynamoDB     │
                    └────────────────┘
```

### State Management

The application will use a state machine approach for quiz modes:

```
┌─────────┐     create/edit      ┌─────────┐
│  Draft  │ ──────────────────▶  │  Setup  │
└─────────┘                      └────┬────┘
                                      │
                                      │ start quiz
                                      │
                                      ▼
                                 ┌────────┐
                                 │  Live  │
                                 └────┬───┘
                                      │
                                      │ end quiz
                                      │
                                      ▼
                                 ┌────────┐
                                 │Complete│
                                 └────────┘
```

---

## Components and Interfaces

### Frontend Components

#### 1. OrganizerDashboard Component

**Purpose**: Central hub for managing all quizzes

**Props**:
```typescript
interface OrganizerDashboardProps {
  organizerId: string;
}
```

**State**:
```typescript
interface DashboardState {
  quizzes: Quiz[];
  filter: 'all' | 'live' | 'upcoming' | 'past';
  searchQuery: string;
  loading: boolean;
  error: string | null;
}
```

**Key Features**:
- Quiz categorization (Live, Upcoming, Past)
- Search and filter functionality
- Quick actions (Create New, Create from Template)
- Real-time updates for live quizzes

#### 2. SetupMode Component

**Purpose**: Interface for creating and editing quiz questions

**Props**:
```typescript
interface SetupModeProps {
  eventId: string;
  onStartQuiz: () => void;
  onSaveAsDraft: () => void;
}
```

**State**:
```typescript
interface SetupModeState {
  questions: Question[];
  currentQuestion: Question | null;
  isEditing: boolean;
  canStart: boolean;
  previewMode: boolean;
}
```

**Key Features**:
- Question list with drag-and-drop reordering
- Question form for adding/editing
- Preview mode for participant view
- "Ready to Start" validation
- Save as draft functionality

#### 3. LiveMode Component

**Purpose**: Focused interface for running active quizzes

**Props**:
```typescript
interface LiveModeProps {
  eventId: string;
  onEndQuiz: () => void;
}
```

**State**:
```typescript
interface LiveModeState {
  currentQuestionIndex: number;
  participants: Participant[];
  responses: Response[];
  allAnswered: boolean;
  quizProgress: number;
}
```

**Key Features**:
- Current question display
- Real-time participant tracking
- Answer submission status
- Progress indicator
- Quiz control buttons (Next, End)

#### 4. QuizCard Component

**Purpose**: Display quiz information in dashboard

**Props**:
```typescript
interface QuizCardProps {
  quiz: Quiz;
  onSelect: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
  onDuplicate?: (quizId: string) => void;
}
```

**Visual Design**:
- Status badge (Live, Upcoming, Past)
- Quiz name and description
- Participant count
- Creation/last modified date
- Quick action buttons

#### 5. PrivacySelector Component

**Purpose**: Control quiz visibility settings

**Props**:
```typescript
interface PrivacySelectorProps {
  value: 'private' | 'public';
  onChange: (value: 'private' | 'public') => void;
  disabled?: boolean;
}
```

**Visual Design**:
- Toggle or radio button interface
- Clear labels explaining each option
- Icon indicators (lock for private, globe for public)

#### 6. TemplateSelector Component

**Purpose**: Choose template when creating new quiz

**Props**:
```typescript
interface TemplateSelectorProps {
  templates: Template[];
  onSelect: (templateId: string | null) => void;
  onCreateBlank: () => void;
}
```

**Visual Design**:
- Grid of template cards
- Template preview on hover
- "Start from Blank" option
- Template metadata (questions count, topic)

---

## Data Models

### Extended Event Model

```typescript
interface Event {
  // Existing fields
  eventId: string;
  name: string;
  organizerId: string;
  gamePin: string;
  createdAt: string;
  
  // New fields
  status: 'draft' | 'setup' | 'live' | 'completed';
  visibility: 'private' | 'public';
  isTemplate: boolean;
  templateName?: string;
  lastModified: string;
  startedAt?: string;
  completedAt?: string;
  participantCount: number;
  topic?: string;
  description?: string;
}
```

### Template Model

```typescript
interface Template {
  templateId: string;
  name: string;
  description: string;
  organizerId: string;
  questions: Question[];
  topic: string;
  createdAt: string;
  usageCount: number;
  isPublic: boolean;
}
```

### Quiz History Entry

```typescript
interface QuizHistoryEntry {
  eventId: string;
  name: string;
  status: 'live' | 'upcoming' | 'completed';
  participantCount: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  visibility: 'private' | 'public';
  hasUnreadNotifications: boolean;
}
```

---

## API Endpoints

### Quiz Management

```typescript
// Get all quizzes for organizer
GET /api/events/organizer/:organizerId
Response: {
  quizzes: QuizHistoryEntry[];
}

// Update quiz status
PATCH /api/events/:eventId/status
Body: {
  status: 'draft' | 'setup' | 'live' | 'completed';
}

// Update quiz visibility
PATCH /api/events/:eventId/visibility
Body: {
  visibility: 'private' | 'public';
}

// Get public quizzes
GET /api/events/public
Query: {
  status?: 'live' | 'upcoming';
  search?: string;
}
Response: {
  quizzes: Event[];
}
```

### Template Management

```typescript
// Create template from event
POST /api/templates
Body: {
  eventId: string;
  name: string;
  description: string;
  isPublic: boolean;
}

// Get templates for organizer
GET /api/templates/organizer/:organizerId
Response: {
  templates: Template[];
}

// Create event from template
POST /api/events/from-template
Body: {
  templateId: string;
  name: string;
  organizerId: string;
}
Response: {
  eventId: string;
}

// Get public templates
GET /api/templates/public
Response: {
  templates: Template[];
}
```

---

## User Interface Design

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  My Quizzes                                    [+ New]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [All] [Live] [Upcoming] [Past]        [Search...]     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ 🔴 LIVE      │  │ 📅 Upcoming  │  │ ✓ Completed  │ │
│  │ Quiz Name    │  │ Quiz Name    │  │ Quiz Name    │ │
│  │ 12 players   │  │ 0 players    │  │ 45 players   │ │
│  │ [Manage]     │  │ [Edit]       │  │ [View]       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Setup Mode Layout

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Dashboard    Quiz Name    [Save Draft]      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Setup Mode                                             │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │ Questions (3)   │  │ Add/Edit Question            │ │
│  │                 │  │                              │ │
│  │ 1. Question 1   │  │ Question Text:               │ │
│  │ 2. Question 2   │  │ [________________]           │ │
│  │ 3. Question 3   │  │                              │ │
│  │                 │  │ Answers:                     │ │
│  │ [+ Add]         │  │ ○ [________] ✓               │ │
│  │                 │  │ ○ [________]                 │ │
│  │                 │  │ ○ [________]                 │ │
│  │                 │  │ ○ [________]                 │ │
│  │                 │  │                              │ │
│  │                 │  │ [Preview] [Save]             │ │
│  └─────────────────┘  └──────────────────────────────┘ │
│                                                          │
│  Privacy: [Private ▼]                                   │
│  [Ready to Start Quiz]                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Live Mode Layout

```
┌─────────────────────────────────────────────────────────┐
│  Live Mode - Quiz Name                                  │
│  Game PIN: 123456          12 participants joined       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Question 2 of 5                                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  What is the capital of France?                   │ │
│  │                                                    │ │
│  │  Answers submitted: 10/12                         │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Progress: ████████░░░░░░░░░░ 40%                      │
│                                                          │
│  [Next Question]  [Show Results]  [End Quiz]           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Mode Transition Validity
*For any* quiz event, when transitioning from Setup Mode to Live Mode, the event must have at least one question and the status must change from 'setup' to 'live'.

**Validates: Requirements 21.3**

### Property 2: Quiz Categorization Consistency
*For any* quiz in the dashboard, its category (Live, Upcoming, Past) must match its current status field, where 'live' status maps to Live category, 'draft' or 'setup' maps to Upcoming, and 'completed' maps to Past.

**Validates: Requirements 22.2**

### Property 3: Privacy Enforcement
*For any* quiz marked as private, attempting to access it without the correct Game PIN or direct link must be rejected by the system.

**Validates: Requirements 23.2**

### Property 4: Template Creation Preservation
*For any* quiz saved as a template, creating a new quiz from that template must result in a new event with identical questions but a different eventId.

**Validates: Requirements 24.3**

### Property 5: Mode-Specific UI Visibility
*For any* quiz in Setup Mode, the live control buttons (Next Question, Show Results) must not be visible, and conversely, in Live Mode, the question editing controls must not be visible.

**Validates: Requirements 21.2, 21.4**

### Property 6: Dashboard Sorting Order
*For any* organizer's quiz list, Live quizzes must appear before Upcoming quizzes, which must appear before Past quizzes, with each category sorted by date.

**Validates: Requirements 22.5**

### Property 7: Public Quiz Discoverability
*For any* quiz marked as public with status 'live', it must appear in the public quiz browser results.

**Validates: Requirements 28.1**

### Property 8: Quiz State Preservation
*For any* quiz, navigating away from the quiz page and returning must preserve the quiz's current state (questions, participants, current question index).

**Validates: Requirements 27.3**

---

## Error Handling

### Error Scenarios

1. **Invalid Mode Transition**
   - Error: Attempting to start quiz with no questions
   - Handling: Display validation error, prevent transition
   - User Message: "Cannot start quiz: Add at least one question"

2. **Template Not Found**
   - Error: Attempting to create from non-existent template
   - Handling: Fallback to blank quiz creation
   - User Message: "Template not found. Creating blank quiz instead."

3. **Unauthorized Access**
   - Error: Accessing another organizer's quiz
   - Handling: Redirect to dashboard with error
   - User Message: "You don't have permission to access this quiz"

4. **Network Failure During Mode Transition**
   - Error: API call fails when starting quiz
   - Handling: Retry with exponential backoff, show loading state
   - User Message: "Starting quiz... Please wait"

5. **Concurrent Modification**
   - Error: Quiz modified by another session
   - Handling: Detect version conflict, prompt to reload
   - User Message: "This quiz was modified elsewhere. Reload to see latest version?"

### Error Recovery Strategies

```typescript
// Optimistic UI updates with rollback
async function transitionToLiveMode(eventId: string) {
  // Optimistically update UI
  setQuizStatus('live');
  
  try {
    await api.updateEventStatus(eventId, 'live');
  } catch (error) {
    // Rollback on failure
    setQuizStatus('setup');
    showError('Failed to start quiz. Please try again.');
  }
}

// Retry logic for critical operations
async function saveQuizWithRetry(quiz: Event, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await api.saveEvent(quiz);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await delay(1000 * attempt); // Exponential backoff
    }
  }
}
```

---

## Testing Strategy

### Unit Testing

**Components to Test**:
- OrganizerDashboard: Quiz filtering, search, categorization
- SetupMode: Question management, validation, mode transition
- LiveMode: Real-time updates, progress tracking, quiz controls
- QuizCard: Display logic, action handlers
- PrivacySelector: Value changes, disabled state
- TemplateSelector: Template selection, blank quiz creation

**Test Examples**:
```typescript
describe('OrganizerDashboard', () => {
  it('should categorize quizzes correctly', () => {
    const quizzes = [
      { status: 'live', name: 'Quiz 1' },
      { status: 'completed', name: 'Quiz 2' },
      { status: 'setup', name: 'Quiz 3' }
    ];
    
    const categorized = categorizeQuizzes(quizzes);
    
    expect(categorized.live).toHaveLength(1);
    expect(categorized.upcoming).toHaveLength(1);
    expect(categorized.past).toHaveLength(1);
  });
  
  it('should filter quizzes by search query', () => {
    const quizzes = [
      { name: 'Math Quiz' },
      { name: 'Science Quiz' },
      { name: 'History Quiz' }
    ];
    
    const filtered = filterQuizzes(quizzes, 'math');
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Math Quiz');
  });
});

describe('SetupMode', () => {
  it('should prevent starting quiz with no questions', () => {
    const quiz = { questions: [] };
    
    const canStart = validateQuizStart(quiz);
    
    expect(canStart).toBe(false);
  });
  
  it('should allow starting quiz with at least one question', () => {
    const quiz = { 
      questions: [{ text: 'Q1', options: ['A', 'B'] }] 
    };
    
    const canStart = validateQuizStart(quiz);
    
    expect(canStart).toBe(true);
  });
});
```

### Property-Based Testing

**Property Tests**:

```typescript
import fc from 'fast-check';

describe('Property Tests', () => {
  // Property 1: Mode Transition Validity
  it('should only transition to live mode with valid questions', () => {
    fc.assert(
      fc.property(
        fc.record({
          eventId: fc.string(),
          questions: fc.array(fc.record({
            text: fc.string(),
            options: fc.array(fc.string(), { minLength: 2 })
          }))
        }),
        (quiz) => {
          const canTransition = quiz.questions.length > 0;
          const result = attemptModeTransition(quiz, 'live');
          
          if (canTransition) {
            expect(result.success).toBe(true);
            expect(result.status).toBe('live');
          } else {
            expect(result.success).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Property 2: Quiz Categorization Consistency
  it('should categorize quizzes consistently based on status', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          eventId: fc.string(),
          status: fc.constantFrom('draft', 'setup', 'live', 'completed')
        })),
        (quizzes) => {
          const categorized = categorizeQuizzes(quizzes);
          
          // All live quizzes should be in live category
          categorized.live.forEach(quiz => {
            expect(quiz.status).toBe('live');
          });
          
          // All completed quizzes should be in past category
          categorized.past.forEach(quiz => {
            expect(quiz.status).toBe('completed');
          });
          
          // Draft and setup should be in upcoming
          categorized.upcoming.forEach(quiz => {
            expect(['draft', 'setup']).toContain(quiz.status);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Property 3: Privacy Enforcement
  it('should enforce privacy settings correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          eventId: fc.string(),
          visibility: fc.constantFrom('private', 'public'),
          gamePin: fc.string()
        }),
        fc.option(fc.string()), // Provided PIN
        (quiz, providedPin) => {
          const canAccess = checkQuizAccess(quiz, providedPin);
          
          if (quiz.visibility === 'public') {
            expect(canAccess).toBe(true);
          } else {
            // Private quiz requires correct PIN
            expect(canAccess).toBe(providedPin === quiz.gamePin);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Property 4: Template Creation Preservation
  it('should preserve questions when creating from template', () => {
    fc.assert(
      fc.property(
        fc.record({
          templateId: fc.string(),
          questions: fc.array(fc.record({
            text: fc.string(),
            options: fc.array(fc.string())
          }), { minLength: 1 })
        }),
        (template) => {
          const newQuiz = createFromTemplate(template);
          
          // New quiz should have different ID
          expect(newQuiz.eventId).not.toBe(template.templateId);
          
          // But same questions
          expect(newQuiz.questions).toEqual(template.questions);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Property 6: Dashboard Sorting Order
  it('should maintain correct sorting order in dashboard', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          eventId: fc.string(),
          status: fc.constantFrom('draft', 'setup', 'live', 'completed'),
          createdAt: fc.date()
        })),
        (quizzes) => {
          const sorted = sortQuizzesForDashboard(quizzes);
          
          // Find indices of first occurrence of each category
          const firstLive = sorted.findIndex(q => q.status === 'live');
          const firstUpcoming = sorted.findIndex(q => 
            ['draft', 'setup'].includes(q.status)
          );
          const firstPast = sorted.findIndex(q => q.status === 'completed');
          
          // Live should come before upcoming (if both exist)
          if (firstLive !== -1 && firstUpcoming !== -1) {
            expect(firstLive).toBeLessThan(firstUpcoming);
          }
          
          // Upcoming should come before past (if both exist)
          if (firstUpcoming !== -1 && firstPast !== -1) {
            expect(firstUpcoming).toBeLessThan(firstPast);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Test Scenarios**:
1. Complete organizer workflow: Create quiz → Add questions → Start quiz → End quiz
2. Template workflow: Create quiz → Save as template → Create from template
3. Privacy workflow: Create private quiz → Attempt unauthorized access → Verify rejection
4. Dashboard navigation: View dashboard → Select quiz → Edit → Return to dashboard
5. Public quiz discovery: Create public quiz → Search in public browser → Join quiz

---

## Performance Considerations

### Optimization Strategies

1. **Dashboard Loading**
   - Implement pagination for quiz lists (20 per page)
   - Use virtual scrolling for large lists
   - Cache quiz metadata in localStorage
   - Lazy load quiz details on demand

2. **Real-time Updates**
   - Use WebSocket connections for live quiz updates
   - Implement debouncing for rapid state changes
   - Batch multiple updates into single renders

3. **Template Loading**
   - Preload popular templates
   - Implement template preview caching
   - Use lazy loading for template images

4. **Search and Filter**
   - Implement client-side filtering for small datasets (<100 items)
   - Use server-side search for large datasets
   - Debounce search input (300ms delay)

### Performance Targets

- Dashboard initial load: < 2 seconds
- Mode transition: < 500ms
- Search results: < 300ms
- Template creation: < 1 second
- Quiz list update: < 100ms

---

## Security Considerations

### Access Control

```typescript
// Middleware for organizer-only routes
async function requireOrganizer(req, res, next) {
  const { eventId } = req.params;
  const { userId } = req.user;
  
  const event = await eventRepository.getEvent(eventId);
  
  if (event.organizerId !== userId) {
    return res.status(403).json({ 
      error: 'Unauthorized: Not the quiz organizer' 
    });
  }
  
  next();
}

// Privacy check for quiz access
async function checkQuizAccess(eventId: string, userId: string, gamePin?: string) {
  const event = await eventRepository.getEvent(eventId);
  
  // Organizer always has access
  if (event.organizerId === userId) {
    return true;
  }
  
  // Public quizzes are accessible to all
  if (event.visibility === 'public') {
    return true;
  }
  
  // Private quizzes require correct PIN
  return event.gamePin === gamePin;
}
```

### Data Validation

```typescript
// Validate quiz before mode transition
function validateQuizForLive(quiz: Event): ValidationResult {
  const errors: string[] = [];
  
  if (!quiz.questions || quiz.questions.length === 0) {
    errors.push('Quiz must have at least one question');
  }
  
  quiz.questions.forEach((q, index) => {
    if (!q.text || q.text.trim() === '') {
      errors.push(`Question ${index + 1} is missing text`);
    }
    
    if (!q.options || q.options.length < 2) {
      errors.push(`Question ${index + 1} must have at least 2 options`);
    }
    
    const hasCorrectAnswer = q.options.some(opt => opt.isCorrect);
    if (!hasCorrectAnswer) {
      errors.push(`Question ${index + 1} must have a correct answer`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Migration Strategy

### Database Migration

```typescript
// Add new fields to existing events
async function migrateEvents() {
  const events = await eventRepository.getAllEvents();
  
  for (const event of events) {
    // Set default values for new fields
    const updated = {
      ...event,
      status: event.status || 'completed', // Assume old events are completed
      visibility: 'private', // Default to private for existing quizzes
      isTemplate: false,
      lastModified: event.createdAt,
      participantCount: 0 // Will be calculated from participants table
    };
    
    await eventRepository.updateEvent(updated);
  }
}
```

### Backward Compatibility

- Existing API endpoints remain functional
- New fields are optional in API requests
- Old clients can continue using existing functionality
- Gradual rollout of new features with feature flags

---

## Deployment Plan

### Phase 1: Backend Updates
1. Deploy new API endpoints for templates and history
2. Add new fields to Event model
3. Implement privacy and status management
4. Deploy with feature flags disabled

### Phase 2: Frontend Updates
1. Deploy new dashboard component
2. Add setup/live mode components
3. Implement template selector
4. Enable feature flags for testing

### Phase 3: Data Migration
1. Run migration script for existing events
2. Verify data integrity
3. Monitor for issues

### Phase 4: Full Rollout
1. Enable features for all users
2. Monitor performance and errors
3. Gather user feedback
4. Iterate on improvements

---

**This design provides a comprehensive foundation for implementing the organizer UX improvements while maintaining system stability and user experience quality.**
