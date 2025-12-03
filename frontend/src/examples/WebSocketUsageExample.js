import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Example usage of WebSocket hooks
 * This file demonstrates how to use the WebSocket context and hooks
 */
import { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useWebSocketEvent, useEmitEvent } from '../hooks';
/**
 * Example: Participant joining an event
 */
export const ParticipantJoinExample = ({ eventId }) => {
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
    return (_jsx("div", { children: !joined ? (_jsxs(_Fragment, { children: [_jsx("input", { value: participantName, onChange: (e) => setParticipantName(e.target.value), placeholder: "Enter your name" }), _jsx("button", { onClick: handleJoin, children: "Join Event" })] })) : (_jsx("p", { children: "Waiting for quiz to start..." })) }));
};
/**
 * Example: Organizer viewing participants
 */
export const OrganizerParticipantsExample = () => {
    const [participants, setParticipants] = useState([]);
    // Listen for participant updates
    useWebSocketEvent('participants-updated', (payload) => {
        setParticipants(payload.participants);
    });
    return (_jsxs("div", { children: [_jsxs("h2", { children: ["Participants (", participants.length, ")"] }), _jsx("ul", { children: participants.map((p) => (_jsx("li", { children: p.name }, p.id))) })] }));
};
/**
 * Example: Starting a quiz
 */
export const StartQuizExample = ({ eventId }) => {
    const [quizStarted, setQuizStarted] = useState(false);
    // Get emit function
    const emitStartQuiz = useEmitEvent('start-quiz');
    // Listen for quiz started event
    useWebSocketEvent('quiz-started', (payload) => {
        console.log('Quiz started:', payload.eventId);
        setQuizStarted(true);
    });
    const handleStartQuiz = () => {
        emitStartQuiz({ eventId });
    };
    return (_jsx("div", { children: !quizStarted ? (_jsx("button", { onClick: handleStartQuiz, children: "Start Quiz" })) : (_jsx("p", { children: "Quiz is running..." })) }));
};
/**
 * Example: Checking connection status
 */
export const ConnectionStatusExample = () => {
    const { connectionStatus } = useWebSocket();
    return (_jsx("div", { children: _jsxs("p", { children: ["Connection Status: ", connectionStatus] }) }));
};
/**
 * Example: Direct socket access (advanced usage)
 */
export const DirectSocketExample = () => {
    const { socket } = useWebSocket();
    useEffect(() => {
        if (socket) {
            console.log('Socket ID:', socket.id);
            console.log('Socket connected:', socket.connected);
        }
    }, [socket]);
    return null;
};
