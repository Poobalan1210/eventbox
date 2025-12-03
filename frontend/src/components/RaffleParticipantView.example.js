import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsx(RaffleParticipantView, { eventId: "event-123", activityId: "raffle-456", participantName: "John Doe" }));
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
        type: "raffle",
        name: "Grand Prize Raffle",
        prizeDescription: "Win a brand new laptop!",
    };
    const participantName = "Jane Smith";
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900", children: _jsx(RaffleParticipantView, { eventId: eventId, activityId: currentActivity.activityId, participantName: participantName }) }));
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
    return (_jsxs("div", { className: "space-y-8 p-8 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900", children: [_jsx("h1", { className: "text-3xl font-bold text-white text-center mb-8", children: "Multiple Participant Views" }), _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: participants.map((name) => (_jsxs("div", { className: "border-2 border-white/20 rounded-lg p-4", children: [_jsxs("h2", { className: "text-xl font-bold text-white mb-4 text-center", children: [name, "'s View"] }), _jsx(RaffleParticipantView, { eventId: eventId, activityId: activityId, participantName: name })] }, name))) })] }));
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
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-8", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-8", children: [_jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: "Testing States" }), _jsx("p", { className: "text-white/80 mb-4", children: "To test different states, emit these WebSocket events:" }), _jsxs("ul", { className: "list-disc list-inside text-white/70 space-y-2", children: [_jsxs("li", { children: [_jsx("code", { className: "bg-black/30 px-2 py-1 rounded", children: "raffle-started" }), ' ', "- Shows prize and entry button"] }), _jsxs("li", { children: [_jsx("code", { className: "bg-black/30 px-2 py-1 rounded", children: "raffle-entry-confirmed" }), ' ', "- Shows entry confirmation"] }), _jsxs("li", { children: [_jsx("code", { className: "bg-black/30 px-2 py-1 rounded", children: "raffle-drawing" }), ' ', "- Shows drawing animation"] }), _jsxs("li", { children: [_jsx("code", { className: "bg-black/30 px-2 py-1 rounded", children: "raffle-winners-announced" }), ' ', "- Shows winners list"] }), _jsxs("li", { children: [_jsx("code", { className: "bg-black/30 px-2 py-1 rounded", children: "raffle-ended" }), ' ', "- Shows completion message"] })] })] }), _jsx(RaffleParticipantView, { eventId: eventId, activityId: activityId, participantName: participantName })] }) }));
}
/**
 * Example 5: Custom Styling Container
 *
 * Shows how to wrap the component in a custom container with additional styling.
 */
export function CustomStyledRaffleExample() {
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4", children: _jsxs("div", { className: "max-w-3xl w-full", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-4xl md:text-5xl font-bold text-white mb-2", children: "\uD83C\uDF8A Special Event Raffle \uD83C\uDF8A" }), _jsx("p", { className: "text-xl text-white/80", children: "Enter for a chance to win amazing prizes!" })] }), _jsx(RaffleParticipantView, { eventId: "special-event-2024", activityId: "grand-raffle", participantName: "VIP Guest" }), _jsx("div", { className: "text-center mt-8", children: _jsx("p", { className: "text-white/60 text-sm", children: "Winners will be announced at the end of the event" }) })] }) }));
}
/**
 * Example 6: Responsive Layout Test
 *
 * Demonstrates the component's responsive behavior at different screen sizes.
 */
export function ResponsiveRaffleExample() {
    return (_jsx("div", { className: "bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4", children: _jsxs("div", { className: "max-w-7xl mx-auto space-y-8", children: [_jsx("h1", { className: "text-3xl font-bold text-white text-center", children: "Responsive Design Test" }), _jsxs("div", { className: "bg-white/10 rounded-lg p-4", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Mobile View (375px)" }), _jsx("div", { className: "max-w-[375px] mx-auto", children: _jsx(RaffleParticipantView, { eventId: "event-mobile", activityId: "raffle-mobile", participantName: "Mobile User" }) })] }), _jsxs("div", { className: "bg-white/10 rounded-lg p-4", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Tablet View (768px)" }), _jsx("div", { className: "max-w-[768px] mx-auto", children: _jsx(RaffleParticipantView, { eventId: "event-tablet", activityId: "raffle-tablet", participantName: "Tablet User" }) })] }), _jsxs("div", { className: "bg-white/10 rounded-lg p-4", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Desktop View (Full Width)" }), _jsx(RaffleParticipantView, { eventId: "event-desktop", activityId: "raffle-desktop", participantName: "Desktop User" })] })] }) }));
}
/**
 * Example 7: Error Handling Demo
 *
 * Shows how the component handles errors gracefully.
 */
export function ErrorHandlingRaffleExample() {
    // In a real scenario, you might want to wrap the component
    // with an error boundary to catch and display errors gracefully
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-8", children: _jsxs("div", { className: "max-w-2xl mx-auto space-y-8", children: [_jsxs("div", { className: "bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-6", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-2", children: "\u26A0\uFE0F Error Handling" }), _jsx("p", { className: "text-white/80", children: "The component handles errors gracefully:" }), _jsxs("ul", { className: "list-disc list-inside text-white/70 mt-2 space-y-1", children: [_jsx("li", { children: "API errors show user-friendly alerts" }), _jsx("li", { children: "Network failures are logged to console" }), _jsx("li", { children: "Loading states prevent duplicate submissions" }), _jsx("li", { children: "Invalid data is handled with fallbacks" })] })] }), _jsx(RaffleParticipantView, { eventId: "event-error-test", activityId: "raffle-error-test", participantName: "Error Test User" })] }) }));
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
