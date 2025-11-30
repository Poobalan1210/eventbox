/**
 * Example: Using ParticipantActivityView in ParticipantView page
 * 
 * This example shows how to integrate the ParticipantActivityView component
 * into the participant flow, handling the join process and then displaying
 * the unified activity view.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWebSocket } from '../contexts/WebSocketContext';
import ParticipantActivityView from './ParticipantActivityView';
import { NicknameGenerator } from './NicknameGenerator';
import EventNotFound from '../pages/EventNotFound';
import type { ParticipantJoinedPayload } from '../types/websocket';

type JoinState = 'joining' | 'joined' | 'error';

export default function ParticipantViewExample() {
  const { eventId } = useParams<{ eventId: string }>();
  const { emit, on, connectionStatus } = useWebSocket();
  
  const [participantName, setParticipantName] = useState('');
  const [joinState, setJoinState] = useState<JoinState>('joining');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [eventNotFound, setEventNotFound] = useState(false);

  const MAX_NAME_LENGTH = 50;

  // Listen for WebSocket errors
  useEffect(() => {
    const cleanup = on('error', (payload: any) => {
      console.error('WebSocket error:', payload);
      const errorMessage = payload.message || 'An error occurred';
      
      if (errorMessage.includes('Event not found') || errorMessage.includes('not found')) {
        setEventNotFound(true);
        setJoinState('error');
      } else {
        setError(errorMessage);
      }
      
      setIsSubmitting(false);
    });

    return cleanup;
  }, [on]);

  // Listen for participant-joined confirmation
  useEffect(() => {
    const cleanup = on('participant-joined', (payload: ParticipantJoinedPayload) => {
      console.log('✅ Participant joined successfully:', payload);
      
      if (payload.participantId && payload.participantName) {
        setJoinState('joined');
        setError('');
      }
      setIsSubmitting(false);
    });

    return cleanup;
  }, [on]);

  const handleNameSelect = (name: string) => {
    setError('');

    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      setError(`Name must be ${MAX_NAME_LENGTH} characters or less`);
      return;
    }

    if (!eventId) {
      setError('Invalid event ID');
      return;
    }

    if (connectionStatus !== 'connected') {
      setError('Not connected to server. Please wait...');
      return;
    }

    setParticipantName(trimmedName);
    setIsSubmitting(true);
    emit('join-event', {
      eventId,
      participantName: trimmedName,
    });
  };

  // Show event not found page
  if (eventNotFound) {
    return <EventNotFound eventId={eventId} />;
  }

  // Show error state
  if (joinState === 'error' && error) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 text-gray-900">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Unable to Join
          </h1>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => {
              setJoinState('joining');
              setError('');
              setEventNotFound(false);
            }}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show unified activity view after joining
  if (joinState === 'joined' && participantName && eventId) {
    return (
      <ParticipantActivityView
        eventId={eventId}
        participantName={participantName}
      />
    );
  }

  // Show join form
  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-lg rounded-lg p-6 md:p-8 text-gray-900"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
          Join Event
        </h1>
        <p className="text-sm md:text-base text-gray-600 mb-6 text-center">
          Choose a nickname to participate
        </p>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
              <p className="text-sm md:text-base text-red-600">{error}</p>
            </div>
          )}

          {connectionStatus !== 'connected' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
              <p className="text-sm md:text-base text-yellow-700">
                {connectionStatus === 'connecting' && 'Connecting to server...'}
                {connectionStatus === 'disconnected' && 'Disconnected from server'}
                {connectionStatus === 'error' && 'Connection error. Retrying...'}
              </p>
            </div>
          )}

          {connectionStatus === 'connected' && !isSubmitting && (
            <NicknameGenerator onSelectName={handleNameSelect} />
          )}

          {isSubmitting && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-lg text-gray-700 font-medium">Joining event...</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs md:text-sm text-gray-500 text-center">
            Event ID: <span className="font-mono text-gray-700">{eventId}</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
