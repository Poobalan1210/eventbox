import { useParams } from 'react-router-dom';
import QuizModeManager from '../components/QuizModeManager';
import ConnectionStatus from '../components/ConnectionStatus';

export default function QuizManagement() {
  const { eventId } = useParams<{ eventId: string }>();

  if (!eventId) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-answer-red/20 border-2 border-answer-red rounded-lg p-6">
          <p className="text-white">Invalid event ID</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Connection Status */}
      <ConnectionStatus />
      
      {/* Quiz Mode Manager handles all mode-specific rendering */}
      <QuizModeManager eventId={eventId} />
    </>
  );
}
