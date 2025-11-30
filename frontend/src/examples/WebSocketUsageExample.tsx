/**
 * Example usage of WebSocket hooks
 * This file demonstrates how to use the WebSocket context and hooks
 */
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useWebSocketEvent, useEmitEvent } from '../hooks';
import type { ParticipantsUpdatedPayload, QuizStartedPayload } from '../types/websocket.js';

/**
 * Example: Participant joining an event
 */
export const ParticipantJoinExample: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [participantName, setParticipantName] = useState('');
  const [joined, setJoined] = useState(false);
  
  // Get emit function
  const emitJoinEvent = useEmitEvent('join-event');
  
  // Listen for join confirmation
  useWebSocketEvent('participant-joined', (payload) => {
    console.log('Joined as:', payload.participantName);
    setJoined(true);
  });
  
  const handleJoin = () => {
    emitJoinEvent({ eventId, participantName });
  };
  
  return (
    <div>
      {!joined ? (
        <>
          <input
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Enter your name"
          />
          <button onClick={handleJoin}>Join Event</button>
        </>
      ) : (
        <p>Waiting for quiz to start...</p>
      )}
    </div>
  );
};

/**
 * Example: Organizer viewing participants
 */
export const OrganizerParticipantsExample: React.FC<{ eventId: string }> = () => {
  const [participants, setParticipants] = useState<ParticipantsUpdatedPayload['participants']>([]);
  
  // Listen for participant updates
  useWebSocketEvent('participants-updated', (payload) => {
    setParticipants(payload.participants);
  });
  
  return (
    <div>
      <h2>Participants ({participants.length})</h2>
      <ul>
        {participants.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Example: Starting a quiz
 */
export const StartQuizExample: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [quizStarted, setQuizStarted] = useState(false);
  
  // Get emit function
  const emitStartQuiz = useEmitEvent('start-quiz');
  
  // Listen for quiz started event
  useWebSocketEvent('quiz-started', (payload: QuizStartedPayload) => {
    console.log('Quiz started:', payload.eventId);
    setQuizStarted(true);
  });
  
  const handleStartQuiz = () => {
    emitStartQuiz({ eventId });
  };
  
  return (
    <div>
      {!quizStarted ? (
        <button onClick={handleStartQuiz}>Start Quiz</button>
      ) : (
        <p>Quiz is running...</p>
      )}
    </div>
  );
};

/**
 * Example: Checking connection status
 */
export const ConnectionStatusExample: React.FC = () => {
  const { connectionStatus } = useWebSocket();
  
  return (
    <div>
      <p>Connection Status: {connectionStatus}</p>
    </div>
  );
};

/**
 * Example: Direct socket access (advanced usage)
 */
export const DirectSocketExample: React.FC = () => {
  const { socket } = useWebSocket();
  
  useEffect(() => {
    if (socket) {
      console.log('Socket ID:', socket.id);
      console.log('Socket connected:', socket.connected);
    }
  }, [socket]);
  
  return null;
};
