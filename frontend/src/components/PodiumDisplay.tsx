import { motion } from 'framer-motion';
import { ParticipantScore } from '../types/models';
import { podiumVariants } from '../constants/animations';

interface PodiumDisplayProps {
  topThree: ParticipantScore[];
}

export default function PodiumDisplay({ topThree }: PodiumDisplayProps) {
  if (topThree.length === 0) {
    return null;
  }

  // Podium heights (in rem units)
  const podiumHeights = {
    1: 16, // 1st place - tallest (center)
    2: 12, // 2nd place - medium (left)
    3: 8,  // 3rd place - shortest (right)
  };

  // Podium colors
  const podiumColors = {
    1: 'bg-gradient-to-t from-yellow-400 to-yellow-300',
    2: 'bg-gradient-to-t from-gray-400 to-gray-300',
    3: 'bg-gradient-to-t from-orange-400 to-orange-300',
  };

  // Medal emojis
  const medals = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  };

  // Use centralized animation variants for consistency and performance

  // Confetti animation for 1st place
  const confettiVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: [0, 1, 1, 0],
      scale: [0, 1.2, 1, 0.8],
      y: [-20, -40, -60, -80],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatDelay: 1,
      },
    },
  };

  // Arrange participants in podium order: 2nd (left), 1st (center), 3rd (right)
  const podiumOrder = [
    topThree.find(p => p.rank === 2), // Left
    topThree.find(p => p.rank === 1), // Center
    topThree.find(p => p.rank === 3), // Right
  ].filter(Boolean) as ParticipantScore[];

  // Animation delays: 2nd, 3rd, then 1st (for dramatic effect)
  const getAnimationDelay = (rank: number): number => {
    if (rank === 1) return 2; // Last to appear
    if (rank === 2) return 0; // First to appear
    if (rank === 3) return 1; // Second to appear
    return 0;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
          🎉 Top Performers 🎉
        </h2>
        <p className="text-base sm:text-lg text-white/90 drop-shadow">
          Congratulations to our winners!
        </p>
      </motion.div>

      {/* Podium Display */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-6 mb-8">
        {podiumOrder.map((participant) => {
          const rank = participant.rank;
          const height = podiumHeights[rank as keyof typeof podiumHeights];
          const color = podiumColors[rank as keyof typeof podiumColors];
          const medal = medals[rank as keyof typeof medals];
          const animationDelay = getAnimationDelay(rank);

          return (
            <motion.div
              key={participant.name}
              custom={animationDelay}
              variants={podiumVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center"
              style={{ flex: '1', maxWidth: '200px' }}
            >
              {/* Participant Info (above podium) */}
              <div className="mb-4 text-center">
                {/* Medal */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: animationDelay * 0.3 + 0.4,
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 200,
                  }}
                  className="text-4xl sm:text-5xl md:text-6xl mb-2"
                >
                  {medal}
                </motion.div>

                {/* Name */}
                <p className="font-bold text-sm sm:text-base md:text-lg text-white mb-1 truncate px-2 drop-shadow-lg">
                  {participant.name}
                </p>

                {/* Score */}
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                  {participant.score}
                  <span className="text-xs sm:text-sm text-white/80 ml-1">pts</span>
                </p>

                {/* Confetti for 1st place */}
                {rank === 1 && (
                  <div className="relative">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        variants={confettiVariants}
                        initial="hidden"
                        animate="visible"
                        className="absolute text-2xl"
                        style={{
                          left: `${(i - 2) * 20}px`,
                          top: '-10px',
                        }}
                      >
                        {['🎊', '🎉', '⭐', '✨', '🌟'][i]}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Podium Block */}
              <div
                className={`w-full ${color} rounded-t-lg border-2 border-gray-400 shadow-lg flex items-center justify-center relative overflow-hidden`}
                style={{ height: `${height}rem` }}
              >
                {/* Rank Number */}
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white opacity-30">
                  {rank}
                </div>

                {/* Shine effect */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    delay: animationDelay * 0.3 + 0.6,
                    duration: 1,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                  style={{ width: '50%' }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Additional celebration message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.5, duration: 0.5 }}
        className="text-center"
      >
        <p className="text-base sm:text-lg text-white font-medium drop-shadow">
          Amazing performance! 🎊
        </p>
      </motion.div>
    </div>
  );
}
