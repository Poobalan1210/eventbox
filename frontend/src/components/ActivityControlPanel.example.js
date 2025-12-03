import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6", children: [_jsx("h1", { className: "text-2xl font-bold text-white mb-6", children: "Event Control Dashboard" }), _jsx(ActivityControlPanel, { eventId: eventId, organizerId: organizerId, onActivityChange: handleActivityChange }), _jsx("div", { className: "mt-6 text-white/70 text-sm", children: _jsx("p", { children: "Use the control panel above to activate and deactivate activities. Only one activity can be active at a time." }) })] }));
}
