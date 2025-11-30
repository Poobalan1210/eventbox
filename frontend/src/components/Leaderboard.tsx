import { motion, AnimatePresence } from 'framer-motion';
import { ParticipantScore } from '../types/models';
import { leaderboardItemVariants } from '../constants/animations';

interface LeaderboardProps {
  participants: ParticipantScore[];
  showTime?: boolean;
  title?: string;
  subtitle?: string;
}

export default function Leaderboard({ 
  participants, 
  showTime = false,
  title = 'Leaderboard',
  subtitle,
}: LeaderboardProps) {
  if (participants.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <p className="text-white/70 text-center py-4">No participants yet 🎯</p>
      </div>
    );
  }

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'bg-answer-yellow/30 text-white border-answer-yellow shadow-lg shadow-answer-yellow/30';
      case 2:
        return 'bg-white/20 text-white border-white/50 shadow-lg';
      case 3:
        return 'bg-answer-red/30 text-white border-answer-red shadow-lg shadow-answer-red/30';
      default:
        return 'bg-white/10 text-white border-white/20';
    }
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/20">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          🏆 {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-white/80 mt-2">{subtitle}</p>
        )}
      </div>
      
      {/* Mobile-optimized list view */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {participants.map((participant, index) => (
            <motion.div
              key={`${participant.name}-${participant.rank}`}
              custom={index}
              variants={leaderboardItemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              layout
              transition={{
                layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
              }}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 transition-all backdrop-blur-sm ${getRankColor(
                participant.rank
              )} ${participant.rank <= 3 ? 'playful-hover' : ''}`}
            >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0 w-10 sm:w-12 text-center">
                <span className="text-2xl sm:text-3xl font-bold">
                  {getRankIcon(participant.rank) || `#${participant.rank}`}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white truncate text-base sm:text-lg">
                  {participant.name}
                </p>
                {showTime && (
                  <p className="text-xs sm:text-sm text-white/70 mt-1">
                    ⏱️ Time: {(participant.totalAnswerTime / 1000).toFixed(2)}s
                  </p>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 ml-2">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {participant.score}
              </span>
              <span className="text-sm sm:text-base text-white/70 ml-1">pts</span>
            </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
