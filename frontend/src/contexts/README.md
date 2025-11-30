# WebSocket Connection Manager

This directory contains the WebSocket connection management implementation for the Live Quiz Event System.

## Overview

The WebSocket connection manager provides:
- Automatic connection initialization
- Exponential backoff reconnection logic
- Type-safe event emission and subscription
- Connection status monitoring
- User-friendly error handling

## Components

### WebSocketContext

The main context that manages the Socket.io connection.

**Features:**
- Automatic connection on mount
- Exponential backoff reconnection (1s → 2s → 4s → 8s → ... up to 30s)
- Maximum 10 reconnection attempts
- Connection status tracking (disconnected, connecting, connected, error)

**Configuration:**
Set the WebSocket server URL via environment variable:
```env
VITE_WS_URL=http://localhost:3000
```

### Custom Hooks

#### `useWebSocket()`
Access the WebSocket context directly.

```typescript
const { socket, connectionStatus, emit, on } = useWebSocket();
```

#### `useWebSocketEmit()`
Get the emit function to send events to the server.

```typescript
const emit = useWebSocketEmit();
emit('join-event', { eventId: '123', participantName: 'John' });
```

#### `useWebSocketEvent(event, handler)`
Subscribe to server events with automatic cleanup.

```typescript
useWebSocketEvent('participants-updated', (payload) => {
  console.log('Participants:', payload.participants);
});
```

#### `useEmitEvent(event)`
Get a callback function for a specific event.

```typescript
const emitJoinEvent = useEmitEvent('join-event');
emitJoinEvent({ eventId: '123', participantName: 'John' });
```

### ConnectionStatus Component

A visual indicator that displays connection status to users.

**Behavior:**
- Hidden when connected (normal state)
- Shows "Connecting..." when establishing connection
- Shows "Connection lost. Reconnecting..." when disconnected
- Shows "Connection error. Retrying..." on errors

## Usage Examples

### Participant Joining an Event

```typescript
import { useEmitEvent, useWebSocketEvent } from '../hooks';

const ParticipantJoin = ({ eventId }) => {
  const emitJoinEvent = useEmitEvent('join-event');
  
  useWebSocketEvent('participant-joined', (payload) => {
    console.log('Joined successfully:', payload.participantName);
  });
  
  const handleJoin = (name: string) => {
    emitJoinEvent({ eventId, participantName: name });
  };
  
  return <button onClick={() => handleJoin('John')}>Join</button>;
};
```

### Organizer Starting Quiz

```typescript
import { useEmitEvent, useWebSocketEvent } from '../hooks';

const OrganizerDashboard = ({ eventId }) => {
  const emitStartQuiz = useEmitEvent('start-quiz');
  
  useWebSocketEvent('quiz-started', (payload) => {
    console.log('Quiz started:', payload.eventId);
  });
  
  return (
    <button onClick={() => emitStartQuiz({ eventId })}>
      Start Quiz
    </button>
  );
};
```

### Listening to Multiple Events

```typescript
import { useWebSocketEvent } from '../hooks';

const QuizParticipant = () => {
  useWebSocketEvent('question-displayed', (payload) => {
    console.log('New question:', payload.question);
  });
  
  useWebSocketEvent('timer-tick', (payload) => {
    console.log('Time remaining:', payload.remainingSeconds);
  });
  
  useWebSocketEvent('leaderboard-updated', (payload) => {
    console.log('Leaderboard:', payload.leaderboard);
  });
  
  return <div>Quiz Interface</div>;
};
```

## Error Handling

The WebSocket manager handles errors gracefully:

1. **Connection Errors**: Automatically retries with exponential backoff
2. **Disconnections**: Attempts to reconnect unless server initiated
3. **Emit Failures**: Logs warning if trying to emit while disconnected
4. **Max Retries**: Stops after 10 failed reconnection attempts

## Connection Status States

- `disconnected`: Not connected to server
- `connecting`: Attempting to establish connection
- `connected`: Successfully connected and ready
- `error`: Connection error occurred, retrying

## Type Safety

All WebSocket events are fully typed using TypeScript interfaces:

```typescript
interface ClientToServerEvents {
  'join-event': (payload: JoinEventPayload) => void;
  'start-quiz': (payload: StartQuizPayload) => void;
  // ... more events
}

interface ServerToClientEvents {
  'participant-joined': (payload: ParticipantJoinedPayload) => void;
  'quiz-started': (payload: QuizStartedPayload) => void;
  // ... more events
}
```

This ensures compile-time checking of event names and payload structures.

## Testing

To test the WebSocket connection:

1. Start the backend server: `npm run dev` (in backend directory)
2. Start the frontend: `npm run dev` (in frontend directory)
3. Open browser console to see connection logs
4. Check the ConnectionStatus indicator at the top of the page

## Troubleshooting

**Connection fails immediately:**
- Check that backend server is running
- Verify VITE_WS_URL is correct
- Check browser console for CORS errors

**Frequent disconnections:**
- Check network stability
- Verify server is not timing out connections
- Check server logs for errors

**Events not received:**
- Verify event names match exactly (case-sensitive)
- Check that you're in the correct room (eventId)
- Ensure handler is registered before event is emitted
