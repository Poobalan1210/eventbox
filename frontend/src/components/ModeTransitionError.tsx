/**
 * Error display component for mode transition failures
 */
interface ModeTransitionErrorProps {
  error: string;
  onRetry?: () => void;
  onDismiss: () => void;
}

export default function ModeTransitionError({
  error,
  onRetry,
  onDismiss,
}: ModeTransitionErrorProps) {
  return (
    <div className="bg-answer-red/20 border-2 border-answer-red rounded-lg p-4 mb-6 animate-shake">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">⚠️</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-red-900 mb-1">Mode Transition Failed</h3>
          <p className="text-red-800 text-sm mb-3">{error}</p>
          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-answer-red text-white rounded-lg hover:bg-answer-red/80 transition-colors text-sm font-medium"
              >
                Retry
              </button>
            )}
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-white/50 text-red-900 rounded-lg hover:bg-white/70 transition-colors text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
