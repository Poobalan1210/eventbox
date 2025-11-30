import { Link } from 'react-router-dom';

export interface QuizCardData {
  eventId: string;
  name: string;
  status: 'live' | 'upcoming' | 'completed';
  participantCount: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  visibility: 'private' | 'public';
  topic?: string;
  description?: string;
  lastModified: number;
}

interface QuizCardProps {
  quiz: QuizCardData;
  onSelect?: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
  onDuplicate?: (quizId: string) => void;
}

export default function QuizCard({ quiz, onSelect, onDelete, onDuplicate }: QuizCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = () => {
    switch (quiz.status) {
      case 'live':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-red-600 animate-pulse"></span>
            Live
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            📅 Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            ✓ Completed
          </span>
        );
    }
  };

  const getVisibilityIcon = () => {
    return quiz.visibility === 'public' ? (
      <span className="text-gray-500" title="Public">
        🌐
      </span>
    ) : (
      <span className="text-gray-500" title="Private">
        🔒
      </span>
    );
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(quiz.eventId);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(quiz.eventId);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDuplicate) {
      onDuplicate(quiz.eventId);
    }
  };

  const isLive = quiz.status === 'live';
  
  return (
    <Link
      to={`/organizer/${quiz.eventId}`}
      onClick={handleCardClick}
      className={`block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border-2 ${
        isLive 
          ? 'border-red-400 shadow-red-200 hover:border-red-500 animate-pulse-border' 
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      {/* Live indicator bar */}
      {isLive && (
        <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-500 animate-pulse"></div>
      )}
      
      <div className="p-5">
        {/* Header with status badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-semibold truncate mb-1 ${
              isLive ? 'text-red-600' : 'text-gray-900'
            }`}>
              {quiz.name}
            </h3>
            {quiz.topic && (
              <p className="text-sm text-gray-600 truncate">{quiz.topic}</p>
            )}
          </div>
          <div className="ml-2 flex-shrink-0">
            {getStatusBadge()}
          </div>
        </div>

        {/* Description */}
        {quiz.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {quiz.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span>{quiz.participantCount} participants</span>
          </div>
          <div className="flex items-center gap-1">
            {getVisibilityIcon()}
            <span className="capitalize">{quiz.visibility}</span>
          </div>
        </div>

        {/* Date information */}
        <div className="text-xs text-gray-500">
          {quiz.status === 'live' && quiz.startedAt && (
            <p>Started: {formatTime(quiz.startedAt)}</p>
          )}
          {quiz.status === 'completed' && quiz.completedAt && (
            <p>Completed: {formatDate(quiz.completedAt)}</p>
          )}
          {quiz.status === 'upcoming' && (
            <p>Created: {formatDate(quiz.createdAt)}</p>
          )}
          <p className="mt-1">Last modified: {formatDate(quiz.lastModified)}</p>
        </div>

        {/* Action buttons */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/organizer/${quiz.eventId}`;
            }}
            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            {quiz.status === 'live' ? 'Manage' : quiz.status === 'upcoming' ? 'Edit' : 'View'}
          </button>
          {onDuplicate && quiz.status === 'upcoming' && (
            <button
              onClick={handleDuplicate}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              title="Duplicate quiz"
            >
              📋
            </button>
          )}
          {onDelete && quiz.status === 'upcoming' && (
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
              title="Delete quiz"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
