/**
 * NicknameGenerator Component
 * Displays nickname suggestions and allows custom name input
 */
import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { NicknameSuggestionsPayload } from '../types/websocket';

interface NicknameGeneratorProps {
  onSelectName: (name: string) => void;
}

export const NicknameGenerator: React.FC<NicknameGeneratorProps> = ({
  onSelectName,
}) => {
  const { socket, emit, on } = useWebSocket();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [customName, setCustomName] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Request initial suggestions when component mounts
  useEffect(() => {
    if (socket) {
      requestSuggestions();
    }
  }, [socket]);

  // Listen for nickname suggestions
  useEffect(() => {
    if (!socket) return;

    const unsubscribe = on('nickname-suggestions', (payload: NicknameSuggestionsPayload) => {
      setSuggestions(payload.suggestions);
    });

    return unsubscribe;
  }, [socket, on]);

  const requestSuggestions = () => {
    emit('get-nickname-suggestions', { count: 3 });
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSelectName(suggestion);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim().length > 0) {
      onSelectName(customName.trim());
    }
  };

  const handleRefresh = () => {
    requestSuggestions();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!isCustomMode ? (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Choose a nickname
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Pick one of these fun suggestions or create your own
            </p>
          </div>

          {/* Nickname Suggestions */}
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200 active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Suggestions
          </button>

          {/* Custom Name Option */}
          <button
            onClick={() => setIsCustomMode(true)}
            className="w-full px-4 py-2 text-purple-600 font-medium hover:text-purple-700 transition-colors duration-200"
          >
            Or enter a custom name
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Enter your name
            </h3>
          </div>

          {/* Custom Name Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Your name"
              maxLength={30}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
              autoFocus
            />

            <button
              type="submit"
              disabled={customName.trim().length === 0}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Continue
            </button>

            {/* Back to Suggestions */}
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className="w-full px-4 py-2 text-purple-600 font-medium hover:text-purple-700 transition-colors duration-200"
            >
              ← Back to suggestions
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
