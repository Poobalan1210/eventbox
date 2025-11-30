/**
 * Visual indicator showing the current quiz mode
 */
import { EventStatus } from '../types/models';

interface ModeIndicatorProps {
  status: EventStatus;
  className?: string;
}

interface ModeConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const MODE_CONFIGS: Record<EventStatus, ModeConfig> = {
  draft: {
    label: 'Draft',
    icon: '📝',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    description: 'Quiz is being created',
  },
  setup: {
    label: 'Setup Mode',
    icon: '🛠️',
    color: 'text-blue-700',
    bgColor: 'bg-answer-blue/20',
    borderColor: 'border-answer-blue',
    description: 'Add and configure questions',
  },
  live: {
    label: 'Live Mode',
    icon: '🔴',
    color: 'text-red-700',
    bgColor: 'bg-answer-red/20',
    borderColor: 'border-answer-red',
    description: 'Quiz is active',
  },
  completed: {
    label: 'Completed',
    icon: '✅',
    color: 'text-green-700',
    bgColor: 'bg-answer-green/20',
    borderColor: 'border-answer-green',
    description: 'Quiz has ended',
  },
  waiting: {
    label: 'Waiting',
    icon: '⏳',
    color: 'text-yellow-700',
    bgColor: 'bg-answer-yellow/20',
    borderColor: 'border-answer-yellow',
    description: 'Waiting for participants',
  },
  active: {
    label: 'Active',
    icon: '▶️',
    color: 'text-green-700',
    bgColor: 'bg-answer-green/20',
    borderColor: 'border-answer-green',
    description: 'Quiz in progress',
  },
};

export default function ModeIndicator({ status, className = '' }: ModeIndicatorProps) {
  const config = MODE_CONFIGS[status] || MODE_CONFIGS.draft;

  return (
    <div
      className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* Animated pulse indicator for live/active modes */}
        {(status === 'live' || status === 'active') && (
          <div className="relative">
            <div className="w-3 h-3 bg-answer-red rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-answer-red rounded-full animate-ping opacity-75"></div>
          </div>
        )}
        
        {/* Mode icon and label */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <p className={`font-bold ${config.color}`}>{config.label}</p>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
