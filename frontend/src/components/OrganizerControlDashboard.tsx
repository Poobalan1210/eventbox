import { useState, useEffect } from 'react';
import { Activity, QuizActivity, PollActivity, RaffleActivity } from '../types/models';
import { useTheme } from '../contexts/ThemeContext';
import { useWebSocket } from '../contexts/WebSocketContext';

// Participants Leaderboard Component
interface ParticipantsLeaderboardProps {
  eventId: string;
  activeActivity: Activity | null;
}

interface ParticipantScore {
  participantId: string;
  name: string;
  score: number;
  totalAnswerTime: number;
  rank: number;
  correctAnswers: number;
  totalQuestions: number;
}

function ParticipantsLeaderboard({ eventId, activeActivity }: ParticipantsLeaderboardProps) {
  const { colors } = useTheme();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const [participants, setParticipants] = useState<ParticipantScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        if (activeActivity && activeActivity.type === 'quiz') {
          // Fetch leaderboard for quiz activities
          const response = await fetch(`${apiBaseUrl}/activities/${activeActivity.activityId}/leaderboard`);
          if (response.ok) {
            const leaderboard = await response.json();
            setParticipants(leaderboard || []);
          }
        } else {
          // Fetch general participants for non-quiz activities
          const response = await fetch(`${apiBaseUrl}/events/${eventId}/participants`);
          if (response.ok) {
            const data = await response.json();
            const participantList = data.participants || [];
            // Convert to leaderboard format
            const formattedParticipants = participantList.map((p: any, index: number) => ({
              participantId: p.participantId || p.id,
              name: p.name || p.participantName || `Participant ${index + 1}`,
              score: 0,
              totalAnswerTime: 0,
              rank: index + 1,
              correctAnswers: 0,
              totalQuestions: 0
            }));
            setParticipants(formattedParticipants);
          }
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
        setParticipants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
    const interval = setInterval(fetchParticipants, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [eventId, activeActivity, apiBaseUrl]);

  return (
    <div className="bg-white/5 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
          🏆 Participants Leaderboard
        </h3>
        <div className="text-sm" style={{ color: colors.textSecondary }}>
          {participants.length} participants
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>Loading participants...</p>
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">👥</div>
          <p style={{ color: colors.textSecondary }}>No participants yet</p>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Participants will appear here when they join the event
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-2" style={{ color: colors.textSecondary }}>Rank</th>
                <th className="text-left py-3 px-2" style={{ color: colors.textSecondary }}>Name</th>
                {activeActivity?.type === 'quiz' && (
                  <>
                    <th className="text-right py-3 px-2" style={{ color: colors.textSecondary }}>Score</th>
                    <th className="text-right py-3 px-2" style={{ color: colors.textSecondary }}>Correct</th>
                    <th className="text-right py-3 px-2" style={{ color: colors.textSecondary }}>Time</th>
                  </>
                )}
                <th className="text-right py-3 px-2" style={{ color: colors.textSecondary }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant, index) => (
                <tr 
                  key={participant.participantId}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
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
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👤</span>
                      <span className="font-medium" style={{ color: colors.textPrimary }}>
                        {participant.name}
                      </span>
                    </div>
                  </td>
                  {activeActivity?.type === 'quiz' && (
                    <>
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
                    </>
                  )}
                  <td className="py-3 px-2 text-right">
                    <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                      Online
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Raffle Participants Table Component
interface RaffleParticipantsTableProps {
  activityId: string;
}

function RaffleParticipantsTable({ activityId }: RaffleParticipantsTableProps) {
  const { colors } = useTheme();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const [participants, setParticipants] = useState<Array<{ participantId: string; participantName: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/activities/${activityId}/entries`);
        if (response.ok) {
          const data = await response.json();
          setParticipants(data.entries || []);
        }
      } catch (error) {
        console.error('Error fetching raffle participants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
    const interval = setInterval(fetchParticipants, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [activityId, apiBaseUrl]);

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <h4 className="text-lg font-semibold mb-3" style={{ color: colors.textPrimary }}>
        🎫 Raffle Participants ({participants.length})
      </h4>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
          <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>Loading participants...</p>
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🎪</div>
          <p style={{ color: colors.textSecondary }}>No participants yet</p>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Participants will appear here when they enter the raffle
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {participants.map((participant, index) => (
            <div
              key={participant.participantId}
              className="flex items-center gap-3 p-2 rounded-md"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              <span className="text-lg">👤</span>
              <span style={{ color: colors.textPrimary }} className="font-medium">
                {participant.participantName}
              </span>
              <span className="ml-auto text-xs" style={{ color: colors.textSecondary }}>
                #{index + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface OrganizerControlDashboardProps {
  eventId: string;
  organizerId: string;
}

interface ActivityStats {
  participantCount: number;
  totalResponses: number;
  currentQuestion?: number;
  totalQuestions?: number;
}

export default function OrganizerControlDashboard({
  eventId,
  organizerId,
}: OrganizerControlDashboardProps) {
  const { colors } = useTheme();
  const { emit } = useWebSocket();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [stats, setStats] = useState<ActivityStats>({
    participantCount: 0,
    totalResponses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Fetch activities and find active one
  const fetchActivities = async () => {
    try {
      console.log('Fetching activities for event:', eventId);
      const response = await fetch(`${apiBaseUrl}/events/${eventId}/activities`, {
        headers: { 'x-organizer-id': organizerId },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Activities API response:', data);
        const activities = data.activities || [];
        setActivities(activities);
        
        // Find active activity
        const active = activities.find((a: Activity) => a.status === 'active');
        setActiveActivity(active || null);
      } else {
        console.error('Failed to fetch activities:', response.status, response.statusText);
        setActivities([]);
        setActiveActivity(null);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
      setActiveActivity(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real-time stats
  const fetchStats = async () => {
    if (!activeActivity) return;

    try {
      const response = await fetch(`${apiBaseUrl}/events/${eventId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          participantCount: data.participants?.length || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [eventId]);

  useEffect(() => {
    if (activeActivity) {
      fetchStats();
      const interval = setInterval(fetchStats, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [activeActivity]);

  // Activity control functions
  const handleQuizAction = async (action: string) => {
    console.log('Quiz action clicked:', action, 'Active activity:', activeActivity);
    if (!activeActivity) {
      console.log('No active activity found');
      return;
    }
    
    setActionInProgress(action);
    try {
      let endpoint = '';
      let method = 'POST';
      
      switch (action) {
        case 'start':
          endpoint = `/activities/${activeActivity.activityId}/start-quiz`;
          break;
        case 'next':
          endpoint = `/activities/${activeActivity.activityId}/next-question`;
          break;
        case 'end':
          endpoint = `/activities/${activeActivity.activityId}/end-quiz`;
          break;
        case 'show-results':
          console.log('Show results - not implemented yet');
          return;
        case 'show-leaderboard':
          console.log('Show leaderboard - not implemented yet');
          return;
      }

      console.log('Making request to:', `${apiBaseUrl}${endpoint}`);
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-organizer-id': organizerId,
        },
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('Response:', result);
        await fetchActivities();
      } else {
        const error = await response.json();
        console.error('Error response:', error);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePollAction = async (action: string) => {
    if (!activeActivity) return;
    
    setActionInProgress(action);
    try {
      let endpoint = '';
      
      switch (action) {
        case 'start':
          endpoint = `/activities/${activeActivity.activityId}/start-poll`;
          break;
        case 'end':
          endpoint = `/activities/${activeActivity.activityId}/end-poll`;
          break;
        case 'show-results':
          endpoint = `/activities/${activeActivity.activityId}/show-results`;
          break;
      }

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organizer-id': organizerId,
        },
      });

      if (response.ok) {
        await fetchActivities();
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRaffleAction = async (action: string, winnerCount?: number) => {
    if (!activeActivity) return;
    
    setActionInProgress(action);
    try {
      if (action === 'draw') {
        // Draw winners (this now handles starting the raffle automatically)
        const drawResponse = await fetch(`${apiBaseUrl}/activities/${activeActivity.activityId}/draw-winners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-organizer-id': organizerId,
          },
          body: JSON.stringify({ count: winnerCount || 1 }),
        });

        if (!drawResponse.ok) {
          const errorData = await drawResponse.json();
          throw new Error(errorData.message || 'Failed to draw winners');
        }

        // Wait for the drawing animation to complete
        await new Promise(resolve => setTimeout(resolve, 4000));

        // End the raffle
        const endResponse = await fetch(`${apiBaseUrl}/activities/${activeActivity.activityId}/end-raffle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-organizer-id': organizerId,
          },
        });

        if (!endResponse.ok) {
          console.warn('Failed to end raffle, but winners were drawn successfully');
        }
      }

      await fetchActivities();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${action} raffle`);
    } finally {
      setActionInProgress(null);
    }
  };

  const renderQuizControls = (activity: QuizActivity) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => handleQuizAction('start')}
          disabled={!!actionInProgress}
          className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {actionInProgress === 'start' ? '⏳' : '▶️'} Start Quiz
        </button>
        
        <button
          onClick={() => handleQuizAction('next')}
          disabled={!!actionInProgress}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {actionInProgress === 'next' ? '⏳' : '⏭️'} Next Question
        </button>
        
        <button
          onClick={() => handleQuizAction('show-results')}
          disabled={!!actionInProgress}
          className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {actionInProgress === 'show-results' ? '⏳' : '📊'} Show Results
        </button>
        
        <button
          onClick={() => handleQuizAction('show-leaderboard')}
          disabled={!!actionInProgress}
          className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {actionInProgress === 'show-leaderboard' ? '⏳' : '🏆'} Leaderboard
        </button>
      </div>
      
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
          Quiz Progress
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span style={{ color: colors.textSecondary }}>Questions: </span>
            <span style={{ color: colors.textPrimary }}>
              {activity.currentQuestionIndex + 1} / {activity.questions?.length || 0}
            </span>
          </div>
          <div>
            <span style={{ color: colors.textSecondary }}>Scoring: </span>
            <span style={{ color: colors.textPrimary }}>
              {activity.scoringEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => handleQuizAction('end')}
        disabled={!!actionInProgress}
        className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {actionInProgress === 'end' ? '⏳ Ending...' : '⏹️ End Quiz'}
      </button>
    </div>
  );

  const renderPollControls = (activity: PollActivity) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => handlePollAction('start')}
          disabled={!!actionInProgress}
          className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {actionInProgress === 'start' ? '⏳' : '▶️'} Start Poll
        </button>
        
        <button
          onClick={() => handlePollAction('show-results')}
          disabled={!!actionInProgress}
          className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {actionInProgress === 'show-results' ? '⏳' : '📊'} Show Results
        </button>
        
        <button
          onClick={() => handlePollAction('end')}
          disabled={!!actionInProgress}
          className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {actionInProgress === 'end' ? '⏳' : '⏹️'} End Poll
        </button>
      </div>
      
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
          Poll Details
        </h4>
        <div className="text-sm">
          <div className="mb-2">
            <span style={{ color: colors.textSecondary }}>Question: </span>
            <span style={{ color: colors.textPrimary }}>{activity.question || 'No question set'}</span>
          </div>
          <div>
            <span style={{ color: colors.textSecondary }}>Options: </span>
            <span style={{ color: colors.textPrimary }}>{activity.options?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRaffleControls = (activity: RaffleActivity) => (
    <div className="space-y-4">
      <div className="flex justify-center">
        <button
          onClick={() => handleRaffleAction('draw', activity.winnerCount)}
          disabled={!!actionInProgress}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-xl transition-colors disabled:opacity-50 shadow-lg transform hover:scale-105"
        >
          {actionInProgress === 'draw' ? '⏳ Drawing Winners...' : '🎉 Draw Winners'}
        </button>
      </div>
      
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
          Raffle Details
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span style={{ color: colors.textSecondary }}>Prize: </span>
            <span style={{ color: colors.textPrimary }}>{activity.prizeDescription || 'No prize set'}</span>
          </div>
          <div>
            <span style={{ color: colors.textSecondary }}>Winners: </span>
            <span style={{ color: colors.textPrimary }}>{activity.winnerCount || 1}</span>
          </div>
          <div>
            <span style={{ color: colors.textSecondary }}>Entry Method: </span>
            <span style={{ color: colors.textPrimary }}>{activity.entryMethod || 'manual'}</span>
          </div>
          <div>
            <span style={{ color: colors.textSecondary }}>Status: </span>
            <span style={{ color: colors.textPrimary }}>{activity.status}</span>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <RaffleParticipantsTable activityId={activity.activityId} />
      
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-xl">💡</span>
          <div>
            <h5 className="font-medium text-blue-300 mb-1">How it works:</h5>
            <p className="text-sm text-blue-200">
              {activity.entryMethod === 'automatic' 
                ? 'Participants are automatically entered when the raffle starts. '
                : 'Participants must click "Enter Raffle" to join. '
              }
              Click "Draw Winners" to select {activity.winnerCount || 1} winner{(activity.winnerCount || 1) > 1 ? 's' : ''} and end the raffle!
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: colors.textSecondary }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
          Organizer Control Dashboard
        </h1>
        <p style={{ color: colors.textSecondary }}>
          Control your live activities in real-time
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: colors.accent }}>
            {stats.participantCount}
          </div>
          <div className="text-sm" style={{ color: colors.textSecondary }}>
            Participants
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: colors.accent }}>
            {activities.length}
          </div>
          <div className="text-sm" style={{ color: colors.textSecondary }}>
            Total Activities
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: colors.accent }}>
            {activities.filter(a => a.status === 'ready').length}
          </div>
          <div className="text-sm" style={{ color: colors.textSecondary }}>
            Ready
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: colors.accent }}>
            {activities.filter(a => a.status === 'completed').length}
          </div>
          <div className="text-sm" style={{ color: colors.textSecondary }}>
            Completed
          </div>
        </div>
      </div>

      {/* Active Activity Control */}
      {activeActivity ? (
        <div className="bg-white/10 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">
              {activeActivity.type === 'quiz' && '❓'}
              {activeActivity.type === 'poll' && '📊'}
              {activeActivity.type === 'raffle' && '🎁'}
            </span>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                {activeActivity.name}
              </h2>
              <p style={{ color: colors.textSecondary }}>
                Currently Active • {activeActivity.type.charAt(0).toUpperCase() + activeActivity.type.slice(1)}
              </p>
            </div>
          </div>

          {activeActivity.type === 'quiz' && renderQuizControls(activeActivity as QuizActivity)}
          {activeActivity.type === 'poll' && renderPollControls(activeActivity as PollActivity)}
          {activeActivity.type === 'raffle' && renderRaffleControls(activeActivity as RaffleActivity)}
        </div>
      ) : (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">⏸️</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
            No Active Activity
          </h3>
          <p style={{ color: colors.textSecondary }}>
            Activate an activity from the activities list to start controlling it
          </p>
        </div>
      )}

      {/* Participants Leaderboard */}
      <ParticipantsLeaderboard eventId={eventId} activeActivity={activeActivity} />
    </div>
  );
}