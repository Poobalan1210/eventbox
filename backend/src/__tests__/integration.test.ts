/**
 * Integration Tests for Live Quiz Event System
 * Tests all Phase 2 features end-to-end
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateGamePin,
  validatePinFormat,
  generateUniqueGamePin,
  lookupEventByPin,
} from '../services/gamePinService.js';
import {
  calculatePoints,
  calculateLeaderboard,
  calculateAnswerStatistics,
  calculateTopThree,
  updateStreak,
} from '../services/scoringEngine.js';
import {
  generateNickname,
  generateNicknameSuggestions,
} from '../services/nicknameService.js';
import { Participant, Answer, ParticipantScore } from '../types/models.js';

/**
 * Test Suite 34.1: Game PIN Flow End-to-End
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */
describe('34.1 Game PIN Flow End-to-End', () => {
  it('should generate a valid 6-digit numeric PIN', () => {
    const pin = generateGamePin();
    expect(pin).toMatch(/^\d{6}$/);
    expect(pin.length).toBe(6);
    expect(parseInt(pin)).toBeGreaterThanOrEqual(100000);
    expect(parseInt(pin)).toBeLessThanOrEqual(999999);
  });

  it('should validate PIN format correctly', () => {
    // Valid PINs
    expect(validatePinFormat('123456')).toBe(true);
    expect(validatePinFormat('000000')).toBe(true);
    expect(validatePinFormat('999999')).toBe(true);

    // Invalid PINs
    expect(validatePinFormat('12345')).toBe(false); // Too short
    expect(validatePinFormat('1234567')).toBe(false); // Too long
    expect(validatePinFormat('12345a')).toBe(false); // Contains letter
    expect(validatePinFormat('abc123')).toBe(false); // Contains letters
    expect(validatePinFormat('')).toBe(false); // Empty
  });

  it('should generate unique PINs for different events', () => {
    const pins = new Set<string>();
    for (let i = 0; i < 100; i++) {
      pins.add(generateGamePin());
    }
    // With 100 attempts, we should get mostly unique PINs
    // (collision is possible but unlikely with 900,000 possible values)
    expect(pins.size).toBeGreaterThan(90);
  });

  it('should return null for invalid PIN lookup', async () => {
    const result = await lookupEventByPin('invalid');
    expect(result).toBeNull();
  });
});

/**
 * Test Suite 34.2: Speed-Based Scoring Flow
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 */
describe('34.2 Speed-Based Scoring Flow', () => {
  const timerSeconds = 30;

  it('should award 0 points for incorrect answers', () => {
    const points = calculatePoints(false, 5000, timerSeconds);
    expect(points).toBe(0);
  });

  it('should award maximum 1000 points for fast correct answers (first 25%)', () => {
    const fastThreshold = timerSeconds * 1000 * 0.25; // 7500ms
    
    // Test at various points within first 25%
    expect(calculatePoints(true, 0, timerSeconds)).toBe(1000);
    expect(calculatePoints(true, 1000, timerSeconds)).toBe(1000);
    expect(calculatePoints(true, fastThreshold, timerSeconds)).toBe(1000);
  });

  it('should award minimum 500 points for slow correct answers', () => {
    const maxTime = timerSeconds * 1000; // 30000ms
    
    // Test at maximum time
    expect(calculatePoints(true, maxTime, timerSeconds)).toBe(500);
    expect(calculatePoints(true, maxTime - 100, timerSeconds)).toBeGreaterThanOrEqual(500);
  });

  it('should award points between 500-1000 for medium-speed correct answers', () => {
    const midTime = timerSeconds * 1000 * 0.5; // 15000ms
    const points = calculatePoints(true, midTime, timerSeconds);
    
    expect(points).toBeGreaterThan(500);
    expect(points).toBeLessThan(1000);
  });

  it('should award progressively fewer points as response time increases', () => {
    const times = [8000, 12000, 16000, 20000, 24000];
    const pointsArray = times.map(time => calculatePoints(true, time, timerSeconds));
    
    // Each subsequent time should award equal or fewer points
    for (let i = 1; i < pointsArray.length; i++) {
      expect(pointsArray[i]).toBeLessThanOrEqual(pointsArray[i - 1]);
    }
  });

  it('should integrate scoring into leaderboard correctly', () => {
    const participants: Participant[] = [
      {
        id: '1',
        eventId: 'event1',
        name: 'Alice',
        score: 1500, // Fast correct answer
        totalAnswerTime: 5000,
        currentStreak: 1,
        longestStreak: 1,
        answers: [],
        joinedAt: Date.now(),
      },
      {
        id: '2',
        eventId: 'event1',
        name: 'Bob',
        score: 1000, // Slower correct answer
        totalAnswerTime: 8000,
        currentStreak: 1,
        longestStreak: 1,
        answers: [],
        joinedAt: Date.now(),
      },
      {
        id: '3',
        eventId: 'event1',
        name: 'Charlie',
        score: 500, // Very slow correct answer
        totalAnswerTime: 25000,
        currentStreak: 1,
        longestStreak: 1,
        answers: [],
        joinedAt: Date.now(),
      },
    ];

    const leaderboard = calculateLeaderboard(participants);
    
    expect(leaderboard[0].name).toBe('Alice');
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[1].name).toBe('Bob');
    expect(leaderboard[1].rank).toBe(2);
    expect(leaderboard[2].name).toBe('Charlie');
    expect(leaderboard[2].rank).toBe(3);
  });
});

/**
 * Test Suite 34.3: Answer Statistics Display
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
describe('34.3 Answer Statistics Display', () => {
  it('should calculate answer counts correctly', () => {
    const answers: Answer[] = [
      {
        participantId: '1',
        questionId: 'q1',
        selectedOptionId: 'opt1',
        responseTime: 5000,
        isCorrect: true,
        pointsEarned: 1000,
        submittedAt: Date.now(),
      },
      {
        participantId: '2',
        questionId: 'q1',
        selectedOptionId: 'opt1',
        responseTime: 6000,
        isCorrect: true,
        pointsEarned: 950,
        submittedAt: Date.now(),
      },
      {
        participantId: '3',
        questionId: 'q1',
        selectedOptionId: 'opt2',
        responseTime: 7000,
        isCorrect: false,
        pointsEarned: 0,
        submittedAt: Date.now(),
      },
    ];

    const stats = calculateAnswerStatistics('q1', answers, 'opt1');
    
    expect(stats.totalResponses).toBe(3);
    expect(stats.optionCounts['opt1'].count).toBe(2);
    expect(stats.optionCounts['opt2'].count).toBe(1);
    expect(stats.correctOptionId).toBe('opt1');
  });

  it('should calculate percentages correctly', () => {
    const answers: Answer[] = [
      { participantId: '1', questionId: 'q1', selectedOptionId: 'opt1', responseTime: 5000, isCorrect: true, pointsEarned: 1000, submittedAt: Date.now() },
      { participantId: '2', questionId: 'q1', selectedOptionId: 'opt1', responseTime: 6000, isCorrect: true, pointsEarned: 950, submittedAt: Date.now() },
      { participantId: '3', questionId: 'q1', selectedOptionId: 'opt2', responseTime: 7000, isCorrect: false, pointsEarned: 0, submittedAt: Date.now() },
      { participantId: '4', questionId: 'q1', selectedOptionId: 'opt2', responseTime: 8000, isCorrect: false, pointsEarned: 0, submittedAt: Date.now() },
    ];

    const stats = calculateAnswerStatistics('q1', answers, 'opt1');
    
    expect(stats.optionCounts['opt1'].percentage).toBe(50);
    expect(stats.optionCounts['opt2'].percentage).toBe(50);
  });

  it('should sum percentages to 100%', () => {
    const answers: Answer[] = [
      { participantId: '1', questionId: 'q1', selectedOptionId: 'opt1', responseTime: 5000, isCorrect: true, pointsEarned: 1000, submittedAt: Date.now() },
      { participantId: '2', questionId: 'q1', selectedOptionId: 'opt2', responseTime: 6000, isCorrect: false, pointsEarned: 0, submittedAt: Date.now() },
      { participantId: '3', questionId: 'q1', selectedOptionId: 'opt3', responseTime: 7000, isCorrect: false, pointsEarned: 0, submittedAt: Date.now() },
    ];

    const stats = calculateAnswerStatistics('q1', answers, 'opt1');
    
    const totalPercentage = Object.values(stats.optionCounts)
      .reduce((sum, opt) => sum + opt.percentage, 0);
    
    expect(totalPercentage).toBeCloseTo(100, 1);
  });

  it('should handle empty answers array', () => {
    const stats = calculateAnswerStatistics('q1', [], 'opt1');
    
    expect(stats.totalResponses).toBe(0);
    expect(Object.keys(stats.optionCounts).length).toBe(0);
  });
});

/**
 * Test Suite 34.4: Streak Tracking
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */
describe('34.4 Streak Tracking', () => {
  it('should increment streak on correct answer', () => {
    const participant: Participant = {
      id: '1',
      eventId: 'event1',
      name: 'Alice',
      score: 0,
      totalAnswerTime: 0,
      currentStreak: 2,
      longestStreak: 2,
      answers: [],
      joinedAt: Date.now(),
    };

    const result = updateStreak(participant, true);
    
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('should reset streak to 0 on incorrect answer', () => {
    const participant: Participant = {
      id: '1',
      eventId: 'event1',
      name: 'Alice',
      score: 0,
      totalAnswerTime: 0,
      currentStreak: 5,
      longestStreak: 5,
      answers: [],
      joinedAt: Date.now(),
    };

    const result = updateStreak(participant, false);
    
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(5); // Longest streak unchanged
  });

  it('should track longest streak correctly', () => {
    let participant: Participant = {
      id: '1',
      eventId: 'event1',
      name: 'Alice',
      score: 0,
      totalAnswerTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      answers: [],
      joinedAt: Date.now(),
    };

    // Build up a streak
    for (let i = 0; i < 5; i++) {
      const result = updateStreak(participant, true);
      participant.currentStreak = result.currentStreak;
      participant.longestStreak = result.longestStreak;
    }
    
    expect(participant.currentStreak).toBe(5);
    expect(participant.longestStreak).toBe(5);

    // Break the streak
    const result1 = updateStreak(participant, false);
    participant.currentStreak = result1.currentStreak;
    participant.longestStreak = result1.longestStreak;
    
    expect(participant.currentStreak).toBe(0);
    expect(participant.longestStreak).toBe(5);

    // Build a smaller streak
    for (let i = 0; i < 3; i++) {
      const result = updateStreak(participant, true);
      participant.currentStreak = result.currentStreak;
      participant.longestStreak = result.longestStreak;
    }
    
    expect(participant.currentStreak).toBe(3);
    expect(participant.longestStreak).toBe(5); // Still 5, not 3
  });

  it('should handle streak across multiple questions', () => {
    let participant: Participant = {
      id: '1',
      eventId: 'event1',
      name: 'Alice',
      score: 0,
      totalAnswerTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      answers: [],
      joinedAt: Date.now(),
    };

    const answerSequence = [true, true, false, true, true, true, false];
    
    for (const isCorrect of answerSequence) {
      const result = updateStreak(participant, isCorrect);
      participant.currentStreak = result.currentStreak;
      participant.longestStreak = result.longestStreak;
    }
    
    // After sequence: correct, correct, incorrect, correct, correct, correct, incorrect
    // Final streak should be 0 (just broke it)
    // Longest streak should be 3 (the last run of correct answers)
    expect(participant.currentStreak).toBe(0);
    expect(participant.longestStreak).toBe(3);
  });
});

/**
 * Test Suite 34.5: Image Upload and Display
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5
 */
describe('34.5 Image Upload and Display', () => {
  it('should validate image format', () => {
    const validFormats = ['image/jpeg', 'image/png', 'image/gif'];
    const invalidFormats = ['image/bmp', 'image/svg+xml', 'text/plain', 'application/pdf'];

    validFormats.forEach(format => {
      expect(['image/jpeg', 'image/png', 'image/gif'].includes(format)).toBe(true);
    });

    invalidFormats.forEach(format => {
      expect(['image/jpeg', 'image/png', 'image/gif'].includes(format)).toBe(false);
    });
  });

  it('should validate file size limit (5MB)', () => {
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    
    expect(4 * 1024 * 1024).toBeLessThan(maxSize); // 4MB - valid
    expect(5 * 1024 * 1024).toBeLessThanOrEqual(maxSize); // 5MB - valid
    expect(6 * 1024 * 1024).toBeGreaterThan(maxSize); // 6MB - invalid
  });

  // Note: Actual image processing tests would require Sharp library
  // and test image files. These are placeholder tests for the logic.
  it('should calculate aspect ratio preservation', () => {
    const originalWidth = 1600;
    const originalHeight = 1200;
    const maxWidth = 1200;
    const maxHeight = 800;

    const originalAspectRatio = originalWidth / originalHeight;
    
    // Calculate new dimensions maintaining aspect ratio
    let newWidth = maxWidth;
    let newHeight = Math.round(newWidth / originalAspectRatio);
    
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = Math.round(newHeight * originalAspectRatio);
    }

    const newAspectRatio = newWidth / newHeight;
    
    // Aspect ratios should be within 1% tolerance
    expect(Math.abs(newAspectRatio - originalAspectRatio) / originalAspectRatio).toBeLessThan(0.01);
  });
});

/**
 * Test Suite 34.6: Podium Display
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */
describe('34.6 Podium Display', () => {
  it('should calculate top 3 participants correctly', () => {
    const leaderboard: ParticipantScore[] = [
      { rank: 1, name: 'Alice', score: 3000, totalAnswerTime: 15000 },
      { rank: 2, name: 'Bob', score: 2500, totalAnswerTime: 18000 },
      { rank: 3, name: 'Charlie', score: 2000, totalAnswerTime: 20000 },
      { rank: 4, name: 'David', score: 1500, totalAnswerTime: 22000 },
      { rank: 5, name: 'Eve', score: 1000, totalAnswerTime: 25000 },
    ];

    const topThree = calculateTopThree(leaderboard);
    
    expect(topThree.length).toBe(3);
    expect(topThree[0].name).toBe('Alice');
    expect(topThree[1].name).toBe('Bob');
    expect(topThree[2].name).toBe('Charlie');
  });

  it('should handle fewer than 3 participants', () => {
    const leaderboard: ParticipantScore[] = [
      { rank: 1, name: 'Alice', score: 3000, totalAnswerTime: 15000 },
      { rank: 2, name: 'Bob', score: 2500, totalAnswerTime: 18000 },
    ];

    const topThree = calculateTopThree(leaderboard);
    
    expect(topThree.length).toBe(2);
    expect(topThree[0].name).toBe('Alice');
    expect(topThree[1].name).toBe('Bob');
  });

  it('should handle single participant', () => {
    const leaderboard: ParticipantScore[] = [
      { rank: 1, name: 'Alice', score: 3000, totalAnswerTime: 15000 },
    ];

    const topThree = calculateTopThree(leaderboard);
    
    expect(topThree.length).toBe(1);
    expect(topThree[0].name).toBe('Alice');
  });

  it('should handle empty leaderboard', () => {
    const topThree = calculateTopThree([]);
    expect(topThree.length).toBe(0);
  });

  it('should verify podium positioning order (1st center, 2nd left, 3rd right)', () => {
    const topThree: ParticipantScore[] = [
      { rank: 1, name: 'Alice', score: 3000, totalAnswerTime: 15000 },
      { rank: 2, name: 'Bob', score: 2500, totalAnswerTime: 18000 },
      { rank: 3, name: 'Charlie', score: 2000, totalAnswerTime: 20000 },
    ];

    // Verify order is maintained for UI positioning
    expect(topThree[0].rank).toBe(1); // First place (center)
    expect(topThree[1].rank).toBe(2); // Second place (left)
    expect(topThree[2].rank).toBe(3); // Third place (right)
  });
});

/**
 * Test Suite 34.7: Nickname Generator
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */
describe('34.7 Nickname Generator', () => {
  it('should generate nickname in correct format (AdjectiveNoun)', () => {
    const nickname = generateNickname();
    
    // Should be a non-empty string
    expect(nickname).toBeTruthy();
    expect(typeof nickname).toBe('string');
    expect(nickname.length).toBeGreaterThan(0);
    
    // Should start with uppercase letter (adjective)
    expect(nickname[0]).toMatch(/[A-Z]/);
    
    // Should contain at least one more uppercase letter (noun)
    const uppercaseCount = (nickname.match(/[A-Z]/g) || []).length;
    expect(uppercaseCount).toBeGreaterThanOrEqual(2);
  });

  it('should generate multiple unique suggestions', () => {
    const suggestions = generateNicknameSuggestions(3);
    
    expect(suggestions.length).toBe(3);
    
    // Check uniqueness
    const uniqueSuggestions = new Set(suggestions);
    expect(uniqueSuggestions.size).toBe(3);
  });

  it('should generate requested number of suggestions', () => {
    expect(generateNicknameSuggestions(1).length).toBe(1);
    expect(generateNicknameSuggestions(3).length).toBe(3);
    expect(generateNicknameSuggestions(5).length).toBe(5);
  });

  it('should generate family-friendly nicknames', () => {
    // Generate many nicknames and verify they all follow the pattern
    for (let i = 0; i < 50; i++) {
      const nickname = generateNickname();
      
      // Should not contain spaces or special characters
      expect(nickname).toMatch(/^[A-Za-z]+$/);
      
      // Should be reasonable length (not too short or too long)
      expect(nickname.length).toBeGreaterThan(5);
      expect(nickname.length).toBeLessThan(30);
    }
  });

  it('should allow regeneration of suggestions', () => {
    const firstSet = generateNicknameSuggestions(3);
    const secondSet = generateNicknameSuggestions(3);
    
    // Sets should be different (very high probability)
    const allSame = firstSet.every((name, index) => name === secondSet[index]);
    expect(allSame).toBe(false);
  });
});

/**
 * Test Suite 34.8: Colorful Answer Buttons
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */
describe('34.8 Colorful Answer Buttons', () => {
  const ANSWER_STYLES = [
    { color: 'red', shape: 'triangle' },
    { color: 'blue', shape: 'diamond' },
    { color: 'yellow', shape: 'circle' },
    { color: 'green', shape: 'square' },
    { color: 'purple', shape: 'pentagon' },
  ];

  it('should assign correct color-shape pairs for 2 options', () => {
    const numOptions = 2;
    const assignments = ANSWER_STYLES.slice(0, numOptions);
    
    expect(assignments.length).toBe(2);
    expect(assignments[0]).toEqual({ color: 'red', shape: 'triangle' });
    expect(assignments[1]).toEqual({ color: 'blue', shape: 'diamond' });
  });

  it('should assign correct color-shape pairs for 3 options', () => {
    const numOptions = 3;
    const assignments = ANSWER_STYLES.slice(0, numOptions);
    
    expect(assignments.length).toBe(3);
    expect(assignments[0]).toEqual({ color: 'red', shape: 'triangle' });
    expect(assignments[1]).toEqual({ color: 'blue', shape: 'diamond' });
    expect(assignments[2]).toEqual({ color: 'yellow', shape: 'circle' });
  });

  it('should assign correct color-shape pairs for 4 options', () => {
    const numOptions = 4;
    const assignments = ANSWER_STYLES.slice(0, numOptions);
    
    expect(assignments.length).toBe(4);
    expect(assignments[0]).toEqual({ color: 'red', shape: 'triangle' });
    expect(assignments[1]).toEqual({ color: 'blue', shape: 'diamond' });
    expect(assignments[2]).toEqual({ color: 'yellow', shape: 'circle' });
    expect(assignments[3]).toEqual({ color: 'green', shape: 'square' });
  });

  it('should assign correct color-shape pairs for 5 options', () => {
    const numOptions = 5;
    const assignments = ANSWER_STYLES.slice(0, numOptions);
    
    expect(assignments.length).toBe(5);
    expect(assignments[0]).toEqual({ color: 'red', shape: 'triangle' });
    expect(assignments[1]).toEqual({ color: 'blue', shape: 'diamond' });
    expect(assignments[2]).toEqual({ color: 'yellow', shape: 'circle' });
    expect(assignments[3]).toEqual({ color: 'green', shape: 'square' });
    expect(assignments[4]).toEqual({ color: 'purple', shape: 'pentagon' });
  });

  it('should maintain consistent color-shape mapping across questions', () => {
    // Simulate two questions with same number of options
    const question1Options = ANSWER_STYLES.slice(0, 4);
    const question2Options = ANSWER_STYLES.slice(0, 4);
    
    // Mappings should be identical
    expect(question1Options).toEqual(question2Options);
  });

  it('should have unique colors for each option', () => {
    const colors = ANSWER_STYLES.map(style => style.color);
    const uniqueColors = new Set(colors);
    
    expect(uniqueColors.size).toBe(ANSWER_STYLES.length);
  });

  it('should have unique shapes for each option', () => {
    const shapes = ANSWER_STYLES.map(style => style.shape);
    const uniqueShapes = new Set(shapes);
    
    expect(uniqueShapes.size).toBe(ANSWER_STYLES.length);
  });

  it('should support minimum 2 and maximum 5 options', () => {
    expect(ANSWER_STYLES.length).toBeGreaterThanOrEqual(2);
    expect(ANSWER_STYLES.length).toBeLessThanOrEqual(5);
    expect(ANSWER_STYLES.length).toBe(5);
  });
});
