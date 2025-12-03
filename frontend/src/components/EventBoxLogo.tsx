import { motion } from 'framer-motion';

interface EventBoxLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showText?: boolean;
  className?: string;
}

export default function EventBoxLogo({ 
  size = 'md', 
  animated = true, 
  showText = true,
  className = '' 
}: EventBoxLogoProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl'
  };

  const LogoIcon = () => null;

  const AnimatedLogo = () => (
    <motion.div
      animate={{
        rotateY: [0, 10, -10, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }}
    >
      <LogoIcon />
    </motion.div>
  );

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {animated ? <AnimatedLogo /> : <LogoIcon />}
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-white ${textSizeClasses[size]}`}>
            Event<span className="text-blue-400">Box</span>
          </span>
        </div>
      )}
    </div>
  );
}