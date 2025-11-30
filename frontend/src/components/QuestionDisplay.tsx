import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Question, AnswerStatistics } from '../types/models';
import type { AnswerResultPayload } from '../types/websocket';
import ColorfulAnswerButton from './ColorfulAnswerButton';
import StreakIndicator from './StreakIndicator';
import { questionTransitionVariants } from '../constants/animations';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  startTime: number; // Server-provided start time (not currently used, client calculates locally)
  remainingSeconds: number | null;
  onAnswerSubmit: (answerId: string, responseTime: number) => void;
  disabled: boolean;
  answerResult?: AnswerResultPayload | null;
  currentStreak?: number;
  answerStatistics?: AnswerStatistics | null;
}

export default function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  startTime: _startTime, // Prefix with underscore to indicate intentionally unused
  remainingSeconds,
  onAnswerSubmit,
  disabled,
  answerResult,
  currentStreak = 0,
  answerStatistics = null,
}: QuestionDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const questionDisplayTime = useRef<number>(Date.now());

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setImageLoaded(false);
    questionDisplayTime.current = Date.now();
  }, [question.id]);

  const handleAnswerSelect = (optionId: string) => {
    if (disabled || hasSubmitted) return;
    
    // Set selected answer
    setSelectedAnswer(optionId);
    
    // Auto-submit immediately (Kahoot-style)
    const responseTime = Date.now() - questionDisplayTime.current;
    setHasSubmitted(true);
    onAnswerSubmit(optionId, responseTime);
  };

  const isTimerActive = question.timerSeconds !== undefined && question.timerSeconds > 0;
  const isDisabled = disabled || hasSubmitted;
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Debug logging for timer visibility
  useEffect(() => {
    console.log('Timer state:', {
      isTimerActive,
      remainingSeconds,
      hasSubmitted,
      disabled
    });
  }, [isTimerActive, remainingSeconds, hasSubmitted, disabled]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
      {/* Streak and Points Indicators - Positioned prominently above question */}
      <div className="flex justify-center gap-4 mb-6">
        <StreakIndicator currentStreak={currentStreak} />
        
        {/* Points Earned Indicator - Shows after answer is submitted and result received */}
        {hasSubmitted && answerResult && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className={`px-6 py-3 rounded-full font-bold text-white shadow-lg ${
              answerResult.isCorrect ? 'bg-answer-green' : 'bg-answer-red'
            }`}
          >
            <div className="flex items-center gap-2">
              {answerResult.isCorrect ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-lg">
                {answerResult.isCorrect ? '+' : ''}{answerResult.pointsEarned} pts
              </span>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          variants={questionTransitionVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="bg-white/10 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/20"
        >
        {/* Header */}
        <div className="bg-kahoot-purple-dark text-white px-6 md:px-8 py-6 md:py-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base md:text-lg font-bold text-white/90">
              Question {questionNumber} of {totalQuestions}
            </span>
            {isTimerActive && typeof remainingSeconds === 'number' && remainingSeconds >= 0 && (
              <motion.div
                key={`timer-${question.id}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: remainingSeconds <= 5 ? [1, 1.1, 1] : 1,
                  opacity: 1
                }}
                transition={{
                  scale: remainingSeconds <= 5 ? {
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: 'reverse' as const
                  } : {
                    type: 'spring',
                    stiffness: 300,
                    damping: 20
                  },
                  opacity: { duration: 0.3 }
                }}
                className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full"
              >
                <svg
                  className="w-6 h-6 md:w-7 md:h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span
                  className={`text-2xl md:text-3xl font-bold ${
                    remainingSeconds <= 5 ? 'text-answer-red' : 'text-white'
                  }`}
                >
                  {remainingSeconds}s
                </span>
              </motion.div>
            )}
          </div>
          <h2 className="question-text text-2xl md:text-3xl lg:text-4xl">
            {question.text}
          </h2>
        </div>

        {/* Question Image */}
        {question.imageUrl && (
          <div className="relative bg-gray-100">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
            <img
              src={question.imageUrl}
              alt="Question illustration"
              className={`w-full h-auto max-h-96 object-contain transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          </div>
        )}

        {/* Answer Options */}
        <div className="p-6 md:p-8 space-y-4 md:space-y-5">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrectAnswer = answerResult?.correctOptionId === option.id;
            const showResult = hasSubmitted && answerResult !== null && answerResult !== undefined;
            
            // Get answer statistics for this option
            const optionStats = answerStatistics?.optionCounts[option.id];
            const answerCount = optionStats?.count || 0;
            const percentage = optionStats?.percentage || 0;

            return (
              <div key={option.id} className="relative">
                <ColorfulAnswerButton
                  option={option}
                  selected={isSelected}
                  disabled={isDisabled}
                  onClick={() => handleAnswerSelect(option.id)}
                  showResult={showResult}
                  isCorrect={isCorrectAnswer}
                />
                {/* Show answer distribution when statistics are available */}
                {answerStatistics && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {percentage}% ({answerCount})
                  </div>
                )}
              </div>
            );
          })}
        </div>


        </motion.div>
      </AnimatePresence>
    </div>
  );
}
