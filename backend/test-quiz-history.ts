/**
 * Manual test script for quiz history and status management endpoints
 */

import { EventRepository } from './src/db/repositories/EventRepository.js';
import { Event } from './src/types/models.js';

async function testQuizHistory() {
  const eventRepository = new EventRepository();
  
  console.log('Testing Quiz History and Status Management...\n');
  
  // Test 1: Create test events with different statuses
  console.log('1. Creating test events...');
  const testOrganizerId = 'test-organizer-123';
  
  const events: Event[] = [
    {
      eventId: 'event-live-1',
      id: 'event-live-1',
      name: 'Live Quiz 1',
      gamePin: '111111',
      organizerId: testOrganizerId,
      status: 'live',
      currentQuestionIndex: 0,
      createdAt: Date.now() - 3600000, // 1 hour ago
      joinLink: 'http://localhost:3000/join/event-live-1',
      visibility: 'public',
      isTemplate: false,
      lastModified: Date.now(),
      participantCount: 15,
      startedAt: Date.now() - 1800000, // 30 min ago
      topic: 'Science',
    },
    {
      eventId: 'event-setup-1',
      id: 'event-setup-1',
      name: 'Upcoming Quiz 1',
      gamePin: '222222',
      organizerId: testOrganizerId,
      status: 'setup',
      currentQuestionIndex: 0,
      createdAt: Date.now() - 7200000, // 2 hours ago
      joinLink: 'http://localhost:3000/join/event-setup-1',
      visibility: 'private',
      isTemplate: false,
      lastModified: Date.now() - 3600000,
      participantCount: 0,
      topic: 'Math',
    },
    {
      eventId: 'event-draft-1',
      id: 'event-draft-1',
      name: 'Draft Quiz 1',
      gamePin: '333333',
      organizerId: testOrganizerId,
      status: 'draft',
      currentQuestionIndex: 0,
      createdAt: Date.now() - 86400000, // 1 day ago
      joinLink: 'http://localhost:3000/join/event-draft-1',
      visibility: 'private',
      isTemplate: false,
      lastModified: Date.now() - 7200000,
      participantCount: 0,
    },
    {
      eventId: 'event-completed-1',
      id: 'event-completed-1',
      name: 'Completed Quiz 1',
      gamePin: '444444',
      organizerId: testOrganizerId,
      status: 'completed',
      currentQuestionIndex: 5,
      createdAt: Date.now() - 172800000, // 2 days ago
      joinLink: 'http://localhost:3000/join/event-completed-1',
      visibility: 'public',
      isTemplate: false,
      lastModified: Date.now() - 86400000,
      participantCount: 25,
      startedAt: Date.now() - 172800000,
      completedAt: Date.now() - 169200000, // 1 hour after start
      topic: 'History',
    },
  ];
  
  for (const event of events) {
    await eventRepository.createEvent(event);
    console.log(`  Created: ${event.name} (${event.status})`);
  }
  
  // Test 2: Get all events for organizer
  console.log('\n2. Getting all events for organizer...');
  const organizerEvents = await eventRepository.getEventsByOrganizer(testOrganizerId);
  console.log(`  Found ${organizerEvents.length} events`);
  
  // Test 3: Update event status
  console.log('\n3. Testing status update...');
  console.log('  Updating event-setup-1 from setup to live...');
  await eventRepository.updateEventStatus('event-setup-1', 'live');
  const updatedEvent = await eventRepository.getEvent('event-setup-1');
  console.log(`  Status after update: ${updatedEvent?.status}`);
  
  // Test 4: Update event visibility
  console.log('\n4. Testing visibility update...');
  console.log('  Updating event-draft-1 from private to public...');
  await eventRepository.updateEventVisibility('event-draft-1', 'public');
  const visibilityUpdatedEvent = await eventRepository.getEvent('event-draft-1');
  console.log(`  Visibility after update: ${visibilityUpdatedEvent?.visibility}`);
  
  // Test 5: Verify categorization logic
  console.log('\n5. Testing categorization logic...');
  const categorize = (status: string): string => {
    switch (status) {
      case 'live':
        return 'live';
      case 'draft':
      case 'setup':
      case 'waiting':
        return 'upcoming';
      case 'completed':
      case 'active':
        return 'completed';
      default:
        return 'upcoming';
    }
  };
  
  for (const event of organizerEvents) {
    const category = categorize(event.status);
    console.log(`  ${event.name}: ${event.status} -> ${category}`);
  }
  
  // Test 6: Verify sorting logic
  console.log('\n6. Testing sorting logic...');
  const sortedEvents = [...organizerEvents].sort((a, b) => {
    const statusOrder = { live: 0, upcoming: 1, completed: 2 };
    const categoryA = categorize(a.status) as 'live' | 'upcoming' | 'completed';
    const categoryB = categorize(b.status) as 'live' | 'upcoming' | 'completed';
    
    const statusDiff = statusOrder[categoryA] - statusOrder[categoryB];
    if (statusDiff !== 0) return statusDiff;
    
    const dateA = categoryA === 'completed' ? (a.completedAt || a.lastModified) : a.lastModified;
    const dateB = categoryB === 'completed' ? (b.completedAt || b.lastModified) : b.lastModified;
    
    return dateB - dateA;
  });
  
  console.log('  Sorted order:');
  for (const event of sortedEvents) {
    console.log(`    ${event.name} (${event.status})`);
  }
  
  console.log('\n✅ All tests completed successfully!');
}

// Run tests
testQuizHistory().catch(console.error);
