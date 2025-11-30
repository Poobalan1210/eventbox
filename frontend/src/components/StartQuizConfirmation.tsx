/**
 * Confirmation dialog for starting a quiz
 * Displays Game PIN and join information
 */
import { useEffect, useState } from 'react';

interface StartQuizConfirmationProps {
  isOpen: boolean;
  eventId: string;
  eventName: string;
  questionCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function StartQuizConfirmation({
  isOpen,
  eventId,
  eventName,
  questionCount,
  onConfirm,
  onCancel,
  isLoading = false,
}: StartQuizConfirmationProps) {
  const [gamePin, setGamePin] = useState<string>('');
  const [joinLink, setJoinLink] = useState<string>('');
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

  useEffect(() => {
    if (isOpen && eventId) {
      // Fetch event details to get Game PIN
      fetch(`${apiBaseUrl}/events/${eventId}`)
        .then((res) => res.json())
        .then((data) => {
          setGamePin(data.gamePin || '');
          setJoinLink(`${frontendUrl}/join/${eventId}`);
        })
        .catch((err) => {
          console.error('Failed to fetch game PIN:', err);
        });
    }
  }, [isOpen, eventId, apiBaseUrl, frontendUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-answer-green to-answer-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚀</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Start Quiz?
          </h2>
          <p className="text-gray-600">
            {eventName}
          </p>
        </div>

        {/* Quiz Info */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <div>
                <p className="text-sm text-gray-600 font-medium">Questions</p>
                <p className="text-2xl font-bold text-gray-900">{questionCount}</p>
              </div>
            </div>
            {gamePin && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Game PIN</p>
                  <p className="text-2xl font-bold text-kahoot-purple tracking-wider">
                    {gamePin}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Join Information */}
          {joinLink && (
            <div className="bg-white/80 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-gray-600 font-medium mb-1">
                Participants can join at:
              </p>
              <p className="text-sm font-mono text-kahoot-purple break-all">
                {joinLink}
              </p>
            </div>
          )}
        </div>

        {/* What Happens Next */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 font-semibold mb-3 flex items-center gap-2">
            <span>⚡</span>
            What happens next:
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-answer-green font-bold mt-0.5">✓</span>
              <span>Quiz transitions to <strong>Live Mode</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-answer-green font-bold mt-0.5">✓</span>
              <span>Participants can join using the Game PIN</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-answer-green font-bold mt-0.5">✓</span>
              <span>You'll control when to show each question</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-answer-red font-bold mt-0.5">⚠</span>
              <span>Questions <strong>cannot be edited</strong> once started</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors min-h-[48px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-answer-green to-answer-blue text-white rounded-lg hover:opacity-90 transition-all min-h-[48px] font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Starting...
              </span>
            ) : (
              '🚀 Start Quiz'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
