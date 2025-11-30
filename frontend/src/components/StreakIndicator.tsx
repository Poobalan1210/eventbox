import { motion, AnimatePresence } from 'framer-motion';

interface StreakIndicatorProps {
  currentStreak: number;
}

export default function StreakIndicator({ currentStreak }: StreakIndicatorProps) {
  const hasStreak = currentStreak > 0;
  const isHighStreak = currentStreak >= 3;

  return (
    <AnimatePresence mode="wait">
      {hasStreak && (
        <motion.div
          key={`streak-${currentStreak}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full shadow-lg"
        >
          {isHighStreak && (
            <motion.span
              className="text-2xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              🔥
            </motion.span>
          )}
          <div className="flex flex-col items-center">
            <motion.span
              key={currentStreak}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-bold"
            >
              {currentStreak}
            </motion.span>
            <span className="text-xs font-medium uppercase tracking-wide">
              Streak
            </span>
          </div>
          {isHighStreak && (
            <motion.span
              className="text-2xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              🔥
            </motion.span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
