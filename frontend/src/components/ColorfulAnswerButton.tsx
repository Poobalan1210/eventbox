import { motion } from 'framer-motion';
import { ANSWER_COLORS, SHAPE_PATHS, AnswerColor, AnswerShape } from '../constants/answerStyles';
import { answerButtonVariants } from '../constants/animations';
import ConfettiEffect from './ConfettiEffect';

interface ColorfulAnswerButtonProps {
  option: {
    id: string;
    text: string;
    color: AnswerColor;
    shape: AnswerShape;
  };
  selected: boolean;
  disabled: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  onClick: () => void;
}

export default function ColorfulAnswerButton({
  option,
  selected,
  disabled,
  showResult = false,
  isCorrect = false,
  onClick,
}: ColorfulAnswerButtonProps) {
  const color = ANSWER_COLORS[option.color];
  const shapePath = SHAPE_PATHS[option.shape];

  // Use centralized animation variants
  const buttonVariants = {
    ...answerButtonVariants,
    hover: disabled ? {} : answerButtonVariants.hover,
    tap: disabled ? {} : answerButtonVariants.tap,
  };

  // Determine background color based on state
  const getBackgroundColor = () => {
    if (showResult && isCorrect) {
      return '#4CAF50'; // Green for correct
    }
    if (showResult && !isCorrect && selected) {
      return '#EF4444'; // Red for incorrect
    }
    if (selected) {
      return '#F3F4F6'; // Light gray for selected
    }
    return '#FFFFFF'; // White for default
  };

  // Determine border color
  const getBorderColor = () => {
    if (showResult && isCorrect) {
      return '#22C55E'; // Green border for correct
    }
    if (showResult && !isCorrect && selected) {
      return '#DC2626'; // Red border for incorrect
    }
    if (selected) {
      return color; // Use answer color for selected
    }
    return '#E5E7EB'; // Gray border for default
  };

  return (
    <motion.button
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      animate={
        showResult
          ? isCorrect
            ? 'correct'
            : selected
            ? 'incorrect'
            : 'initial'
          : 'initial'
      }
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left rounded-lg transition-all duration-200 overflow-hidden relative"
      style={{
        backgroundColor: getBackgroundColor(),
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: getBorderColor(),
        minHeight: '44px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !selected ? 0.6 : 1,
      }}
    >
      {/* Confetti effect for correct answers */}
      <ConfettiEffect show={showResult && isCorrect} />
      <div className="flex items-center space-x-3 md:space-x-4 px-4 md:px-6 py-3 md:py-4">
        {/* Geometric Shape Icon */}
        <div
          className="flex-shrink-0"
          style={{
            width: '48px',
            height: '48px',
          }}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            style={{
              filter: selected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none',
            }}
          >
            <path
              d={shapePath}
              fill={color}
              stroke={selected ? '#000000' : 'none'}
              strokeWidth={selected ? '2' : '0'}
            />
          </svg>
        </div>

        {/* Option Text */}
        <span
          className="flex-1 text-base md:text-lg font-medium"
          style={{
            color: showResult && (isCorrect || selected) ? '#FFFFFF' : '#1F2937',
          }}
        >
          {option.text}
        </span>

        {/* Selection/Result Indicator */}
        {selected && !showResult && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="flex-shrink-0"
          >
            <svg
              className="w-6 h-6 md:w-7 md:h-7"
              fill={color}
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        )}

        {/* Correct Answer Indicator */}
        {showResult && isCorrect && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex-shrink-0"
          >
            <svg
              className="w-7 h-7 md:w-8 md:h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        )}

        {/* Incorrect Answer Indicator */}
        {showResult && !isCorrect && selected && (
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex-shrink-0"
          >
            <svg
              className="w-7 h-7 md:w-8 md:h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
