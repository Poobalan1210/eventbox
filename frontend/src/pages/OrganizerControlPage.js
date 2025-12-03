import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import OrganizerControlDashboard from '../components/OrganizerControlDashboard';
import { useTheme } from '../contexts/ThemeContext';
export default function OrganizerControlPage() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { colors } = useTheme();
    // For demo purposes, using a hardcoded organizerId
    // In production, this would come from authentication context
    const organizerId = 'demo-organizer-123';
    const [eventName, setEventName] = useState('');
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
                }
                else {
                    console.error('Failed to fetch event:', response.status, response.statusText);
                    setEventName('Event');
                }
            }
            catch (error) {
                console.error('Error fetching event details:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchEventDetails();
    }, [eventId, navigate]);
    if (!eventId) {
        return null;
    }
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" }), _jsx("p", { style: { color: colors.textSecondary }, children: "Loading event..." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen", style: { backgroundColor: colors.background }, children: [_jsx("div", { className: "border-b", style: { borderColor: colors.cardBorder }, children: _jsx("div", { className: "max-w-6xl mx-auto px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("button", { onClick: () => navigate(`/events/${eventId}/activities`), className: "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-white/10", style: { color: colors.textSecondary }, children: [_jsx("span", { children: "\u2190" }), _jsx("span", { children: "Back to Activities" })] }), _jsx("div", { className: "h-6 w-px bg-white/20" }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold", style: { color: colors.textPrimary }, children: eventName }), _jsx("p", { className: "text-sm", style: { color: colors.textSecondary }, children: "Live Control Dashboard" })] })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs("div", { className: "flex items-center gap-2 px-3 py-2 bg-green-500/20 rounded-lg", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }), _jsx("span", { className: "text-sm font-medium text-green-400", children: "Live" })] }) })] }) }) }), _jsx("div", { className: "py-6", children: _jsx(OrganizerControlDashboard, { eventId: eventId, organizerId: organizerId }) })] }));
}
