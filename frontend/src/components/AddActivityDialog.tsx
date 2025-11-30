import { useState } from 'react';
import { ActivityType } from '../types/models';
import { useTheme } from '../contexts/ThemeContext';

interface AddActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: ActivityType, name: string) => void;
}

export default function AddActivityDialog({ isOpen, onClose, onAdd }: AddActivityDialogProps) {
  const { colors } = useTheme();
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [activityName, setActivityName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType && activityName.trim()) {
      onAdd(selectedType, activityName.trim());
      // Reset form
      setSelectedType(null);
      setActivityName('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setActivityName('');
    onClose();
  };

  const activityTypes = [
    {
      type: 'quiz' as ActivityType,
      icon: '❓',
      title: 'Quiz',
      description: 'Multiple choice questions with scoring and leaderboards',
      features: ['Timed questions', 'Speed-based scoring', 'Streak tracking', 'Leaderboards'],
    },
    {
      type: 'poll' as ActivityType,
      icon: '📊',
      title: 'Poll',
      description: 'Gather opinions and feedback from participants',
      features: ['Multiple choice voting', 'Live results', 'Anonymous responses', 'Real-time updates'],
    },
    {
      type: 'raffle' as ActivityType,
      icon: '🎁',
      title: 'Raffle',
      description: 'Random winner selection for prizes and giveaways',
      features: ['Automatic entry', 'Random selection', 'Multiple winners', 'Winner announcements'],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm border"
        style={{ 
          backgroundColor: colors.cardBg, 
          borderColor: colors.cardBorder 
        }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 border-b px-6 py-4 flex items-center justify-between backdrop-blur-sm"
          style={{ 
            backgroundColor: colors.cardBg, 
            borderColor: colors.cardBorder 
          }}
        >
          <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            Add New Activity
          </h2>
          <button
            onClick={handleClose}
            className="text-2xl leading-none transition-colors"
            style={{ 
              color: colors.textSecondary,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.textPrimary}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Activity Type Selection */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
              Choose Activity Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activityTypes.map((activity) => (
                <button
                  key={activity.type}
                  type="button"
                  onClick={() => setSelectedType(activity.type)}
                  className="p-4 rounded-lg border-2 transition-all text-left backdrop-blur-sm"
                  style={{
                    borderColor: selectedType === activity.type ? colors.accent : colors.cardBorder,
                    backgroundColor: selectedType === activity.type 
                      ? `${colors.accent}20` 
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedType !== activity.type) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = colors.accent + '80';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedType !== activity.type) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = colors.cardBorder;
                    }
                  }}
                >
                  <div className="text-4xl mb-2">{activity.icon}</div>
                  <h4 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>
                    {activity.title}
                  </h4>
                  <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                    {activity.description}
                  </p>
                  <ul className="space-y-1">
                    {activity.features.map((feature, idx) => (
                      <li key={idx} className="text-xs flex items-center gap-1" style={{ color: colors.textSecondary }}>
                        <span style={{ color: colors.accent }}>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Name Input */}
          {selectedType && (
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Name Your Activity
              </h3>
              <input
                type="text"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder={`e.g., "Opening Quiz", "Feedback Poll", "Prize Draw"`}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 backdrop-blur-sm transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: colors.cardBorder,
                  color: colors.textPrimary,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.accent;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.accent}40`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.cardBorder;
                  e.currentTarget.style.boxShadow = 'none';
                }}
                autoFocus
                required
              />
              <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
                Give your activity a descriptive name to help you organize your event.
              </p>
            </div>
          )}

          {/* Footer */}
          <div 
            className="sticky bottom-0 border-t px-6 py-4 flex items-center justify-end gap-3 backdrop-blur-sm"
            style={{ 
              backgroundColor: `${colors.cardBg}E6`, 
              borderColor: colors.cardBorder 
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border rounded-lg transition-colors backdrop-blur-sm"
              style={{
                color: colors.textPrimary,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: colors.cardBorder,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedType || !activityName.trim()}
              className="px-6 py-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
              style={{
                backgroundColor: !selectedType || !activityName.trim() 
                  ? 'rgba(128, 128, 128, 0.5)' 
                  : colors.accent,
                color: !selectedType || !activityName.trim() 
                  ? colors.textSecondary 
                  : '#FFFFFF',
              }}
              onMouseEnter={(e) => {
                if (selectedType && activityName.trim()) {
                  e.currentTarget.style.backgroundColor = colors.accent + 'CC';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedType && activityName.trim()) {
                  e.currentTarget.style.backgroundColor = colors.accent;
                }
              }}
            >
              Add Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
