/**
 * Custom hooks for WebSocket event handling
 */
import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../types/websocket.js';

/**
 * Hook to emit events to the server
 */
export const useWebSocketEmit = () => {
  const { emit } = useWebSocket();
  return emit;
};

/**
 * Hook to subscribe to server events
 * Automatically handles cleanup on unmount
 */
export const useWebSocketEvent = <K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
) => {
  const { on } = useWebSocket();

  useEffect(() => {
    const cleanup = on(event, handler);
    return cleanup;
  }, [event, handler, on]);
};

/**
 * Hook to emit a specific event with a callback wrapper
 */
export const useEmitEvent = <K extends keyof ClientToServerEvents>(
  event: K
) => {
  const emit = useWebSocketEmit();

  return useCallback(
    (payload: Parameters<ClientToServerEvents[K]>[0]) => {
      emit(event, payload);
    },
    [emit, event]
  );
};
