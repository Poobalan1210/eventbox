import { jsx as _jsx } from "react/jsx-runtime";
/**
 * WebSocket Context - Manages Socket.io connection with automatic reconnection
 *
 * Supports activity lifecycle events:
 * - activity-activated: When an organizer activates an activity
 * - activity-deactivated: When an organizer deactivates an activity
 * - activity-updated: When activity configuration changes
 * - waiting-for-activity: When no activity is currently active
 *
 * Supports poll events:
 * - poll-started: When a poll activity begins
 * - poll-vote-submitted: When a participant votes
 * - poll-results-updated: When poll results change
 * - poll-ended: When a poll activity ends
 *
 * Supports raffle events:
 * - raffle-started: When a raffle activity begins
 * - raffle-entry-confirmed: When a participant enters
 * - raffle-drawing: When winners are being drawn
 * - raffle-winners-announced: When winners are revealed
 * - raffle-ended: When a raffle activity ends
 */
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
const WebSocketContext = createContext(null);
export const WebSocketProvider = ({ children, url = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001', }) => {
    const [socket, setSocket] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const reconnectAttempts = useRef(0);
    const reconnectTimeout = useRef(null);
    const maxReconnectAttempts = 10;
    // Calculate exponential backoff delay
    const getReconnectDelay = useCallback((attempt) => {
        const baseDelay = 1000; // 1 second
        const maxDelay = 30000; // 30 seconds
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        return delay;
    }, []);
    // Initialize socket connection
    const initializeSocket = useCallback(() => {
        setConnectionStatus('connecting');
        const newSocket = io(url, {
            transports: ['websocket', 'polling'],
            reconnection: false, // We'll handle reconnection manually
        });
        // Connection successful
        newSocket.on('connect', () => {
            console.log('WebSocket connected:', newSocket.id);
            setConnectionStatus('connected');
            reconnectAttempts.current = 0;
            // Clear any pending reconnect timeout
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
                reconnectTimeout.current = null;
            }
        });
        // Connection error
        newSocket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setConnectionStatus('error');
            // Attempt reconnection with exponential backoff
            if (reconnectAttempts.current < maxReconnectAttempts) {
                const delay = getReconnectDelay(reconnectAttempts.current);
                console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
                reconnectTimeout.current = setTimeout(() => {
                    reconnectAttempts.current++;
                    newSocket.connect();
                }, delay);
            }
            else {
                console.error('Max reconnection attempts reached');
            }
        });
        // Disconnection
        newSocket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
            setConnectionStatus('disconnected');
            // Attempt automatic reconnection for unexpected disconnects
            if (reason === 'io server disconnect') {
                // Server initiated disconnect, don't reconnect automatically
                return;
            }
            if (reconnectAttempts.current < maxReconnectAttempts) {
                const delay = getReconnectDelay(reconnectAttempts.current);
                console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
                reconnectTimeout.current = setTimeout(() => {
                    reconnectAttempts.current++;
                    newSocket.connect();
                }, delay);
            }
        });
        setSocket(newSocket);
        return newSocket;
    }, [url, getReconnectDelay]);
    // Initialize socket on mount
    useEffect(() => {
        const socketInstance = initializeSocket();
        // Add debug logging for activity lifecycle events in development
        if (import.meta.env.DEV) {
            socketInstance.on('activity-activated', (payload) => {
                console.log('🎯 Activity activated:', payload);
            });
            socketInstance.on('activity-deactivated', (payload) => {
                console.log('⏸️ Activity deactivated:', payload);
            });
            socketInstance.on('activity-updated', (payload) => {
                console.log('🔄 Activity updated:', payload);
            });
            socketInstance.on('waiting-for-activity', (payload) => {
                console.log('⏳ Waiting for activity:', payload);
            });
            // Poll events
            socketInstance.on('poll-started', (payload) => {
                console.log('📊 Poll started:', payload);
            });
            socketInstance.on('poll-vote-submitted', (payload) => {
                console.log('✅ Poll vote submitted:', payload);
            });
            socketInstance.on('poll-results-updated', (payload) => {
                console.log('📈 Poll results updated:', payload);
            });
            socketInstance.on('poll-ended', (payload) => {
                console.log('🏁 Poll ended:', payload);
            });
            // Raffle events
            socketInstance.on('raffle-started', (payload) => {
                console.log('🎟️ Raffle started:', payload);
            });
            socketInstance.on('raffle-entry-confirmed', (payload) => {
                console.log('✅ Raffle entry confirmed:', payload);
            });
            socketInstance.on('raffle-drawing', (payload) => {
                console.log('🎲 Raffle drawing:', payload);
            });
            socketInstance.on('raffle-winners-announced', (payload) => {
                console.log('🎉 Raffle winners announced:', payload);
            });
            socketInstance.on('raffle-ended', (payload) => {
                console.log('🏁 Raffle ended:', payload);
            });
        }
        // Cleanup on unmount
        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            socketInstance.disconnect();
        };
    }, [initializeSocket]);
    // Emit event to server
    const emit = useCallback((event, payload) => {
        if (socket && socket.connected) {
            socket.emit(event, payload);
        }
        else {
            console.warn(`Cannot emit ${String(event)}: socket not connected`);
        }
    }, [socket]);
    // Subscribe to server events
    const on = useCallback((event, handler) => {
        if (socket) {
            socket.on(event, handler);
            // Return cleanup function
            return () => {
                socket.off(event, handler);
            };
        }
        // Return no-op cleanup if socket not available
        return () => { };
    }, [socket]);
    const value = {
        socket,
        connectionStatus,
        emit,
        on,
    };
    return (_jsx(WebSocketContext.Provider, { value: value, children: children }));
};
/**
 * Hook to access WebSocket context
 */
export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
