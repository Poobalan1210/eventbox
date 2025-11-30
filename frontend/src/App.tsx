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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WebSocketProvider>
          <Router>
            <ConnectionStatus />
            <Layout>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/create" element={<CreateEvent />} />
                  <Route path="/dashboard" element={<OrganizerDashboard />} />
                  <Route path="/organizer/:eventId" element={<QuizManagement />} />
                  <Route path="/events/:eventId/activities" element={<EventActivities />} />
                  <Route path="/events/:eventId/control" element={<OrganizerControlPage />} />
                  <Route path="/join/:eventId" element={<ParticipantView />} />
                </Routes>
              </ErrorBoundary>
            </Layout>
          </Router>
        </WebSocketProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
