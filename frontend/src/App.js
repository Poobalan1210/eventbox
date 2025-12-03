import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import ConnectionStatus from './components/ConnectionStatus';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import CreateEvent from './pages/CreateEvent';
import OrganizerDashboard from './pages/OrganizerDashboard';
import QuizManagement from './pages/QuizManagement';
import ParticipantView from './pages/ParticipantView';
import EventActivities from './pages/EventActivities';
import OrganizerControlPage from './pages/OrganizerControlPage';
import ActivityResults from './pages/ActivityResults';
function App() {
    return (_jsx(ErrorBoundary, { children: _jsx(ThemeProvider, { children: _jsx(WebSocketProvider, { children: _jsxs(Router, { children: [_jsx(ConnectionStatus, {}), _jsx(Layout, { children: _jsx(ErrorBoundary, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/create", element: _jsx(CreateEvent, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(OrganizerDashboard, {}) }), _jsx(Route, { path: "/organizer/:eventId", element: _jsx(QuizManagement, {}) }), _jsx(Route, { path: "/events/:eventId/activities", element: _jsx(EventActivities, {}) }), _jsx(Route, { path: "/events/:eventId/control", element: _jsx(OrganizerControlPage, {}) }), _jsx(Route, { path: "/activities/:activityId/results", element: _jsx(ActivityResults, {}) }), _jsx(Route, { path: "/join/:eventId", element: _jsx(ParticipantView, {}) })] }) }) })] }) }) }) }));
}
export default App;
