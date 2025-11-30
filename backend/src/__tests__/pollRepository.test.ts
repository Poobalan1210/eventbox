/**
 * PollRepository Tests
 * 
 * Basic tests to verify PollRepository operations
 */
import { describe, it, expect, afterAll } from 'vitest';
import { PollRepository } from '../db/repositories/PollRepository';
import { PollVote, PollOption } from '../types/models';
import { randomUUID } from 'crypto';

describe('PollRepository', () => {
  const pollRepository = new PollRepository();
  const testPollId = `test-poll-${randomUUID()}`;
  const createdVoteIds: string[] = [];

  // Cleanup after all tests
  afterAll(async () => {
    // Note: DynamoDB doesn't have a direct delete for votes in this implementation
    // In production, votes would be cleaned up when the poll/activity is deleted
    console.log(`Test completed with ${createdVoteIds.length} votes created`);
  });

  describe('createVote', () => {
    it('should create a poll vote', async () => {
      const vote: PollVote = {
        voteId: randomUUID(),
        pollId: testPollId,
        participantId: 'participant-1',
        selectedOptionIds: ['option-1'],
        submittedAt: Date.now(),
      };

      await pollRepository.createVote(vote);
      createdVoteIds.push(vote.voteId);

      // Verify by retrieving
      const votes = await pollRepository.getVotes(testPollId);
      expect(votes.length).toBeGreaterThan(0);
      const foundVote = votes.find(v => v.voteId === vote.voteId);
      expect(foundVote).toBeDefined();
      expect(foundVote?.participantId).toBe('participant-1');
    });

    it('should create a vote with multiple selections', async () => {
      const vote: PollVote = {
        voteId: randomUUID(),
        pollId: testPollId,
        participantId: 'participant-2',
        selectedOptionIds: ['option-1', 'option-2'],
        submittedAt: Date.now(),
      };

      await pollRepository.createVote(vote);
      createdVoteIds.push(vote.voteId);

      const foundVote = await pollRepository.getVoteByParticipant(testPollId, 'participant-2');
      expect(foundVote).not.toBeNull();
      expect(foundVote?.selectedOptionIds).toEqual(['option-1', 'option-2']);
    });
  });

  describe('getVotes', () => {
    it('should retrieve all votes for a poll', async () => {
      const pollId = `test-poll-${randomUUID()}`;
      
      const vote1: PollVote = {
        voteId: randomUUID(),
        pollId: pollId,
        participantId: 'participant-3',
        selectedOptionIds: ['option-1'],
        submittedAt: Date.now(),
      };

      const vote2: PollVote = {
        voteId: randomUUID(),
        pollId: pollId,
        participantId: 'participant-4',
        selectedOptionIds: ['option-2'],
        submittedAt: Date.now(),
      };

      await pollRepository.createVote(vote1);
      await pollRepository.createVote(vote2);
      createdVoteIds.push(vote1.voteId, vote2.voteId);

      const votes = await pollRepository.getVotes(pollId);
      expect(votes.length).toBe(2);
    });

    it('should return empty array for poll with no votes', async () => {
      const votes = await pollRepository.getVotes('non-existent-poll');
      expect(votes).toEqual([]);
    });
  });

  describe('getVoteByParticipant', () => {
    it('should retrieve a specific participant vote', async () => {
      const pollId = `test-poll-${randomUUID()}`;
      const participantId = 'participant-5';
      
      const vote: PollVote = {
        voteId: randomUUID(),
        pollId: pollId,
        participantId: participantId,
        selectedOptionIds: ['option-3'],
        submittedAt: Date.now(),
      };

      await pollRepository.createVote(vote);
      createdVoteIds.push(vote.voteId);

      const foundVote = await pollRepository.getVoteByParticipant(pollId, participantId);
      expect(foundVote).not.toBeNull();
      expect(foundVote?.participantId).toBe(participantId);
      expect(foundVote?.selectedOptionIds).toEqual(['option-3']);
    });

    it('should return null for non-existent participant vote', async () => {
      const foundVote = await pollRepository.getVoteByParticipant(testPollId, 'non-existent-participant');
      expect(foundVote).toBeNull();
    });
  });

  describe('getResults', () => {
    it('should calculate poll results correctly', async () => {
      const pollId = `test-poll-${randomUUID()}`;
      
      const pollOptions: PollOption[] = [
        { id: 'opt-1', text: 'Option 1', voteCount: 0 },
        { id: 'opt-2', text: 'Option 2', voteCount: 0 },
        { id: 'opt-3', text: 'Option 3', voteCount: 0 },
      ];

      // Create votes
      const votes: PollVote[] = [
        {
          voteId: randomUUID(),
          pollId: pollId,
          participantId: 'p1',
          selectedOptionIds: ['opt-1'],
          submittedAt: Date.now(),
        },
        {
          voteId: randomUUID(),
          pollId: pollId,
          participantId: 'p2',
          selectedOptionIds: ['opt-1'],
          submittedAt: Date.now(),
        },
        {
          voteId: randomUUID(),
          pollId: pollId,
          participantId: 'p3',
          selectedOptionIds: ['opt-2'],
          submittedAt: Date.now(),
        },
      ];

      for (const vote of votes) {
        await pollRepository.createVote(vote);
        createdVoteIds.push(vote.voteId);
      }

      const results = await pollRepository.getResults(pollId, pollOptions);
      
      expect(results.pollId).toBe(pollId);
      expect(results.totalVotes).toBe(3);
      expect(results.options.length).toBe(3);
      
      const opt1 = results.options.find(o => o.id === 'opt-1');
      const opt2 = results.options.find(o => o.id === 'opt-2');
      const opt3 = results.options.find(o => o.id === 'opt-3');
      
      expect(opt1?.voteCount).toBe(2);
      expect(opt2?.voteCount).toBe(1);
      expect(opt3?.voteCount).toBe(0);
    });

    it('should handle multiple vote selections correctly', async () => {
      const pollId = `test-poll-${randomUUID()}`;
      
      const pollOptions: PollOption[] = [
        { id: 'opt-a', text: 'Option A', voteCount: 0 },
        { id: 'opt-b', text: 'Option B', voteCount: 0 },
      ];

      // Participant votes for both options
      const vote: PollVote = {
        voteId: randomUUID(),
        pollId: pollId,
        participantId: 'p-multi',
        selectedOptionIds: ['opt-a', 'opt-b'],
        submittedAt: Date.now(),
      };

      await pollRepository.createVote(vote);
      createdVoteIds.push(vote.voteId);

      const results = await pollRepository.getResults(pollId, pollOptions);
      
      expect(results.totalVotes).toBe(1);
      expect(results.options.find(o => o.id === 'opt-a')?.voteCount).toBe(1);
      expect(results.options.find(o => o.id === 'opt-b')?.voteCount).toBe(1);
    });
  });
});
