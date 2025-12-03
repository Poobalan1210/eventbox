/**
 * RaffleParticipantView - Raffle participant interface
 * 
 * This component renders the raffle interface for participants, allowing them to:
 * - View the prize description
 * - Enter the raffle (manual entry mode)
 * - See entry confirmation
 * - View winner announcements with animations
 * - See entry status indicator
 * 
 * Requirement: 6.4
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../contexts/WebSocketContext';
import type {
  RaffleStartedPayload,
  RaffleEntryConfirmedPayload,
  RaffleDrawingPayload,
  RaffleWinnersAnnouncedPayload,
  RaffleEndedPayload,
  RaffleWinner,
} from '../types/websocket';

interface RaffleParticipantViewProps {
  eventId: string;
  activityId: string;
  participantName: string;
}

export default function RaffleParticipantView({
  eventId: _eventId, // Used for future WebSocket room management
  activityId,
  participantName,
}: RaffleParticipantViewProps) {
  const { on } = useWebSocket();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  // Raffle state
  const [prizeDescription, setPrizeDescription] = useState('');
  const [entryMethod, setEntryMethod] = useState<'automatic' | 'manual'>('manual');
  const [hasEntered, setHasEntered] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [winners, setWinners] = useState<RaffleWinner[]>([]);
  const [showWinners, setShowWinners] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRaffleEnded, setIsRaffleEnded] = useState(false);

  // Auto-enter function for automatic mode
  const autoEnterRaffle = async () => {
    console.log('🎫 Auto-enter raffle called:', { hasEntered, isEntering, participantName });
    if (hasEntered || isEntering) {
      console.log('🎫 Skipping auto-enter:', { hasEntered, isEntering });
      return;
    }
    
    setIsEntering(true);
    console.log('🎫 Attempting to auto-enter participant:', participantName);
    
    try {
      const response = await fetch(
        `${apiBaseUrl}/activities/${activityId}/enter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantId: participantName, // Using participantName as ID for now
            participantName,
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to enter raffle');
      }
      
      console.log('Auto-entered raffle successfully');
    } catch (error) {
      console.error('Error auto-entering raffle:', error);
    } finally {
      setIsEntering(false);
    }
  };

  // Check if raffle is already active when component mounts
  useEffect(() => {
    const checkRaffleStatus = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/activities/${activityId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.activity && data.activity.type === 'raffle' && data.activity.status === 'active') {
            console.log('Raffle is already active, setting up state');
            setPrizeDescription(data.activity.prizeDescription || '');
            setEntryMethod(data.activity.entryMethod || 'manual');
            
            // Auto-enter if automatic entry mode and not already entered
            if (data.activity.entryMethod === 'automatic' && !hasEntered) {
              console.log('Auto-entering participant in already active automatic raffle');
              autoEnterRaffle();
            }
          }
        }
      } catch (error) {
        console.error('Error checking raffle status:', error);
      }
    };

    checkRaffleStatus();
  }, [activityId, hasEntered]);

  // Listen for raffle-started event
  useEffect(() => {
    const cleanup = on('raffle-started', (payload: RaffleStartedPayload) => {
      console.log('Raffle started:', payload);
      if (payload.activityId === activityId) {
        setPrizeDescription(payload.prizeDescription);
        setEntryMethod(payload.entryMethod);
        setHasEntered(false);
        setWinners([]);
        setShowWinners(false);
        setIsDrawing(false);
        setIsRaffleEnded(false);

        // Auto-enter if automatic entry mode
        if (payload.entryMethod === 'automatic') {
          console.log('Auto-entering participant in automatic mode');
          autoEnterRaffle();
        }
      }
    });

    return cleanup;
  }, [on, activityId]);

  // Listen for raffle-entry-confirmed event
  useEffect(() => {
    const cleanup = on('raffle-entry-confirmed', (payload: RaffleEntryConfirmedPayload) => {
      console.log('Raffle entry confirmed:', payload);
      // Only mark as entered if this is for the current participant
      if (payload.activityId === activityId && payload.participantName === participantName) {
        setHasEntered(true);
      }
    });

    return cleanup;
  }, [on, activityId, participantName]);

  // Listen for raffle-drawing event
  useEffect(() => {
    const cleanup = on('raffle-drawing', (payload: RaffleDrawingPayload) => {
      console.log('🎁 Raffle drawing started - showing gift box animation:', payload);
      if (payload.activityId === activityId) {
        setIsDrawing(true);
      }
    });

    return cleanup;
  }, [on, activityId]);

  // Listen for raffle-winners-announced event
  useEffect(() => {
    const cleanup = on('raffle-winners-announced', (payload: RaffleWinnersAnnouncedPayload) => {
      console.log('Raffle winners announced:', payload);
      if (payload.activityId === activityId) {
        setWinners(payload.winners);
        setShowWinners(true);
        setIsDrawing(false);
      }
    });

    return cleanup;
  }, [on, activityId]);

  // Listen for raffle-ended event
  useEffect(() => {
    const cleanup = on('raffle-ended', (payload: RaffleEndedPayload) => {
      console.log('Raffle ended:', payload);
      if (payload.activityId === activityId) {
        setIsRaffleEnded(true);
      }
    });

    return cleanup;
  }, [on, activityId]);

  const handleEnterRaffle = async () => {
    if (hasEntered || isEntering) return;
    
    setIsEntering(true);
    
    try {
      // Submit entry via API
      const response = await fetch(
        `${apiBaseUrl}/activities/${activityId}/enter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantId: participantName, // Using participantName as ID for now
            participantName,
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to enter raffle');
      }
      
      // Entry confirmation will come via WebSocket
    } catch (error) {
      console.error('Error entering raffle:', error);
      alert(error instanceof Error ? error.message : 'Failed to enter raffle');
    } finally {
      setIsEntering(false);
    }
  };

  const isWinner = winners.some(w => w.participantName === participantName);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/20"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 md:px-8 py-6 md:py-8">
          <div className="flex items-center gap-3 mb-2">
            <svg
              className="w-8 h-8 md:w-10 md:h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
              🎁 Raffle Time! 🎁
            </h2>
          </div>
        </div>

        {/* Prize Description */}
        <div className="p-6 md:p-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/20 mb-6">
            <div className="text-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="text-6xl md:text-7xl mb-4"
              >
                🎁
              </motion.div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                Win Amazing Prizes!
              </h3>
              <p className="text-base md:text-lg text-white whitespace-pre-wrap">
                {prizeDescription}
              </p>
            </div>
          </div>

          {/* Drawing Animation */}
          {isDrawing && (
            <motion.div
              key="drawing-animation-v3-gift-boxes"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500 rounded-xl p-8 md:p-12 text-center mb-6 overflow-hidden relative"
            >
              {/* Floating confetti background */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][i % 6],
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      x: [0, Math.random() * 40 - 20, 0],
                      rotate: [0, 360],
                      scale: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              {/* Main animation - spinning gift boxes */}
              <div className="relative z-10">
                <div className="flex justify-center items-center gap-4 mb-6">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 180, 360],
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: 'easeInOut',
                      }}
                      className="text-4xl md:text-5xl"
                    >
                      🎁
                    </motion.div>
                  ))}
                </div>

                {/* Magical sparkles */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-3xl md:text-4xl mb-4"
                >
                  ✨ 🌟 ✨
                </motion.div>

                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  🎪 Drawing Winners! 🎪
                </h3>
                <p className="text-base md:text-lg text-white mb-4">
                  The magic is happening... Who will be the lucky winner?
                </p>

                {/* Animated progress dots */}
                <div className="flex items-center justify-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full bg-white"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 1, 0.4],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Winners Announcement */}
          <AnimatePresence>
            {showWinners && !isDrawing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6 mb-6"
              >
                {/* Winner/Loser Status */}
                {isWinner ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 md:p-8 text-center border-4 border-yellow-300 shadow-2xl relative overflow-hidden"
                  >
                    {/* Celebration confetti */}
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-3 h-3"
                          style={{
                            backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][i % 6],
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                          }}
                          animate={{
                            y: [0, -30, 30, 0],
                            x: [0, Math.random() * 60 - 30, 0],
                            rotate: [0, 360, 720],
                            scale: [0, 1.5, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                          }}
                        />
                      ))}
                    </div>

                    <div className="relative z-10">
                      {/* Celebration emojis */}
                      <div className="flex justify-center items-center gap-2 mb-4">
                        {['🎉', '🏆', '🎊', '⭐', '🎁'].map((emoji, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              scale: [1, 1.3, 1],
                              rotate: [0, 15, -15, 0],
                              y: [0, -5, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.1,
                            }}
                            className="text-3xl md:text-4xl"
                          >
                            {emoji}
                          </motion.div>
                        ))}
                      </div>

                      <motion.h3 
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                        className="text-3xl md:text-4xl font-bold text-white mb-3"
                      >
                        🎊 WINNER! 🎊
                      </motion.h3>
                      <p className="text-xl md:text-2xl text-white font-semibold mb-2">
                        Congratulations {participantName}!
                      </p>
                      <p className="text-base md:text-lg text-white">
                        You've won the raffle! 🏆✨
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/20 backdrop-blur-sm rounded-xl p-6 md:p-8 text-center border border-white/30"
                  >
                    <div className="text-5xl md:text-6xl mb-4">😊</div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      Thanks for Participating!
                    </h3>
                    <p className="text-base md:text-lg text-white">
                      Better luck next time, {participantName}!
                    </p>
                  </motion.div>
                )}

                {/* Winners List */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/20">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                    <span>🏆</span>
                    <span>Winners</span>
                    <span>🏆</span>
                  </h3>
                  <div className="space-y-3">
                    {winners.map((winner, index) => {
                      const isCurrentParticipant = winner.participantName === participantName;
                      
                      return (
                        <motion.div
                          key={winner.participantId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 md:p-5 rounded-lg transition-all ${
                            isCurrentParticipant
                              ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400 shadow-lg'
                              : 'bg-white/10 border border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl md:text-4xl flex-shrink-0">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎉'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className={`font-bold text-lg md:text-xl break-words ${
                                isCurrentParticipant ? 'text-yellow-300' : 'text-white'
                              }`}>
                                {winner.participantName}
                                {isCurrentParticipant && (
                                  <span className="ml-2 text-yellow-200">(You!)</span>
                                )}
                              </span>
                            </div>
                            {isCurrentParticipant && (
                              <motion.div
                                animate={{
                                  scale: [1, 1.2, 1],
                                  rotate: [0, 10, -10, 0],
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  repeatType: 'reverse',
                                }}
                                className="text-2xl flex-shrink-0"
                              >
                                ⭐
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Entry Button (Manual Entry Mode Only) */}
          {!hasEntered && !showWinners && !isDrawing && entryMethod === 'manual' && (
            <motion.button
              onClick={handleEnterRaffle}
              disabled={isEntering}
              whileHover={!isEntering ? { scale: 1.02 } : {}}
              whileTap={!isEntering ? { scale: 0.98 } : {}}
              className={`w-full py-4 md:py-5 rounded-xl font-bold text-lg md:text-xl transition-all shadow-lg ${
                isEntering
                  ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600'
              }`}
            >
              {isEntering ? (
                <span className="flex items-center justify-center gap-3">
                  <svg
                    className="animate-spin h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Entering...
                </span>
              ) : (
                <>
                  <span className="mr-2">🎟️</span>
                  Enter Raffle
                </>
              )}
            </motion.button>
          )}

          {/* Entry Confirmation */}
          {hasEntered && !showWinners && !isDrawing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/20 border-2 border-green-500 rounded-xl p-6 md:p-8 text-center relative overflow-hidden"
            >
              {/* Floating sparkles */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-lg"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </div>

              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-green-500/30 rounded-full mb-4"
                >
                  <motion.svg
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </motion.svg>
                </motion.div>

                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  🎫 You're In! 🎫
                </h3>
                <p className="text-base md:text-lg text-white mb-2">
                  Good luck, {participantName}!
                </p>
                <p className="text-sm md:text-base text-white">
                  The drawing will begin soon. Get ready for the excitement! 🎉
                </p>
              </div>
            </motion.div>
          )}

          {/* Raffle Ended Message */}
          {isRaffleEnded && showWinners && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/20 text-center"
            >
              <p className="text-base md:text-lg text-white">
                Thanks for participating, {participantName}! 🎊
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
