/**
 * Event Not Found Page - Displayed when an invalid event ID is accessed
 */
import { useNavigate } from 'react-router-dom';

interface EventNotFoundProps {
  eventId?: string;
  message?: string;
}

export default function EventNotFound({ eventId, message }: EventNotFoundProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 md:p-8 text-gray-900">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-yellow-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">
          Event Not Found
        </h1>
        
        <p className="text-gray-600 text-center mb-6">
          {message || "The quiz event you're looking for doesn't exist or may have been deleted."}
        </p>

        {eventId && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              Event ID: <span className="font-mono text-gray-800">{eventId}</span>
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/create')}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            style={{ minHeight: '44px' }}
          >
            Create New Event
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            style={{ minHeight: '44px' }}
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
