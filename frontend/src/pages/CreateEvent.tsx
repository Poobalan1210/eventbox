import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivacySelector from '../components/PrivacySelector';
import { EventVisibility } from '../types/models';

interface CreateEventResponse {
  eventId: string;
  gamePin: string;
  joinLink: string;
  qrCode: string;
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('');
  const [visibility, setVisibility] = useState<EventVisibility>('private');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<CreateEventResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  // For demo purposes, using a hardcoded organizerId
  // In production, this would come from authentication context
  const organizerId = 'demo-organizer-123';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Create a blank event
      const response = await fetch(`${apiBaseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: eventName,
          visibility: visibility,
          organizerId: organizerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }

      const data: CreateEventResponse = await response.json();
      setCreatedEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (createdEvent) {
      try {
        await navigator.clipboard.writeText(createdEvent.joinLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const handleCopyPin = async () => {
    if (createdEvent) {
      try {
        await navigator.clipboard.writeText(createdEvent.gamePin);
        setCopiedPin(true);
        setTimeout(() => setCopiedPin(false), 2000);
      } catch (err) {
        console.error('Failed to copy PIN:', err);
      }
    }
  };

  const handleGoToSetup = () => {
    if (createdEvent) {
      // Navigate to event activities management
      navigate(`/events/${createdEvent.eventId}/activities`);
    }
  };

  if (createdEvent) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">🎉 Event Created!</h1>
        <div className="bg-white/10 backdrop-blur-sm shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6 border border-white/20">
          {/* Game PIN Section - Prominent Display */}
          <div className="bg-answer-yellow/20 border-3 border-answer-yellow rounded-2xl p-8 pulse-glow">
            <label className="block text-lg font-bold text-white mb-4 text-center">
              🎯 Game PIN
            </label>
            <div className="flex flex-col items-center gap-4">
              <div className="text-6xl sm:text-7xl font-bold text-white tracking-widest animate-pulse">
                {createdEvent.gamePin}
              </div>
              <button
                onClick={handleCopyPin}
                className="px-8 py-3 bg-white text-kahoot-purple rounded-xl hover:bg-answer-yellow hover:text-white transition-all min-h-[44px] font-bold text-lg shadow-lg transform hover:scale-105 active:scale-95"
              >
                {copiedPin ? '✓ Copied!' : '📋 Copy PIN'}
              </button>
              <p className="text-base text-white/90 text-center font-medium">
                Participants can use this PIN to join quickly
              </p>
            </div>
          </div>

          {/* Join Link Section */}
          <div>
            <label className="block text-base font-bold text-white mb-3">
              🔗 Or share this link:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                readOnly
                value={createdEvent.joinLink}
                className="flex-1 px-4 py-3 border-2 border-white/30 rounded-xl bg-white/10 text-white text-sm sm:text-base font-medium backdrop-blur-sm"
              />
              <button
                onClick={handleCopyLink}
                className="px-6 py-3 bg-answer-blue text-white rounded-xl hover:bg-answer-blue/80 transition-all min-h-[44px] font-bold shadow-lg transform hover:scale-105 active:scale-95"
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center bg-white/10 rounded-2xl p-6 border border-white/20">
            <label className="block text-base font-bold text-white mb-4">
              📱 Or scan this QR code:
            </label>
            <div className="bg-white p-4 rounded-xl shadow-xl">
              <img
                src={createdEvent.qrCode}
                alt="Event QR Code"
                className="w-48 h-48 sm:w-64 sm:h-64"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              onClick={handleGoToSetup}
              className="w-full px-8 py-4 bg-answer-green text-white rounded-xl hover:bg-answer-green/80 transition-all min-h-[56px] font-bold text-xl shadow-lg transform hover:scale-105 active:scale-95"
            >
              🎯 Manage Event Activities
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">🎯 Create Event</h1>
      <div className="bg-white/10 backdrop-blur-sm shadow-2xl rounded-2xl p-6 sm:p-8 border border-white/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name Input */}
          <div>
            <label htmlFor="eventName" className="block text-lg font-bold text-white mb-3">
              Event Name
            </label>
            <input
              type="text"
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              placeholder="Enter event name"
              className="w-full px-5 py-4 border-2 border-white/30 rounded-xl bg-white/10 text-white placeholder-white/50 focus:ring-4 focus:ring-answer-yellow/50 focus:border-answer-yellow min-h-[56px] text-lg font-medium backdrop-blur-sm transition-all"
              disabled={isLoading}
            />
          </div>

          {/* Privacy Selector */}
          <PrivacySelector
            value={visibility}
            onChange={setVisibility}
            disabled={isLoading}
          />

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-answer-red/20 border-2 border-answer-red rounded-xl backdrop-blur-sm">
              <p className="text-base text-white font-medium">❌ {error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !eventName.trim()}
            className="w-full px-8 py-4 bg-white text-kahoot-purple rounded-xl hover:bg-answer-yellow hover:text-white disabled:bg-white/30 disabled:text-white/50 disabled:cursor-not-allowed transition-all min-h-[56px] font-bold text-xl shadow-lg transform hover:scale-105 active:scale-95"
          >
            {isLoading ? '⏳ Creating Event...' : '🚀 Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
}
