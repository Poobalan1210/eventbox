import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import OrganizerControlDashboard from '../components/OrganizerControlDashboard';
import { useTheme } from '../contexts/ThemeContext';

export default function OrganizerControlPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { colors } = useTheme();
  
  // For demo purposes, using a hardcoded organizerId
  // In production, this would come from authentication context
  const organizerId = 'demo-organizer-123';

  const [eventName, setEventName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      navigate('/dashboard');
      return;
    }

    // Fetch event details to get the name
    const fetchEventDetails = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiBaseUrl}/events/${eventId}`, {
          headers: {
            'x-organizer-id': organizerId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Event API response:', data);
          // Handle different possible response structures
          const eventName = data.event?.name || data.name || 'Event';
          setEventName(eventName);
        } else {
          console.error('Failed to fetch event:', response.status, response.statusText);
          setEventName('Event');
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, navigate]);

  if (!eventId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: colors.textSecondary }}>Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: colors.cardBorder }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/events/${eventId}/activities`)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: colors.textSecondary }}
              >
                <span>←</span>
                <span>Back to Activities</span>
              </button>
              <div className="h-6 w-px bg-white/20"></div>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                  {eventName}
                </h1>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Live Control Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-400">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="py-6">
        <OrganizerControlDashboard 
          eventId={eventId} 
          organizerId={organizerId} 
        />
      </div>
    </div>
  );
}