import { motion } from 'framer-motion';

interface ConfettiEffectProps {
  show: boolean;
}

export default function ConfettiEffect({ show }: ConfettiEffectProps) {
  if (!show) return null;

  const confettiPieces = [
    { emoji: '🎉', delay: 0, x: -30 },
    { emoji: '✨', delay: 0.1, x: -15 },
    { emoji: '⭐', delay: 0.05, x: 0 },
    { emoji: '🌟', delay: 0.15, x: 15 },
    { emoji: '🎊', delay: 0.2, x: 30 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {confettiPieces.map((piece, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.8],
            y: [-20, -60, -100, -140],
            x: piece.x,
            rotate: [0, 360, 720],
          }}
          transition={{
            duration: 1.5,
            delay: piece.delay,
            ease: 'easeOut',
          }}
          className="absolute text-2xl"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {piece.emoji}
        </motion.div>
      ))}
    </div>
  );
}
