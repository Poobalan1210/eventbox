/**
 * EventService - Business logic layer for Event operations
 * Provides methods for managing events and their activities
 */
import { EventRepository } from '../db/repositories/EventRepository';
import { ActivityRepository } from '../db/repositories/ActivityRepository';
import { Event, Activity } from '../types/models';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import { generateUniqueGamePin } from './gamePinService';

export class EventService {
  private eventRepository: EventRepository;
  private activityRepository: ActivityRepository;

  constructor(
    eventRepository?: EventRepository,
    activityRepository?: ActivityRepository
  ) {
    this.eventRepository = eventRepository || new EventRepository();
    this.activityRepository = activityRepository || new ActivityRepository();
  }

  /**
   * Create a new event
   * Initializes an empty activity list
   */
  async createEvent(
    name: string,
    organizerId: string,
    visibility: 'private' | 'public' = 'private'
  ): Promise<Event> {
    // Validate inputs
    if (!name || name.trim() === '') {
      throw new Error('Event name is required and cannot be empty');
    }
    if (!organizerId || organizerId.trim() === '') {
      throw new Error('organizerId is required and cannot be empty');
    }

    // Generate unique event ID
    const eventId = randomUUID();

    // Generate join link
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const joinLink = `${baseUrl}/join/${eventId}`;

    // Generate unique game PIN
    const gamePin = await generateUniqueGamePin(eventId);

    // Create event object with empty activity list (no activities yet)
    const now = Date.now();
    const event: Event = {
      eventId: eventId,
      id: eventId, // Keep for backward compatibility
      name: name.trim(),
      gamePin,
      organizerId: organizerId.trim(),
      status: 'draft', // New events start in draft mode
      currentQuestionIndex: 0,
      createdAt: now,
      joinLink,
      visibility: visibility,
      isTemplate: false,
      lastModified: now,
      participantCount: 0,
      activeActivityId: null, // No active activity initially
    };

    // Save to database
    await this.eventRepository.createEvent(event);

    return event;
  }

  /**
   * Get an event by ID
   * Includes the list of activities
   */
  async getEvent(eventId: string): Promise<Event | null> {
    const event = await this.eventRepository.getEvent(eventId);
    
    if (!event) {
      return null;
    }

    // Event already includes activeActivityId
    // Activities list can be fetched separately via listActivities if needed
    return event;
  }

  /**
   * Update event with partial data
   */
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    // Verify event exists
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Update event
    await this.eventRepository.updateEvent(eventId, updates);

    // Return updated event
    const updatedEvent = await this.eventRepository.getEvent(eventId);
    if (!updatedEvent) {
      throw new Error(`Failed to retrieve updated event: ${eventId}`);
    }

    return updatedEvent;
  }

  /**
   * Delete an event
   * Cascades to delete all associated activities
   */
  async deleteEvent(eventId: string): Promise<void> {
    // Verify event exists
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // EventRepository.deleteEvent already handles cascade deletion of activities
    await this.eventRepository.deleteEvent(eventId);
  }

  /**
   * Set the active activity for an event
   * Ensures only one activity is active at a time
   */
  async setActiveActivity(eventId: string, activityId: string | null): Promise<void> {
    // Verify event exists
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // If activityId is provided, verify the activity exists and belongs to this event
    if (activityId) {
      const activity = await this.activityRepository.findById(activityId);
      if (!activity) {
        throw new Error(`Activity not found: ${activityId}`);
      }
      if (activity.eventId !== eventId) {
        throw new Error(`Activity ${activityId} does not belong to event ${eventId}`);
      }

      // Update activity status to active
      await this.activityRepository.setStatus(activityId, 'active');
    }

    // If there was a previously active activity, deactivate it
    if (event.activeActivityId && event.activeActivityId !== activityId) {
      const previousActivity = await this.activityRepository.findById(event.activeActivityId);
      if (previousActivity) {
        // Set previous activity to completed (or ready if it wasn't started)
        const newStatus = previousActivity.status === 'active' ? 'completed' : previousActivity.status;
        await this.activityRepository.setStatus(event.activeActivityId, newStatus);
      }
    }

    // Set the active activity in the event
    await this.eventRepository.setActiveActivity(eventId, activityId);
  }

  /**
   * Get the currently active activity for an event
   * Returns the full Activity object, not just the ID
   */
  async getActiveActivity(eventId: string): Promise<Activity | null> {
    // Verify event exists
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Get active activity ID
    const activeActivityId = event.activeActivityId;
    if (!activeActivityId) {
      return null;
    }

    // Get the full activity object
    const activity = await this.activityRepository.findById(activeActivityId);
    return activity;
  }

  /**
   * List all activities for an event
   * Returns activities ordered by their order field
   */
  async listActivities(eventId: string): Promise<Activity[]> {
    // Verify event exists
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Get all activities for this event
    const activities = await this.activityRepository.findByEventId(eventId);
    return activities;
  }

  /**
   * Get all events for an organizer
   */
  async getEventsByOrganizer(organizerId: string): Promise<Event[]> {
    return await this.eventRepository.getEventsByOrganizer(organizerId);
  }

  /**
   * Get public events
   */
  async getPublicEvents(): Promise<Event[]> {
    return await this.eventRepository.getPublicEvents();
  }
}
