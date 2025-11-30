import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { useActiveQuizzes } from '../hooks/useActiveQuizzes';
import ReconnectionBanner from './ReconnectionBanner';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { connectionStatus } = useWebSocket();
  const { theme, setTheme, colors } = useTheme();
  
  // Track active quizzes for notification badge
  // Using a demo organizerId - in production this would come from auth context
  const { unreadCount } = useActiveQuizzes('demo-organizer-123');

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleTheme = () => {
    setTheme(theme === 'purple' ? 'space' : 'purple');
  };

  return (
    <div className="min-h-screen">
      {/* Reconnection Banner */}
      <ReconnectionBanner status={connectionStatus} />
      
      {/* Navigation */}
      <nav 
        className="shadow-lg backdrop-blur-md"
        style={{ backgroundColor: colors.navBgDark }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link 
                  to="/" 
                  className="text-xl font-bold transition-colors"
                  style={{ 
                    color: colors.navText,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.navTextHover}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.navText}
                >
                  📦 Event Box
                </Link>
              </div>
              {/* Desktop Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors relative"
                  style={{
                    borderColor: isActive('/dashboard') ? colors.navBorder : 'transparent',
                    color: isActive('/dashboard') ? colors.navText : colors.navTextHover,
                  }}
                >
                  My Events
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/create"
                  className="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                  style={{
                    borderColor: isActive('/create') ? colors.navBorder : 'transparent',
                    color: isActive('/create') ? colors.navText : colors.navTextHover,
                  }}
                >
                  Create Event
                </Link>
              </div>
            </div>
            {/* Theme Toggle */}
            <div className="flex items-center">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-all hover:scale-110"
                style={{ 
                  color: colors.navText,
                  backgroundColor: colors.navBg,
                }}
                title={theme === 'purple' ? 'Switch to Space theme' : 'Switch to Purple theme'}
              >
                {theme === 'purple' ? '🌌' : '🎯'}
              </button>
            </div>
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md transition-colors"
                style={{ color: colors.navText }}
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.navTextHover}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.navText}
              >
                <span className="sr-only">Open main menu</span>
                {/* Hamburger icon */}
                {!mobileMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden" id="mobile-menu" style={{ backgroundColor: colors.navBg }}>
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/dashboard"
                className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors relative"
                style={{
                  borderColor: isActive('/dashboard') ? colors.navBorder : 'transparent',
                  color: colors.navText,
                  backgroundColor: isActive('/dashboard') ? colors.navBg : 'transparent',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="inline-flex items-center">
                  My Events
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </span>
              </Link>
              <Link
                to="/create"
                className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors"
                style={{
                  borderColor: isActive('/create') ? colors.navBorder : 'transparent',
                  color: colors.navText,
                  backgroundColor: isActive('/create') ? colors.navBg : 'transparent',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Event
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
