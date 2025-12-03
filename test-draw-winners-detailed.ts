/**
 * Detailed test script to debug draw winners API
 */
import { RaffleActivityService } from './backend/src/services/raffleActivityService';
import { ActivityRepository } from './backend/src/db/repositories/ActivityRepository';
import { RaffleRepository } from './backend/src/db/repositories/RaffleRepository';

const ACTIVITY_ID = '391f6186-8432-4704-b599-3d322dfb2da6';

async function testDrawWinnersDirectly() {
  console.log('\n=== Testing Draw Winners Directly ===');
  console.log(`Activity ID: ${ACTIVITY_ID}`);
  
  try {
    const activityRepo = new ActivityRepository();
    const raffleRepo = new RaffleRepository();
    const raffleService = new RaffleActivityService(activityRepo, raffleRepo);
    
    console.log('\n1. Getting raffle activity...');
    const activity = await activityRepo.findById(ACTIVITY_ID);
    console.log(`   Activity: ${activity?.name}`);
    console.log(`   Type: ${activity?.type}`);
    console.log(`   Status: ${activity?.status}`);
    console.log(`   Winner Count: ${activity?.winnerCount}`);
    
    console.log('\n2. Getting raffle entries...');
    const entries = await raffleRepo.getEntries(ACTIVITY_ID);
    console.log(`   Entries: ${entries.length}`);
    entries.forEach((entry, idx) => {
      console.log(`   ${idx + 1}. ${entry.participantName} (${entry.participantId})`);
    });
    
    console.log('\n3. Drawing winners...');
    const winnerIds = await raffleService.drawWinners(ACTIVITY_ID);
    console.log(`   Winners: ${winnerIds.length}`);
    winnerIds.forEach((winnerId, idx) => {
      const entry = entries.find(e => e.participantId === winnerId);
      console.log(`   ${idx + 1}. ${entry?.participantName} (${winnerId})`);
    });
    
    console.log('\n✅ Draw winners completed successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDrawWinnersDirectly();
