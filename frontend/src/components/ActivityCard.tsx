import { Activity, ActivityType, ActivityStatus } from '../types/models';

interface ActivityCardProps {
  activity: Activity;
  isActive: boolean;
  onActivate: (activityId: string) => void;
  onDeactivate: (activityId: string) => void;
  onEdit: (activityId: string) => void;
  onDelete: (activityId: string) => void;
  onViewResults?: (activityId: string) => void;
}

export default function ActivityCard({
  activity,
  isActive,
  onActivate,
  onDeactivate,
  onEdit,
  onDelete,
  onViewResults,
}: ActivityCardProps) {
  const getActivityIcon = (type: ActivityType): string => {
    switch (type) {
      case 'quiz':
        return '❓';
      case 'poll':
        return '📊';
      case 'raffle':
        return '🎁';
    }
  };

  const getActivityTypeLabel = (type: ActivityType): string => {
    switch (type) {
      case 'quiz':
        return 'Quiz';
      case 'poll':
        return 'Poll';
      case 'raffle':
        return 'Raffle';
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            📝 Draft
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ✓ Ready
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-green-600 animate-pulse"></span>
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            ✓ Completed
          </span>
        );
    }
  };

  const getActivityDetails = () => {
    switch (activity.type) {
      case 'quiz':
        return (
          <div className="text-sm text-gray-600">
            <p>{activity.questions?.length || 0} questions</p>
            {activity.scoringEnabled && <p className="text-xs">• Scoring enabled</p>}
            {activity.speedBonusEnabled && <p className="text-xs">• Speed bonus</p>}
            {activity.streakTrackingEnabled && <p className="text-xs">• Streak tracking</p>}
          </div>
        );
      case 'poll':
        return (
          <div className="text-sm text-gray-600">
            <p className="truncate">{activity.question || 'No question set'}</p>
            <p className="text-xs">{activity.options?.length || 0} options</p>
            {activity.showResultsLive && <p className="text-xs">• Live results</p>}
          </div>
        );
      case 'raffle':
        return (
          <div className="text-sm text-gray-600">
            <p className="truncate">{activity.prizeDescription || 'No prize set'}</p>
            <p className="text-xs">{activity.winnerCount} winner(s)</p>
            <p className="text-xs capitalize">• {activity.entryMethod} entry</p>
          </div>
        );
    }
  };

  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onActivate(activity.activityId);
  };

  const handleDeactivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeactivate(activity.activityId);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(activity.activityId);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${activity.name}"?`)) {
      onDelete(activity.activityId);
    }
  };

  const handleViewResults = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewResults) {
      onViewResults(activity.activityId);
    }
  };

  const canActivate = activity.status === 'ready' && !isActive;
  const canDeactivate = isActive;
  const canViewResults = activity.status === 'completed' && onViewResults;

  return (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border-2 ${
        isActive
          ? 'border-green-400 shadow-green-200'
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-500 animate-pulse"></div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{getActivityIcon(activity.type)}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {activity.name}
              </h3>
              <p className="text-sm text-gray-500">{getActivityTypeLabel(activity.type)}</p>
            </div>
          </div>
          <div className="ml-2 flex-shrink-0">{getStatusBadge(activity.status)}</div>
        </div>

        {/* Activity details */}
        <div className="mb-4">{getActivityDetails()}</div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {canActivate && (
            <button
              onClick={handleActivate}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              ▶️ Activate
            </button>
          )}
          {canDeactivate && (
            <button
              onClick={handleDeactivate}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors"
            >
              ⏸️ Deactivate
            </button>
          )}
          {canViewResults && (
            <button
              onClick={handleViewResults}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
            >
              📊 View Results
            </button>
          )}
          {!isActive && activity.status !== 'completed' && (
            <>
              <button
                onClick={handleEdit}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                title="Delete activity"
              >
                🗑️
              </button>
            </>
          )}
        </div>

        {/* Order indicator */}
        <div className="mt-3 text-xs text-gray-400">
          Order: {activity.order}
        </div>
      </div>
    </div>
  );
}
