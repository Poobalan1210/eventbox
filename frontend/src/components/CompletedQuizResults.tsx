import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ParticipantScore } from '../types/models';

interface CompletedQuizResultsProps {
  eventId: string;
  eventName: string;
}

export default function CompletedQuizResults({ eventId, eventName }: CompletedQuizResultsProps) {
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const [participants, setParticipants] = useState<ParticipantScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Fetch participants for this event
        const response = await fetch(`${apiBaseUrl}/events/${eventId}/participants`);
        
        if (!response.ok) {
          throw new Error('Failed to load results');
        }

        const data = await response.json();
        const sortedParticipants = data.participants
          .sort((a: ParticipantScore, b: ParticipantScore) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.totalAnswerTime - b.totalAnswerTime;
          })
          .map((participant: ParticipantScore, index: number) => ({
            ...participant,
            rank: index + 1,
          }));

        setParticipants(sortedParticipants);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [eventId, apiBaseUrl]);

  const exportToCSV = () => {
    const headers = ['Rank', 'Name', 'Score', 'Time (seconds)'];
    const rows = participants.map(p => [
      p.rank,
      p.name,
      p.score,
      (p.totalAnswerTime / 1000).toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventName.replace(/\s+/g, '_')}_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <p className="text-white mt-4">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <div className="bg-answer-red/20 border-2 border-answer-red rounded-lg p-6">
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-white/80 hover:text-white mb-4 text-sm font-medium transition-colors"
        >
          ← Back to Dashboard
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Quiz Results</h1>
            <p className="text-white/80">
              Event: <span className="font-semibold">{eventName}</span>
            </p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={participants.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white font-medium transition-colors"
          >
            <span>📥</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Results Table */}
      {participants.length > 0 ? (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20 bg-white/5">
                  <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-white uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-white uppercase tracking-wider">
                    Time (seconds)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {participants.map((participant) => (
                  <tr
                    key={`${participant.name}-${participant.rank}`}
                    className={`transition-colors ${
                      participant.rank <= 3
                        ? 'bg-white/5 hover:bg-white/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRankIcon(participant.rank) ? (
                          <span className="text-2xl">{getRankIcon(participant.rank)}</span>
                        ) : (
                          <span className="text-lg font-semibold text-white">
                            #{participant.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-base font-medium text-white">
                        {participant.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xl font-bold text-white">
                        {participant.score}
                      </span>
                      <span className="text-sm text-white/70 ml-1">pts</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-base text-white/90">
                        {(participant.totalAnswerTime / 1000).toFixed(2)}s
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center">
          <p className="text-white/80">No participants joined this quiz</p>
        </div>
      )}
    </div>
  );
}
