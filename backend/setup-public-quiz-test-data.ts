/**
 * Setup test data for public quiz discovery testing
 * Creates several public quizzes with different statuses
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

interface CreateEventResponse {
  eventId: string;
  gamePin: string;
  joinLink: string;
  qrCode: string;
}

async function setupTestData() {
  console.log('🔧 Setting up test data for public quiz discovery\n');

  try {
    const quizzes = [
      { name: 'Live Math Quiz', topic: 'Mathematics', status: 'live', visibility: 'public' },
      { name: 'Live Science Quiz', topic: 'Science', status: 'live', visibility: 'public' },
      { name: 'Upcoming History Quiz', topic: 'History', status: 'setup', visibility: 'public' },
      { name: 'Upcoming Geography Quiz', topic: 'Geography', status: 'draft', visibility: 'public' },
      { name: 'Private Math Quiz', topic: 'Mathematics', status: 'live', visibility: 'private' },
      { name: 'Completed Quiz', topic: 'General', status: 'completed', visibility: 'public' },
    ];

    const createdQuizzes = [];

    for (const quiz of quizzes) {
      // Create event
      console.log(`Creating: ${quiz.name}...`);
      const createResponse = await axios.post<CreateEventResponse>(
        `${API_BASE_URL}/api/events`,
        { name: quiz.name }
      );

      const eventId = createResponse.data.eventId;
      createdQuizzes.push({ ...quiz, eventId });

      // Update visibility
      await axios.patch(
        `${API_BASE_URL}/api/events/${eventId}/visibility`,
        { visibility: quiz.visibility }
      );

      // Update status
      await axios.patch(
        `${API_BASE_URL}/api/events/${eventId}/status`,
        { status: quiz.status }
      );

      // Update topic and description using the generic update endpoint
      // We'll need to use the EventRepository directly or add a PATCH endpoint
      // For now, let's just log that we created it
      console.log(`✅ Created: ${quiz.name} (${quiz.status}, ${quiz.visibility})`);
    }

    console.log('\n✅ Test data setup complete!');
    console.log('\nCreated quizzes:');
    createdQuizzes.forEach(q => {
      console.log(`  - ${q.name} (${q.status}, ${q.visibility}) - ID: ${q.eventId}`);
    });

    console.log('\n📝 Note: Topics and descriptions need to be set via database update');
    console.log('   You can manually update them in DynamoDB if needed for testing');

  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run setup
setupTestData();
