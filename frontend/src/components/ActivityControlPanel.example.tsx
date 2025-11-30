/**
 * Example usage of ActivityControlPanel component
 * 
 * This file demonstrates how to integrate the ActivityControlPanel
 * into an organizer dashboard or event management page.
 */

import ActivityControlPanel from './ActivityControlPanel';

export default function ActivityControlPanelExample() {
  const eventId = 'event-123';
  const organizerId = 'organizer-456';

  const handleActivityChange = () => {
    console.log('Activity state changed - refresh participant views');
    // This callback can be used to:
    // - Refresh other components
    // - Show notifications
    // - Update WebSocket connections
    // - Log analytics events
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        Event Control Dashboard
      </h1>

      {/* Activity Control Panel */}
      <ActivityControlPanel
        eventId={eventId}
        organizerId={organizerId}
        onActivityChange={handleActivityChange}
      />

      {/* Additional dashboard components can go here */}
      <div className="mt-6 text-white/70 text-sm">
        <p>
          Use the control panel above to activate and deactivate activities.
          Only one activity can be active at a time.
        </p>
      </div>
    </div>
  );
}

/**
 * Integration with EventActivities page:
 * 
 * import ActivityControlPanel from '../components/ActivityControlPanel';
 * 
 * // In your EventActivities component:
 * <div className="mb-6">
 *   <ActivityControlPanel
 *     eventId={eventId}
 *     organizerId={organizerId}
 *     onActivityChange={() => {
 *       // Refresh activities list or other components
 *     }}
 *   />
 * </div>
 */
