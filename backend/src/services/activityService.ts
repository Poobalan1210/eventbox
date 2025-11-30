/**
 * ActivityService - Business logic for activity management
 * Handles creation, retrieval, updates, deletion, and activation of activities
 */
import { randomUUID } from 'crypto';
import { ActivityRepository } from '../db/repositories/ActivityRepository.js';
import { EventRepository } from '../db/repositories/EventRepository.js';
import {
  Activity,
  ActivityType,
  QuizActivity,
  PollActivity,
  RaffleActivity,
} from '../types/models.js';

const activityRepository = new ActivityRepository();
const eventRepository = new EventRepository();

/**
 * Configuration for creating a new activity
 */
interface CreateActivityConfig {
  name: string;
  type: ActivityType;
  // Quiz-specific config
  scoringEnabled?: boolean;
  speedBonusEnabled?: boolean;
  streakTrackingEnabled?: boolean;
  // Poll-specific config
  question?: string;
  options?: string[];
  allowMultipleVotes?: boolean;
  showResultsLive?: boolean;
  // Raffle-specific config
  prizeDescription?: string;
  entryMethod?: 'automatic' | 'manual';
  winnerCount?: number;
}

/**
 * Create a new activity for an event
 * @param eventId - The event ID to add the activity to
 * @param config - Configuration for the activity
 * @returns The created activity
 * @throws Error if event not found or validation fails
 */
export async function createActivity(
  eventId: string,
  config: CreateActivityConfig
): Promise<Activity> {
  // Validate event exists
  const event = await eventRepository.getEvent(eventId);
  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }

  // Validate activity name
  if (!config.name || config.name.trim().length === 0) {
    throw new Error('Activity name is required');
  }

  // Get existing activities to determine order
  const existingActivities = await activityRepository.findByEventId(eventId);
  const order = existingActivities.length;

  const activityId = randomUUID();
  const now = Date.now();

  let activity: Activity;

  switch (config.type) {
    case 'quiz':
      activity = {
        activityId,
        eventId,
        type: 'quiz',
        name: config.name,
        status: 'draft',
        order,
        createdAt: now,
        lastModified: now,
        questions: [],
        currentQuestionIndex: 0,
        scoringEnabled: config.scoringEnabled ?? true,
        speedBonusEnabled: config.speedBonusEnabled ?? true,
        streakTrackingEnabled: config.streakTrackingEnabled ?? true,
      } as QuizActivity;
      break;

    case 'poll':
      activity = {
        activityId,
        eventId,
        type: 'poll',
        name: config.name,
        status: 'draft',
        order,
        createdAt: now,
        lastModified: now,
        question: config.question || '',
        options: config.options?.map((text, index) => ({
          id: `option-${index}`,
          text,
          voteCount: 0,
        })) || [],
        allowMultipleVotes: config.allowMultipleVotes ?? false,
        showResultsLive: config.showResultsLive ?? true,
      } as PollActivity;
      break;

    case 'raffle':
      activity = {
        activityId,
        eventId,
        type: 'raffle',
        name: config.name,
        status: 'draft',
        order,
        createdAt: now,
        lastModified: now,
        prizeDescription: config.prizeDescription || '',
        entryMethod: config.entryMethod || 'automatic',
        winnerCount: config.winnerCount || 1,
        winners: [],
      } as RaffleActivity;
      break;

    default:
      throw new Error(`Invalid activity type: ${config.type}`);
  }

  return await activityRepository.create(activity);
}

/**
 * Get an activity by ID
 * @param activityId - The activity ID
 * @returns The activity or null if not found
 */
export async function getActivity(activityId: string): Promise<Activity | null> {
  const activity = await activityRepository.findById(activityId);
  
  if (!activity) {
    return null;
  }

  // For quiz activities, also fetch the questions
  if (activity.type === 'quiz') {
    const { QuizActivityService } = await import('./quizActivityService.js');
    const quizService = new QuizActivityService();
    
    try {
      const questions = await quizService.getQuestions(activityId);
      (activity as any).questions = questions;
    } catch (error) {
      console.error('Error fetching questions for quiz activity:', error);
      // Return activity without questions rather than failing completely
      (activity as any).questions = [];
    }
  }

  return activity;
}

/**
 * Update an activity with partial data
 * @param activityId - The activity ID
 * @param updates - Partial activity data to update
 * @returns The updated activity
 * @throws Error if activity not found
 */
export async function updateActivity(
  activityId: string,
  updates: Partial<Activity>
): Promise<Activity> {
  // Verify activity exists
  const existing = await activityRepository.findById(activityId);
  if (!existing) {
    throw new Error(`Activity not found: ${activityId}`);
  }

  // Prevent changing immutable fields
  const sanitizedUpdates = { ...updates };
  delete (sanitizedUpdates as any).activityId;
  delete (sanitizedUpdates as any).eventId;
  delete (sanitizedUpdates as any).createdAt;

  return await activityRepository.update(activityId, sanitizedUpdates);
}

/**
 * Delete an activity
 * @param activityId - The activity ID to delete
 * @throws Error if activity is currently active
 */
export async function deleteActivity(activityId: string): Promise<void> {
  // Verify activity exists
  const activity = await activityRepository.findById(activityId);
  if (!activity) {
    throw new Error(`Activity not found: ${activityId}`);
  }

  // Check if activity is currently active
  const event = await eventRepository.getEvent(activity.eventId);
  if (event && event.activeActivityId === activityId) {
    throw new Error('Cannot delete currently active activity. Deactivate it first.');
  }

  await activityRepository.delete(activityId);
}

/**
 * Activate an activity (make it the current active activity for the event)
 * This deactivates any previously active activity (mutual exclusion)
 * @param eventId - The event ID
 * @param activityId - The activity ID to activate
 * @throws Error if event or activity not found, or if activity is not ready
 */
export async function activateActivity(
  eventId: string,
  activityId: string
): Promise<void> {
  // Verify event exists
  const event = await eventRepository.getEvent(eventId);
  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }

  // Verify activity exists and belongs to this event
  const activity = await activityRepository.findById(activityId);
  if (!activity) {
    throw new Error(`Activity not found: ${activityId}`);
  }

  if (activity.eventId !== eventId) {
    throw new Error(`Activity ${activityId} does not belong to event ${eventId}`);
  }

  // Check if activity is in a valid state to be activated
  if (activity.status === 'draft') {
    throw new Error('Cannot activate activity in draft status. Activity must be ready.');
  }

  // Deactivate any currently active activity
  if (event.activeActivityId && event.activeActivityId !== activityId) {
    const currentActive = await activityRepository.findById(event.activeActivityId);
    if (currentActive && currentActive.status === 'active') {
      await activityRepository.setStatus(event.activeActivityId, 'completed');
    }
  }

  // Set this activity as active
  await activityRepository.setStatus(activityId, 'active');
  await eventRepository.setActiveActivity(eventId, activityId);
}

/**
 * Deactivate the currently active activity for an event
 * Returns participants to waiting state
 * @param eventId - The event ID
 * @param activityId - The activity ID to deactivate
 * @throws Error if event not found or activity is not currently active
 */
export async function deactivateActivity(
  eventId: string,
  activityId: string
): Promise<void> {
  // Verify event exists
  const event = await eventRepository.getEvent(eventId);
  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }

  // Verify this activity is currently active
  if (event.activeActivityId !== activityId) {
    throw new Error(`Activity ${activityId} is not currently active`);
  }

  // Verify activity exists
  const activity = await activityRepository.findById(activityId);
  if (!activity) {
    throw new Error(`Activity not found: ${activityId}`);
  }

  // Set activity status to completed
  await activityRepository.setStatus(activityId, 'completed');

  // Clear the active activity from the event
  await eventRepository.setActiveActivity(eventId, null);
}

/**
 * Get a quiz activity by ID with type checking
 * @param activityId - The activity ID
 * @returns The quiz activity
 * @throws Error if activity not found or not a quiz
 */
export async function getQuizActivity(activityId: string): Promise<QuizActivity> {
  const activity = await activityRepository.findById(activityId);
  
  if (!activity) {
    throw new Error(`Activity not found: ${activityId}`);
  }

  if (activity.type !== 'quiz') {
    throw new Error(`Activity ${activityId} is not a quiz activity`);
  }

  return activity as QuizActivity;
}

/**
 * Get a poll activity by ID with type checking
 * @param activityId - The activity ID
 * @returns The poll activity
 * @throws Error if activity not found or not a poll
 */
export async function getPollActivity(activityId: string): Promise<PollActivity> {
  const activity = await activityRepository.findById(activityId);
  
  if (!activity) {
    throw new Error(`Activity not found: ${activityId}`);
  }

  if (activity.type !== 'poll') {
    throw new Error(`Activity ${activityId} is not a poll activity`);
  }

  return activity as PollActivity;
}

/**
 * Get a raffle activity by ID with type checking
 * @param activityId - The activity ID
 * @returns The raffle activity
 * @throws Error if activity not found or not a raffle
 */
export async function getRaffleActivity(activityId: string): Promise<RaffleActivity> {
  const activity = await activityRepository.findById(activityId);
  
  if (!activity) {
    throw new Error(`Activity not found: ${activityId}`);
  }

  if (activity.type !== 'raffle') {
    throw new Error(`Activity ${activityId} is not a raffle activity`);
  }

  return activity as RaffleActivity;
}
