import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface QuizTabInfo {
  eventId: string;
  name: string;
  status: string;
  questionCount: number;
  lastAccessed: number;
}

/**
 * Component to display recently accessed quiz tabs
 * Helps users navigate between multiple quizzes they have open
 */
export default function ActiveQuizTabs() {
  const navigate = useNavigate();
  const [recentQuizzes, setRecentQuizzes] = useState<QuizTabInfo[]>([]);

  useEffect(() => {
    // Load recent quiz tabs from sessionStorage
    const loadRecentQuizzes = () => {
      const quizzes: QuizTabInfo[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('nav_quiz_') && !key.includes('_lastView')) {
          try {
            const value = sessionStorage.getItem(key);
            if (value) {
              const quizInfo = JSON.parse(value);
              const eventId = key.replace('nav_quiz_', '');
              quizzes.push({ ...quizInfo, eventId });
            }
          } catch (error) {
            console.error('Failed to parse quiz info:', error);
          }
        }
      }

      // Sort by last accessed (most recent first)
      quizzes.sort((a, b) => b.lastAccessed - a.lastAccessed);
      
      // Keep only the 5 most recent
      setRecentQuizzes(quizzes.slice(0, 5));
    };

    loadRecentQuizzes();

    // Refresh every 5 seconds to catch updates from other tabs
    const interval = setInterval(loadRecentQuizzes, 5000);
    return () => clearInterval(interval);
  }, []);

  if (recentQuizzes.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'waiting':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return '🔴 Live';
      case 'waiting':
        return '⏸️ Setup';
      case 'completed':
        return '✓ Done';
      default:
        return status;
    }
  };

  const formatLastAccessed = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return 'Earlier';
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
      <h3 className="text-white font-semibold mb-3 flex items-center">
        <span className="mr-2">📑</span>
        Recently Accessed Quizzes
      </h3>
      <div className="space-y-2">
        {recentQuizzes.map((quiz) => (
          <button
            key={quiz.eventId}
            onClick={() => navigate(`/organizer/${quiz.eventId}`)}
            className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 hover:border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{quiz.name}</p>
                <p className="text-white/60 text-sm">
                  {quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''} • {formatLastAccessed(quiz.lastAccessed)}
                </p>
              </div>
              <span className={`ml-3 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(quiz.status)}`}>
                {getStatusLabel(quiz.status)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
