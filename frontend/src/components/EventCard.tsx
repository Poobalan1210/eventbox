import { EventStatus, EventVisibility } from '../types/models';

interface EventCardProps {
  event: {
    eventId: string;
    name: string;
    gamePin?: string;
    status: EventStatus;
    visibility?: EventVisibility;
    participantCount?: number;
    activityCount?: number;
    activeActivityName?: string;
    topic?: string;
    description?: string;
    createdAt: number;
    lastModified?: number;
    startedAt?: number;
    completedAt?: number;
  };
  onSelect: (eventId: string) => void;
  onDelete: (eventId: string) => void;
}

export default function EventCard({ event, onSelect, onDelete }: EventCardProps) {
  const getStatusBadge = () => {
    switch (event.status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
            📝 Draft
          </span>
        );
      case 'setup':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
            ⚙️ Setup
          </span>
        );
      case 'live':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 mr-1 rounded-full bg-green-600 animate-pulse"></span>
            Live
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
            ✓ Completed
          </span>
        );
      default:
        return null;
    }
  };

  const getVisibilityBadge = () => {
    if (!event.visibility) return null;
    
    return event.visibility === 'private' ? (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
        🔒 Private
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
        🌐 Public
      </span>
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(event.eventId);
  };

  return (
    <div
      onClick={() => onSelect(event.eventId)}
      className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all cursor-pointer border-2 border-transparent hover:border-answer-yellow shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white truncate mb-2">{event.name}</h3>
          <div className="flex flex-wrap gap-2">
            {getStatusBadge()}
            {getVisibilityBadge()}
          </div>
        </div>
      </div>

      {/* Game Pin */}
      {event.gamePin && (
        <div className="mb-4 p-3 bg-white/10 rounded-lg">
          <p className="text-white/70 text-xs mb-1">Join Code</p>
          <p className="text-white font-mono font-bold text-lg">{event.gamePin}</p>
        </div>
      )}

      {/* Active Activity */}
      {event.activeActivityName && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <p className="text-green-100 text-sm font-medium">
              Active: {event.activeActivityName}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-white/70 text-xs mb-1">Activities</p>
          <p className="text-white font-semibold text-lg">
            {event.activityCount || 0}
          </p>
        </div>
        <div>
          <p className="text-white/70 text-xs mb-1">Participants</p>
          <p className="text-white font-semibold text-lg">
            {event.participantCount || 0}
          </p>
        </div>
      </div>

      {/* Topic & Description */}
      {event.topic && (
        <div className="mb-2">
          <p className="text-white/70 text-xs">Topic</p>
          <p className="text-white text-sm">{event.topic}</p>
        </div>
      )}
      {event.description && (
        <div className="mb-4">
          <p className="text-white/70 text-xs">Description</p>
          <p className="text-white text-sm line-clamp-2">{event.description}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="text-white/60 text-xs">
          Created {formatDate(event.createdAt)}
        </div>
        <button
          onClick={handleDelete}
          className="text-answer-red hover:text-answer-red/80 transition-colors text-sm font-medium"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
