/**
 * Activity Results Page
 * Shows detailed results and participant information for completed activities
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Activity, QuizActivity, PollActivity, RaffleActivity } from '../types/models';

interface ParticipantScore {
  participantId: string;
  name: string;
  score: number;
  totalAnswerTime: number;
  rank: number;
  correctAnswers: number;
  totalQuestions: number;
}

interface PollResult {
  optionId: string;
  text: string;
  voteCount: number;
  percentage: number;
}

interface RaffleEntry {
  participantId: string;
  participantName: string;
  enteredAt: number;
  isWinner: boolean;
}

export default function ActivityResults() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Quiz-specific data
  const [leaderboard, setLeaderboard] = useState<ParticipantScore[]>([]);
  
  // Poll-specific data
  const [pollResults, setPollResults] = useState<PollResult[]>([]);
  
  // Raffle-specific data
  const [raffleEntries, setRaffleEntries] = useState<RaffleEntry[]>([]);

  useEffect(() => {
    fetchActivityDetails();
  }, [activityId]);

  const fetchActivityDetails = async () => {
    if (!activityId) return;

    try {
      // Fetch activity details
      const activityResponse = await fetch(`${apiBaseUrl}/activities/${activityId}`);
      if (!activityResponse.ok) {
        throw new Error('Failed to fetch activity');
      }
      const activityData = await activityResponse.json();
      const act = activityData.activity;
      setActivity(act);

      // Fetch type-specific data
      if (act.type === 'quiz') {
        await fetchQuizResults(activityId);
      } else if (act.type === 'poll') {
        await fetchPollResults(activityId);
      } else if (act.type === 'raffle') {
        await fetchRaffleResults(activityId, act);
      }
    } catch (error) {
      console.error('Error fetching activity details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizResults = async (activityId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/activities/${activityId}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data || []);
      }
    } catch (error) {
      console.error('Error fetching quiz results:', error);
    }
  };

  const fetchPollResults = async (activityId: string) => {
    try {
      console.log('getting for poll view results');
      const response = await fetch(`${apiBaseUrl}/activities/${activityId}/poll-results`);
      if (response.ok) {
        const data = await response.json();
        console.log('Poll results data:', data);
        const pollData = data.results;
        
        if (!pollData || !pollData.options) {
          console.error('Invalid poll data structure:', pollData);
          setPollResults([]);
          return;
        }
        
        // Transform backend format to frontend format
        const totalVotes = pollData.totalVotes || 0;
        const results: PollResult[] = (pollData.options || []).map((option: any) => ({
          optionId: option.id,
          text: option.text,
          voteCount: option.voteCount || 0,
          percentage: totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0,
        }));
        
        console.log('Transformed poll results:', results);
        setPollResults(results);
      } else {
        console.error('Failed to fetch poll results:', response.status, response.statusText);
        setPollResults([]);
      }
    } catch (error) {
      console.error('Error fetching poll results:', error);
      setPollResults([]);
    }
  };

  const fetchRaffleResults = async (activityId: string, activity: RaffleActivity) => {
    try {
      const response = await fetch(`${apiBaseUrl}/activities/${activityId}/entries`);
      if (response.ok) {
        const data = await response.json();
        const entries = (data.entries || []).map((entry: any) => ({
          ...entry,
          isWinner: activity.winners?.includes(entry.participantId) || false,
        }));
        setRaffleEntries(entries);
      }
    } catch (error) {
      console.error('Error fetching raffle entries:', error);
    }
  };

  const renderQuizResults = (activity: QuizActivity) => (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm" style={{ color: colors.textSecondary }}>Total Participants</div>
          <div className="text-2xl font-bold" style={{ color: colors.accent }}>{leaderboard.length}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm" style={{ color: colors.textSecondary }}>Questions</div>
          <div className="text-2xl font-bold" style={{ color: colors.accent }}>{activity.questions?.length || 0}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm" style={{ color: colors.textSecondary }}>Avg Score</div>
          <div className="text-2xl font-bold" style={{ color: colors.accent }}>
            {leaderboard.length > 0 
              ? Math.round(leaderboard.reduce((sum, p) => sum + p.score, 0) / leaderboard.length)
              : 0}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm" style={{ color: colors.textSecondary }}>Scoring</div>
          <div className="text-2xl font-bold" style={{ color: colors.accent }}>
            {activity.scoringEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4" style={{ color: colors.textPrimary }}>
          🏆 Final Leaderboard
        </h3>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: colors.textSecondary }}>No participants</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2" style={{ color: colors.textSecondary }}>Rank</th>
                  <th className="text-left py-3 px-2" style={{ color: colors.textSecondary }}>Name</th>
                  <th className="text-right py-3 px-2" style={{ color: colors.textSecondary }}>Score</th>
                  <th className="text-right py-3 px-2" style={{ color: colors.textSecondary }}>Correct</th>
                  <th className="text-right py-3 px-2" style={{ color: colors.textSecondary }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((participant, index) => (
                  <tr 
                    key={participant.participantId}
                    className={`border-b border-white/5 ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''
                    }`}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {index === 0 && <span className="text-lg">🥇</span>}
                        {index === 1 && <span className="text-lg">🥈</span>}
                        {index === 2 && <span className="text-lg">🥉</span>}
                        <span className="font-medium" style={{ color: colors.textPrimary }}>
                          #{participant.rank}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-medium" style={{ color: colors.textPrimary }}>
                        {participant.name}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="font-bold text-lg" style={{ color: colors.accent }}>
                        {participant.score}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span style={{ color: colors.textPrimary }}>
                        {participant.correctAnswers}/{participant.totalQuestions}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-sm" style={{ color: colors.textSecondary }}>
                        {(participant.totalAnswerTime / 1000).toFixed(1)}s
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderPollResults = (activity: PollActivity) => {
    // Safety check: ensure pollResults is an array
    const safeResults = Array.isArray(pollResults) ? pollResults : [];
    const totalVotes = safeResults.reduce((sum, r) => sum + r.voteCount, 0);
    
    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm" style={{ color: colors.textSecondary }}>Total Votes</div>
            <div className="text-2xl font-bold" style={{ color: colors.accent }}>{totalVotes}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm" style={{ color: colors.textSecondary }}>Options</div>
            <div className="text-2xl font-bold" style={{ color: colors.accent }}>{activity.options?.length || 0}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm" style={{ color: colors.textSecondary }}>Multiple Votes</div>
            <div className="text-2xl font-bold" style={{ color: colors.accent }}>
              {activity.allowMultipleVotes ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
            Question
          </h3>
          <p className="text-lg" style={{ color: colors.textSecondary }}>
            {activity.question}
          </p>
        </div>

        {/* Results */}
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4" style={{ color: colors.textPrimary }}>
            📊 Results
          </h3>
          <div className="space-y-4">
            {safeResults.map((result, index) => (
              <div key={result.optionId} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textPrimary }} className="font-medium">
                    {result.text}
                  </span>
                  <span style={{ color: colors.textSecondary }} className="text-sm">
                    {result.voteCount} votes ({result.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${result.percentage}%`,
                      backgroundColor: colors.accent,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRaffleResults = (activity: RaffleActivity) => {
    const winners = raffleEntries.filter(e => e.isWinner);
    const nonWinners = raffleEntries.filter(e => !e.isWinner);
    
    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm" style={{ color: colors.textSecondary }}>Total Entries</div>
            <div className="text-2xl font-bold" style={{ color: colors.accent }}>{raffleEntries.length}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm" style={{ color: colors.textSecondary }}>Winners</div>
            <div className="text-2xl font-bold" style={{ color: colors.accent }}>{winners.length}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm" style={{ color: colors.textSecondary }}>Entry Method</div>
            <div className="text-2xl font-bold" style={{ color: colors.accent }}>
              {activity.entryMethod === 'automatic' ? 'Auto' : 'Manual'}
            </div>
          </div>
        </div>

        {/* Prize */}
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
            🎁 Prize
          </h3>
          <p className="text-lg" style={{ color: colors.textSecondary }}>
            {activity.prizeDescription || 'No prize description'}
          </p>
        </div>

        {/* Winners */}
        {winners.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-transparent rounded-lg p-6 border border-yellow-500/30">
            <h3 className="text-xl font-semibold mb-4" style={{ color: colors.textPrimary }}>
              🎉 Winners
            </h3>
            <div className="space-y-3">
              {winners.map((winner, index) => (
                <div
                  key={winner.participantId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/10"
                >
                  <span className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆'}
                  </span>
                  <span className="font-bold text-lg" style={{ color: colors.textPrimary }}>
                    {winner.participantName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Participants */}
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4" style={{ color: colors.textPrimary }}>
            👥 All Participants ({raffleEntries.length})
          </h3>
          {raffleEntries.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: colors.textSecondary }}>No participants</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {raffleEntries.map((entry) => (
                <div
                  key={entry.participantId}
                  className={`p-3 rounded-lg ${
                    entry.isWinner 
                      ? 'bg-yellow-500/20 border border-yellow-500/30' 
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{entry.isWinner ? '🏆' : '👤'}</span>
                    <span style={{ color: colors.textPrimary }} className="font-medium">
                      {entry.participantName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: colors.textSecondary }}>Loading activity results...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <p style={{ color: colors.textSecondary }}>Activity not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background, color: colors.textPrimary }}>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            style={{ color: colors.textPrimary }}
          >
            ← Back
          </button>
        </div>

        {/* Activity Header */}
        <div className="bg-white/10 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">
              {activity.type === 'quiz' && '❓'}
              {activity.type === 'poll' && '📊'}
              {activity.type === 'raffle' && '🎁'}
            </span>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                {activity.name}
              </h1>
              <p style={{ color: colors.textSecondary }}>
                {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} • {activity.status}
              </p>
            </div>
          </div>
        </div>

        {/* Type-specific Results */}
        {activity.type === 'quiz' && renderQuizResults(activity as QuizActivity)}
        {activity.type === 'poll' && renderPollResults(activity as PollActivity)}
        {activity.type === 'raffle' && renderRaffleResults(activity as RaffleActivity)}
      </div>
    </div>
  );
}
