/**
 * Scoring Engine - Calculate participant scores and generate leaderboards
 */
import {
  Participant,
  ParticipantScore,
  Question,
  Answer,
  AnswerStatistics,
} from '../types/models.js';

/**
 * Calculate speed-based points for an answer
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 * 
 * Awards points based on correctness and response time:
 * - Incorrect answers: 0 points
 * - Correct answers in first 25% of time: 1000 points (maximum)
 * - Correct answers after 25%: Linear decrease from 1000 to 500 points
 * - Minimum points for any correct answer: 500 points
 * 
 * @param isCorrect - Whether the answer is correct
 * @param responseTime - Time taken to answer in milliseconds
 * @param timerSeconds - Total time allowed for the question in seconds
 * @returns Points earned (0 for incorrect, 500-1000 for correct)
 */
export function calculatePoints(
  isCorrect: boolean,
  responseTime: number,
  timerSeconds: number
): number {
  // Incorrect answers get 0 points
  if (!isCorrect) {
    return 0;
  }

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
  const points = maxPoints - pointRange * timeRatio;

  // Ensure minimum points for correct answers
  return Math.max(minPoints, Math.round(points));
}

/**
 * Check if an answer is correct and return points to award
 * Requirements: 6.1, 6.2
 * 
 * @param selectedOptionId - The option ID selected by the participant
 * @param correctOptionId - The correct option ID from the question
 * @returns 1 point if correct, 0 points if incorrect
 * @deprecated Use calculatePoints for speed-based scoring
 */
export function calculateAnswerPoints(
  selectedOptionId: string,
  correctOptionId: string
): number {
  return selectedOptionId === correctOptionId ? 1 : 0;
}

/**
 * Check if an answer is correct
 * Requirements: 6.1, 6.2
 * 
 * @param selectedOptionId - The option ID selected by the participant
 * @param question - The question object containing the correct answer
 * @returns true if correct, false if incorrect
 */
export function isAnswerCorrect(
  selectedOptionId: string,
  question: Question
): boolean {
  return selectedOptionId === question.correctOptionId;
}

/**
 * Calculate total answer time for a participant
 * Requirements: 6.3
 * 
 * @param currentTotalTime - Current total answer time in milliseconds
 * @param responseTime - Response time for the current answer in milliseconds
 * @returns Updated total answer time in milliseconds
 */
export function calculateTotalAnswerTime(
  currentTotalTime: number,
  responseTime: number
): number {
  return currentTotalTime + responseTime;
}

/**
 * Update participant score based on answer correctness
 * Requirements: 6.1, 6.2, 6.3
 * 
 * @param currentScore - Current participant score
 * @param currentTotalTime - Current total answer time in milliseconds
 * @param isCorrect - Whether the answer is correct
 * @param responseTime - Response time for the answer in milliseconds
 * @returns Object with updated score and totalAnswerTime
 */
export function updateParticipantScore(
  currentScore: number,
  currentTotalTime: number,
  isCorrect: boolean,
  responseTime: number
): { score: number; totalAnswerTime: number } {
  return {
    score: isCorrect ? currentScore + 1 : currentScore,
    totalAnswerTime: currentTotalTime + responseTime,
  };
}

/**
 * Calculate leaderboard from participants
 * Requirements: 6.4, 6.5, 7.4
 * 
 * Sorting rules:
 * 1. Primary: Sort by score (descending)
 * 2. Secondary: Sort by total answer time (ascending)
 * 3. Tertiary: Sort alphabetically by name
 * 
 * @param participants - Array of participants with scores and times
 * @returns Sorted array of participant scores with ranks
 */
export function calculateLeaderboard(
  participants: Participant[]
): ParticipantScore[] {
  return participants
    .map(p => ({
      rank: 0,
      name: p.name,
      score: p.score,
      totalAnswerTime: p.totalAnswerTime,
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
      rank: index + 1,
    }));
}

/**
 * Generate leaderboard after a question
 * Requirements: 6.4, 7.4
 * 
 * This is a convenience function that wraps calculateLeaderboard
 * for use after each question is completed.
 * 
 * @param participants - Array of participants
 * @returns Sorted leaderboard with ranks
 */
export function generateLeaderboardAfterQuestion(
  participants: Participant[]
): ParticipantScore[] {
  return calculateLeaderboard(participants);
}

/**
 * Calculate answer statistics for a question
 * Requirements: 14.1, 14.2
 * 
 * Calculates the distribution of answers across all options:
 * - Counts how many participants selected each option
 * - Calculates the percentage for each option
 * - Includes the correct answer ID for highlighting
 * 
 * @param questionId - The question ID
 * @param answers - Array of all answers submitted for this question
 * @param correctOptionId - The correct option ID from the question
 * @returns AnswerStatistics object with counts and percentages
 */
export function calculateAnswerStatistics(
  questionId: string,
  answers: Answer[],
  correctOptionId: string
): AnswerStatistics {
  const totalResponses = answers.length;
  const optionCounts: {
    [optionId: string]: {
      count: number;
      percentage: number;
    };
  } = {};

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
      totalResponses > 0
        ? (optionCounts[optionId].count / totalResponses) * 100
        : 0;
  });

  return {
    questionId,
    totalResponses,
    optionCounts,
    correctOptionId,
  };
}

/**
 * Calculate top 3 participants for podium display
 * Requirements: 16.6
 * 
 * Extracts the top 3 participants from the final leaderboard.
 * Handles cases with fewer than 3 participants by returning only available participants.
 * 
 * @param leaderboard - Sorted leaderboard array
 * @returns Array of top 3 participants (or fewer if less than 3 participants)
 */
export function calculateTopThree(
  leaderboard: ParticipantScore[]
): ParticipantScore[] {
  // Return top 3 participants, or all if fewer than 3
  return leaderboard.slice(0, 3);
}

/**
 * Update participant streak based on answer correctness
 * Requirements: 18.1, 18.2, 18.3
 * 
 * Streak tracking rules:
 * - Correct answer: Increment currentStreak by 1
 * - Incorrect answer: Reset currentStreak to 0
 * - Update longestStreak if currentStreak exceeds it
 * 
 * @param participant - The participant object to update
 * @param isCorrect - Whether the answer is correct
 * @returns Object with updated currentStreak and longestStreak
 */
export function updateStreak(
  participant: Participant,
  isCorrect: boolean
): { currentStreak: number; longestStreak: number } {
  let currentStreak: number;
  let longestStreak: number;

  if (isCorrect) {
    // Increment streak on correct answer
    currentStreak = participant.currentStreak + 1;
    // Update longest streak if current exceeds it
    longestStreak = Math.max(participant.longestStreak, currentStreak);
  } else {
    // Reset streak to 0 on incorrect answer
    currentStreak = 0;
    // Longest streak remains unchanged
    longestStreak = participant.longestStreak;
  }

  return {
    currentStreak,
    longestStreak,
  };
}
