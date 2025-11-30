/**
 * QuizActivityService - Handles quiz-specific activity operations
 * This service manages quiz activities within events, including question management,
 * quiz lifecycle (start, next question, end), and answer submission.
 */
import { QuestionRepository } from '../db/repositories/QuestionRepository.js';
import { AnswerRepository } from '../db/repositories/AnswerRepository.js';
import { ParticipantRepository } from '../db/repositories/ParticipantRepository.js';
import { ActivityRepository } from '../db/repositories/ActivityRepository.js';
import { Question, Answer } from '../types/models.js';
import {
  isAnswerCorrect,
  calculatePoints,
  updateStreak,
  calculateLeaderboard,
  generateLeaderboardAfterQuestion,
  calculateAnswerStatistics,
  calculateTopThree,
} from './scoringEngine.js';

export interface AnswerResult {
  isCorrect: boolean;
  pointsEarned: number;
  correctOptionId: string;
  currentStreak: number;
}

export interface QuizResults {
  finalLeaderboard: any[];
  topThree: any[];
  participantCount: number;
}

export class QuizActivityService {
  private questionRepo: QuestionRepository;
  private answerRepo: AnswerRepository;
  private participantRepo: ParticipantRepository;
  private activityRepo: ActivityRepository;

  constructor() {
    this.questionRepo = new QuestionRepository();
    this.answerRepo = new AnswerRepository();
    this.participantRepo = new ParticipantRepository();
    this.activityRepo = new ActivityRepository();
  }

  /**
   * Add a question to a quiz activity
   */
  async addQuestion(activityId: string, question: Omit<Question, 'id' | 'questionId'>): Promise<Question> {
    // Get the activity to verify it exists and is a quiz
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }
    if (activity.type !== 'quiz') {
      throw new Error('Activity is not a quiz');
    }

    // Generate question ID
    const questionId = `question-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const fullQuestion: Question = {
      ...question,
      id: questionId,
      questionId,
    };

    return await this.questionRepo.addQuestion(fullQuestion);
  }

  /**
   * Update a question in a quiz activity
   */
  async updateQuestion(
    activityId: string,
    questionId: string,
    updates: Partial<Omit<Question, 'id' | 'eventId' | 'questionId'>>
  ): Promise<void> {
    // Get the activity to verify it exists and is a quiz
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }
    if (activity.type !== 'quiz') {
      throw new Error('Activity is not a quiz');
    }

    // For now, we still use eventId in the question repository
    // This will be updated when we migrate questions to use activityId
    await this.questionRepo.updateQuestion(activity.eventId, questionId, updates);
  }

  /**
   * Delete a question from a quiz activity
   */
  async deleteQuestion(activityId: string, questionId: string): Promise<void> {
    // Get the activity to verify it exists and is a quiz
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }
    if (activity.type !== 'quiz') {
      throw new Error('Activity is not a quiz');
    }

    await this.questionRepo.deleteQuestion(activity.eventId, questionId);
  }

  /**
   * Start a quiz activity
   */
  async startQuiz(activityId: string): Promise<void> {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }
    if (activity.type !== 'quiz') {
      throw new Error('Activity is not a quiz');
    }

    // Update activity status to active
    await this.activityRepo.setStatus(activityId, 'active');
  }

  /**
   * Get the next question in a quiz activity
   */
  async nextQuestion(activityId: string, questionId: string): Promise<Question> {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }
    if (activity.type !== 'quiz') {
      throw new Error('Activity is not a quiz');
    }

    // Get the question
    const question = await this.questionRepo.getQuestion(activity.eventId, questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    return question;
  }

  /**
   * Get all questions for a quiz activity
   */
  async getQuestions(activityId: string): Promise<Question[]> {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }
    if (activity.type !== 'quiz') {
      throw new Error('Activity is not a quiz');
    }

    return await this.questionRepo.getQuestions(activity.eventId);
  }

  /**
   * Submit an answer to a quiz question
   */
  async submitAnswer(
    activityId: string,
    participantId: string,
    questionId: string,
    answerId: string,
    responseTime: number
  ): Promise<AnswerResult> {
    // Get the activity
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }
    if (activity.type !== 'quiz') {
      throw new Error('Activity is not a quiz');
    }

    const eventId = activity.eventId;

    // Validate input
    if (!questionId || !answerId || responseTime < 0) {
      throw new Error('Invalid answer submission data');
    }

    // Get the question to check if answer is correct
    const question = await this.questionRepo.getQuestion(eventId, questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // Validate that the answerId is one of the valid options
    const validAnswerIds = question.options.map(opt => opt.id);
    if (!validAnswerIds.includes(answerId)) {
      throw new Error('Invalid answer option');
    }

    // Use scoring engine to check if answer is correct
    const correct = isAnswerCorrect(answerId, question);

    // Calculate speed-based points
    const timerSeconds = question.timerSeconds || 30;
    const pointsEarned = calculatePoints(correct, responseTime, timerSeconds);

    // Save the answer
    const answer: Answer = {
      participantId,
      questionId,
      eventId,
      selectedOptionId: answerId,
      responseTime,
      isCorrect: correct,
      pointsEarned,
      submittedAt: Date.now(),
    };

    try {
      await this.answerRepo.saveAnswer(answer);
    } catch (error: any) {
      // Handle duplicate submission
      if (error.message === 'Answer already submitted for this question') {
        throw new Error('Answer already submitted for this question');
      }
      throw error;
    }

    // Get participant and update score
    const participant = await this.participantRepo.getParticipant(eventId, participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    // Update participant score with points earned
    const newScore = participant.score + pointsEarned;
    const newTotalAnswerTime = participant.totalAnswerTime + responseTime;

    await this.participantRepo.updateParticipantScore(
      eventId,
      participantId,
      newScore,
      newTotalAnswerTime
    );

    // Update streak tracking
    const streakUpdate = updateStreak(participant, correct);
    await this.participantRepo.updateParticipantStreak(
      eventId,
      participantId,
      streakUpdate.currentStreak,
      streakUpdate.longestStreak
    );

    return {
      isCorrect: correct,
      pointsEarned,
      correctOptionId: question.correctOptionId,
      currentStreak: streakUpdate.currentStreak,
    };
  }

  /**
   * End a quiz activity
   */
  async endQuiz(activityId: string): Promise<QuizResults> {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }
    if (activity.type !== 'quiz') {
      throw new Error('Activity is not a quiz');
    }

    const eventId = activity.eventId;

    // Get final leaderboard and participant count
    const participants = await this.participantRepo.getParticipants(eventId);
    const finalLeaderboard = calculateLeaderboard(participants);
    const participantCount = participants.length;

    // Calculate top 3 for podium display
    const topThree = calculateTopThree(finalLeaderboard);

    // Update activity status to completed
    await this.activityRepo.setStatus(activityId, 'completed');

    return {
      finalLeaderboard,
      topThree,
      participantCount,
    };
  }

  /**
   * Get answer statistics for a question
   */
  async getAnswerStatistics(activityId: string, questionId: string): Promise<any> {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }
    if (activity.type !== 'quiz') {
      throw new Error('Activity is not a quiz');
    }

    const eventId = activity.eventId;

    // Get the question to get the correct answer ID
    const question = await this.questionRepo.getQuestion(eventId, questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // Get all answers for this question
    const answers = await this.answerRepo.getAnswersByQuestion(eventId, questionId);

    // Calculate answer statistics
    return calculateAnswerStatistics(questionId, answers, question.correctOptionId);
  }

  /**
   * Get leaderboard for a quiz activity
   */
  async getLeaderboard(activityId: string): Promise<any[]> {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }
    if (activity.type !== 'quiz') {
      throw new Error('Activity is not a quiz');
    }

    const eventId = activity.eventId;
    const participants = await this.participantRepo.getParticipants(eventId);
    return generateLeaderboardAfterQuestion(participants);
  }
}
