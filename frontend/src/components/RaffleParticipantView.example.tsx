/**
 * RaffleParticipantView Example Usage
 * 
 * This file demonstrates how to use the RaffleParticipantView component
 * in different scenarios and states.
 */

import RaffleParticipantView from './RaffleParticipantView';

/**
 * Example 1: Basic Usage
 * 
 * The simplest way to use the component - just provide the required props.
 */
export function BasicRaffleExample() {
  return (
    <RaffleParticipantView
      eventId="event-123"
      activityId="raffle-456"
      participantName="John Doe"
    />
  );
}

/**
 * Example 2: Integration with Event System
 * 
 * How the component would be used within a larger event system,
 * such as the ParticipantActivityView.
 */
export function IntegratedRaffleExample() {
  // These would come from your event state management
  const eventId = "event-123";
  const currentActivity = {
    activityId: "raffle-456",
    type: "raffle" as const,
    name: "Grand Prize Raffle",
    prizeDescription: "Win a brand new laptop!",
  };
  const participantName = "Jane Smith";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <RaffleParticipantView
        eventId={eventId}
        activityId={currentActivity.activityId}
        participantName={participantName}
      />
    </div>
  );
}

/**
 * Example 3: Multiple Participants
 * 
 * Demonstrates how different participants would see the same raffle.
 */
export function MultipleParticipantsExample() {
  const eventId = "event-123";
  const activityId = "raffle-789";
  
  const participants = [
    "Alice Johnson",
    "Bob Williams",
    "Carol Davis",
  ];

  return (
    <div className="space-y-8 p-8 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <h1 className="text-3xl font-bold text-white text-center mb-8">
        Multiple Participant Views
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {participants.map((name) => (
          <div key={name} className="border-2 border-white/20 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              {name}'s View
            </h2>
            <RaffleParticipantView
              eventId={eventId}
              activityId={activityId}
              participantName={name}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 4: Testing Different States
 * 
 * This example shows how you might test the component in different states
 * by simulating WebSocket events.
 */
export function RaffleStateTestingExample() {
  const eventId = "event-test";
  const activityId = "raffle-test";
  const participantName = "Test User";

  // In a real testing scenario, you would:
  // 1. Render the component
  // 2. Emit WebSocket events to trigger state changes
  // 3. Verify the UI updates correctly

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            Testing States
          </h2>
          <p className="text-white/80 mb-4">
            To test different states, emit these WebSocket events:
          </p>
          <ul className="list-disc list-inside text-white/70 space-y-2">
            <li>
              <code className="bg-black/30 px-2 py-1 rounded">raffle-started</code>
              {' '}- Shows prize and entry button
            </li>
            <li>
              <code className="bg-black/30 px-2 py-1 rounded">raffle-entry-confirmed</code>
              {' '}- Shows entry confirmation
            </li>
            <li>
              <code className="bg-black/30 px-2 py-1 rounded">raffle-drawing</code>
              {' '}- Shows drawing animation
            </li>
            <li>
              <code className="bg-black/30 px-2 py-1 rounded">raffle-winners-announced</code>
              {' '}- Shows winners list
            </li>
            <li>
              <code className="bg-black/30 px-2 py-1 rounded">raffle-ended</code>
              {' '}- Shows completion message
            </li>
          </ul>
        </div>

        <RaffleParticipantView
          eventId={eventId}
          activityId={activityId}
          participantName={participantName}
        />
      </div>
    </div>
  );
}

/**
 * Example 5: Custom Styling Container
 * 
 * Shows how to wrap the component in a custom container with additional styling.
 */
export function CustomStyledRaffleExample() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Custom header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            🎊 Special Event Raffle 🎊
          </h1>
          <p className="text-xl text-white/80">
            Enter for a chance to win amazing prizes!
          </p>
        </div>

        {/* Raffle component */}
        <RaffleParticipantView
          eventId="special-event-2024"
          activityId="grand-raffle"
          participantName="VIP Guest"
        />

        {/* Custom footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            Winners will be announced at the end of the event
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 6: Responsive Layout Test
 * 
 * Demonstrates the component's responsive behavior at different screen sizes.
 */
export function ResponsiveRaffleExample() {
  return (
    <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white text-center">
          Responsive Design Test
        </h1>
        
        {/* Mobile view simulation */}
        <div className="bg-white/10 rounded-lg p-4">
          <h2 className="text-xl font-bold text-white mb-4">Mobile View (375px)</h2>
          <div className="max-w-[375px] mx-auto">
            <RaffleParticipantView
              eventId="event-mobile"
              activityId="raffle-mobile"
              participantName="Mobile User"
            />
          </div>
        </div>

        {/* Tablet view simulation */}
        <div className="bg-white/10 rounded-lg p-4">
          <h2 className="text-xl font-bold text-white mb-4">Tablet View (768px)</h2>
          <div className="max-w-[768px] mx-auto">
            <RaffleParticipantView
              eventId="event-tablet"
              activityId="raffle-tablet"
              participantName="Tablet User"
            />
          </div>
        </div>

        {/* Desktop view */}
        <div className="bg-white/10 rounded-lg p-4">
          <h2 className="text-xl font-bold text-white mb-4">Desktop View (Full Width)</h2>
          <RaffleParticipantView
            eventId="event-desktop"
            activityId="raffle-desktop"
            participantName="Desktop User"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Example 7: Error Handling Demo
 * 
 * Shows how the component handles errors gracefully.
 */
export function ErrorHandlingRaffleExample() {
  // In a real scenario, you might want to wrap the component
  // with an error boundary to catch and display errors gracefully
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-2">
            ⚠️ Error Handling
          </h2>
          <p className="text-white/80">
            The component handles errors gracefully:
          </p>
          <ul className="list-disc list-inside text-white/70 mt-2 space-y-1">
            <li>API errors show user-friendly alerts</li>
            <li>Network failures are logged to console</li>
            <li>Loading states prevent duplicate submissions</li>
            <li>Invalid data is handled with fallbacks</li>
          </ul>
        </div>

        <RaffleParticipantView
          eventId="event-error-test"
          activityId="raffle-error-test"
          participantName="Error Test User"
        />
      </div>
    </div>
  );
}

// Export all examples for easy testing
export const examples = {
  BasicRaffleExample,
  IntegratedRaffleExample,
  MultipleParticipantsExample,
  RaffleStateTestingExample,
  CustomStyledRaffleExample,
  ResponsiveRaffleExample,
  ErrorHandlingRaffleExample,
};

export default examples;
