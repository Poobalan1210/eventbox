/**
 * Connection Status Indicator Component
 * Displays the current WebSocket connection status to the user
 */
import React from 'react';
import { useWebSocket, ConnectionStatus as Status } from '../contexts/WebSocketContext';

const ConnectionStatus: React.FC = () => {
  const { connectionStatus } = useWebSocket();

  // Don't show anything when connected (normal state)
  if (connectionStatus === 'connected') {
    return null;
  }

  const getStatusConfig = (status: Status) => {
    switch (status) {
      case 'connecting':
        return {
          text: 'Connecting...',
          bgColor: 'bg-yellow-500',
          icon: '⟳',
        };
      case 'disconnected':
        return {
          text: 'Connection lost. Reconnecting...',
          bgColor: 'bg-orange-500',
          icon: '⚠',
        };
      case 'error':
        return {
          text: 'Connection error. Retrying...',
          bgColor: 'bg-red-500',
          icon: '✕',
        };
      default:
        return {
          text: 'Unknown status',
          bgColor: 'bg-gray-500',
          icon: '?',
        };
    }
  };

  const config = getStatusConfig(connectionStatus);

  return (
    <div
      className={`fixed top-0 left-0 right-0 ${config.bgColor} text-white px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium z-50 shadow-md`}
      role="alert"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-1 sm:gap-2">
        <span className="animate-pulse text-base sm:text-lg">{config.icon}</span>
        <span className="text-sm sm:text-base">{config.text}</span>
      </span>
    </div>
  );
};

export default ConnectionStatus;
