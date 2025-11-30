/**
 * Manual test script for public quiz discovery endpoint
 * 
 * This script tests the GET /api/events/public endpoint with various filters
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

interface PublicQuizEntry {
  eventId: string;
  name: string;
  topic?: string;
  description?: string;
  participantCount: number;
  status: 'live' | 'upcoming';
  createdAt: number;
  startedAt?: number;
}

interface GetPublicQuizzesResponse {
  quizzes: PublicQuizEntry[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

async function testPublicQuizzes() {
  console.log('🧪 Testing Public Quiz Discovery Endpoint\n');

  try {
    // Test 1: Get all public quizzes
    console.log('Test 1: Get all public quizzes');
    const response1 = await axios.get<GetPublicQuizzesResponse>(
      `${API_BASE_URL}/api/events/public`
    );
    console.log(`✅ Status: ${response1.status}`);
    console.log(`   Total quizzes: ${response1.data.total}`);
    console.log(`   Page: ${response1.data.page}, Page size: ${response1.data.pageSize}`);
    console.log(`   Has more: ${response1.data.hasMore}`);
    console.log(`   Quizzes returned: ${response1.data.quizzes.length}`);
    if (response1.data.quizzes.length > 0) {
      console.log(`   First quiz: ${response1.data.quizzes[0].name} (${response1.data.quizzes[0].status})`);
    }
    console.log();

    // Test 2: Filter by status - live
    console.log('Test 2: Filter by status = live');
    const response2 = await axios.get<GetPublicQuizzesResponse>(
      `${API_BASE_URL}/api/events/public?status=live`
    );
    console.log(`✅ Status: ${response2.status}`);
    console.log(`   Total live quizzes: ${response2.data.total}`);
    console.log(`   Quizzes returned: ${response2.data.quizzes.length}`);
    const allLive = response2.data.quizzes.every(q => q.status === 'live');
    console.log(`   All quizzes are live: ${allLive ? '✅' : '❌'}`);
    console.log();

    // Test 3: Filter by status - upcoming
    console.log('Test 3: Filter by status = upcoming');
    const response3 = await axios.get<GetPublicQuizzesResponse>(
      `${API_BASE_URL}/api/events/public?status=upcoming`
    );
    console.log(`✅ Status: ${response3.status}`);
    console.log(`   Total upcoming quizzes: ${response3.data.total}`);
    console.log(`   Quizzes returned: ${response3.data.quizzes.length}`);
    const allUpcoming = response3.data.quizzes.every(q => q.status === 'upcoming');
    console.log(`   All quizzes are upcoming: ${allUpcoming ? '✅' : '❌'}`);
    console.log();

    // Test 4: Search by name
    console.log('Test 4: Search by name (search=quiz)');
    const response4 = await axios.get<GetPublicQuizzesResponse>(
      `${API_BASE_URL}/api/events/public?search=quiz`
    );
    console.log(`✅ Status: ${response4.status}`);
    console.log(`   Total matching quizzes: ${response4.data.total}`);
    console.log(`   Quizzes returned: ${response4.data.quizzes.length}`);
    if (response4.data.quizzes.length > 0) {
      console.log(`   Sample matches:`);
      response4.data.quizzes.slice(0, 3).forEach(q => {
        console.log(`     - ${q.name} (topic: ${q.topic || 'N/A'})`);
      });
    }
    console.log();

    // Test 5: Pagination - page 1
    console.log('Test 5: Pagination - page 1, pageSize 5');
    const response5 = await axios.get<GetPublicQuizzesResponse>(
      `${API_BASE_URL}/api/events/public?page=1&pageSize=5`
    );
    console.log(`✅ Status: ${response5.status}`);
    console.log(`   Total quizzes: ${response5.data.total}`);
    console.log(`   Page: ${response5.data.page}, Page size: ${response5.data.pageSize}`);
    console.log(`   Quizzes returned: ${response5.data.quizzes.length}`);
    console.log(`   Has more: ${response5.data.hasMore}`);
    console.log();

    // Test 6: Pagination - page 2
    if (response5.data.hasMore) {
      console.log('Test 6: Pagination - page 2, pageSize 5');
      const response6 = await axios.get<GetPublicQuizzesResponse>(
        `${API_BASE_URL}/api/events/public?page=2&pageSize=5`
      );
      console.log(`✅ Status: ${response6.status}`);
      console.log(`   Page: ${response6.data.page}, Page size: ${response6.data.pageSize}`);
      console.log(`   Quizzes returned: ${response6.data.quizzes.length}`);
      console.log(`   Has more: ${response6.data.hasMore}`);
      console.log();
    }

    // Test 7: Combined filters
    console.log('Test 7: Combined filters (status=live, search=quiz)');
    const response7 = await axios.get<GetPublicQuizzesResponse>(
      `${API_BASE_URL}/api/events/public?status=live&search=quiz`
    );
    console.log(`✅ Status: ${response7.status}`);
    console.log(`   Total matching quizzes: ${response7.data.total}`);
    console.log(`   Quizzes returned: ${response7.data.quizzes.length}`);
    const allLiveAndMatch = response7.data.quizzes.every(q => 
      q.status === 'live' && 
      (q.name.toLowerCase().includes('quiz') || q.topic?.toLowerCase().includes('quiz'))
    );
    console.log(`   All quizzes are live and match search: ${allLiveAndMatch ? '✅' : '❌'}`);
    console.log();

    // Test 8: Verify sorting (live first, then by date)
    console.log('Test 8: Verify sorting order');
    const response8 = await axios.get<GetPublicQuizzesResponse>(
      `${API_BASE_URL}/api/events/public?pageSize=10`
    );
    console.log(`✅ Status: ${response8.status}`);
    if (response8.data.quizzes.length > 1) {
      let sortingCorrect = true;
      let lastWasLive = response8.data.quizzes[0].status === 'live';
      let lastDate = response8.data.quizzes[0].startedAt || response8.data.quizzes[0].createdAt;
      
      for (let i = 1; i < response8.data.quizzes.length; i++) {
        const current = response8.data.quizzes[i];
        const currentIsLive = current.status === 'live';
        const currentDate = current.startedAt || current.createdAt;
        
        // Live should come before upcoming
        if (!lastWasLive && currentIsLive) {
          sortingCorrect = false;
          break;
        }
        
        // Within same status, dates should be descending
        if (lastWasLive === currentIsLive && currentDate > lastDate) {
          sortingCorrect = false;
          break;
        }
        
        lastWasLive = currentIsLive;
        lastDate = currentDate;
      }
      
      console.log(`   Sorting is correct: ${sortingCorrect ? '✅' : '❌'}`);
      console.log(`   Order: ${response8.data.quizzes.map(q => `${q.status}:${q.name}`).join(', ')}`);
    }
    console.log();

    console.log('✅ All tests completed successfully!');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run tests
testPublicQuizzes();
