import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { useActiveQuizzes } from '../hooks/useActiveQuizzes';
import ReconnectionBanner from './ReconnectionBanner';
import EventBoxLogo from './EventBoxLogo';
export default function Layout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { connectionStatus } = useWebSocket();
    const { colors } = useTheme();
    // Track active quizzes for notification badge
    // Using a demo organizerId - in production this would come from auth context
    const { unreadCount } = useActiveQuizzes('demo-organizer-123');
    const isActive = (path) => {
        return location.pathname === path;
    };
    return (_jsxs("div", { className: "min-h-screen", children: [_jsx(ReconnectionBanner, { status: connectionStatus }), _jsxs("nav", { className: "shadow-lg backdrop-blur-md", style: { backgroundColor: colors.navBgDark }, children: [_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between h-16", children: [_jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0 flex items-center", children: _jsx(Link, { to: "/", className: "transition-all hover:scale-105", children: _jsx(EventBoxLogo, { size: "sm", animated: false, showText: true }) }) }), _jsxs("div", { className: "hidden sm:ml-6 sm:flex sm:space-x-8", children: [_jsxs(Link, { to: "/dashboard", className: "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors relative", style: {
                                                        borderColor: isActive('/dashboard') ? colors.navBorder : 'transparent',
                                                        color: isActive('/dashboard') ? colors.navText : colors.navTextHover,
                                                    }, children: ["My Events", unreadCount > 0 && (_jsx("span", { className: "ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse", children: unreadCount }))] }), _jsx(Link, { to: "/create", className: "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors", style: {
                                                        borderColor: isActive('/create') ? colors.navBorder : 'transparent',
                                                        color: isActive('/create') ? colors.navText : colors.navTextHover,
                                                    }, children: "Create Event" })] })] }), _jsx("div", { className: "flex items-center sm:hidden", children: _jsxs("button", { type: "button", className: "inline-flex items-center justify-center p-2 rounded-md transition-colors", style: { color: colors.navText }, "aria-controls": "mobile-menu", "aria-expanded": mobileMenuOpen, onClick: () => setMobileMenuOpen(!mobileMenuOpen), onMouseEnter: (e) => e.currentTarget.style.color = colors.navTextHover, onMouseLeave: (e) => e.currentTarget.style.color = colors.navText, children: [_jsx("span", { className: "sr-only", children: "Open main menu" }), !mobileMenuOpen ? (_jsx("svg", { className: "block h-6 w-6", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) })) : (_jsx("svg", { className: "block h-6 w-6", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }))] }) })] }) }), mobileMenuOpen && (_jsx("div", { className: "sm:hidden", id: "mobile-menu", style: { backgroundColor: colors.navBg }, children: _jsxs("div", { className: "pt-2 pb-3 space-y-1", children: [_jsx(Link, { to: "/dashboard", className: "block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors relative", style: {
                                        borderColor: isActive('/dashboard') ? colors.navBorder : 'transparent',
                                        color: colors.navText,
                                        backgroundColor: isActive('/dashboard') ? colors.navBg : 'transparent',
                                    }, onClick: () => setMobileMenuOpen(false), children: _jsxs("span", { className: "inline-flex items-center", children: ["My Events", unreadCount > 0 && (_jsx("span", { className: "ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse", children: unreadCount }))] }) }), _jsx(Link, { to: "/create", className: "block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors", style: {
                                        borderColor: isActive('/create') ? colors.navBorder : 'transparent',
                                        color: colors.navText,
                                        backgroundColor: isActive('/create') ? colors.navBg : 'transparent',
                                    }, onClick: () => setMobileMenuOpen(false), children: "Create Event" })] }) }))] }), _jsx("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: children })] }));
}
