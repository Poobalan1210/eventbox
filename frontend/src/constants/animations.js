// Animation variants and configurations for Framer Motion
// All animations should complete within 500ms for responsiveness
export const ANIMATION_DURATION = {
    FAST: 0.15,
    NORMAL: 0.3,
    SLOW: 0.5,
};
export const EASING = {
    EASE_OUT: [0.4, 0, 0.2, 1],
    EASE_IN_OUT: [0.4, 0, 0.6, 1],
    SPRING: { type: 'spring', stiffness: 300, damping: 20 },
};
// Answer Button Animations
export const answerButtonVariants = {
    initial: { scale: 1, opacity: 1 },
    hover: { scale: 1.05, transition: { duration: ANIMATION_DURATION.FAST } },
    tap: { scale: 0.95, transition: { duration: ANIMATION_DURATION.FAST } },
    selected: {
        scale: 1,
        transition: { type: 'spring', stiffness: 500, damping: 30 },
    },
    correct: {
        backgroundColor: ['#ffffff', '#4CAF50', '#ffffff'],
        transition: { duration: ANIMATION_DURATION.SLOW, repeat: 1 },
    },
    incorrect: {
        x: [-10, 10, -10, 10, 0],
        transition: { duration: ANIMATION_DURATION.NORMAL },
    },
};
// Question Transition Animations
export const questionTransitionVariants = {
    enter: {
        x: 100,
        opacity: 0,
    },
    center: {
        x: 0,
        opacity: 1,
        transition: {
            duration: ANIMATION_DURATION.SLOW,
            ease: EASING.EASE_OUT,
        },
    },
    exit: {
        x: -100,
        opacity: 0,
        transition: {
            duration: ANIMATION_DURATION.NORMAL,
            ease: EASING.EASE_IN_OUT,
        },
    },
};
// Timer Animation
export const timerVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
            duration: ANIMATION_DURATION.NORMAL,
        },
    },
    pulse: {
        scale: [1, 1.1, 1],
        transition: {
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'reverse',
        },
    },
};
// Leaderboard Animations
export const leaderboardItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (index) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: index * 0.05, // Stagger by 50ms
            duration: ANIMATION_DURATION.NORMAL,
            ease: EASING.EASE_OUT,
        },
    }),
    rankChange: {
        y: [0, -10, 0],
        backgroundColor: ['#ffffff', '#FEF3C7', '#ffffff'],
        transition: {
            duration: ANIMATION_DURATION.SLOW,
            ease: EASING.EASE_IN_OUT,
        },
    },
};
// Participant Join Animation
export const participantJoinVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: ANIMATION_DURATION.NORMAL,
            ease: EASING.EASE_OUT,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        transition: {
            duration: ANIMATION_DURATION.FAST,
        },
    },
};
// Welcome Message Animation
export const welcomeMessageVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: ANIMATION_DURATION.NORMAL,
            ease: EASING.EASE_OUT,
        },
    },
    exit: {
        opacity: 0,
        y: 20,
        transition: {
            duration: ANIMATION_DURATION.FAST,
        },
    },
};
// Podium Animation (already implemented in PodiumDisplay)
export const podiumVariants = {
    hidden: { y: 100, opacity: 0, scale: 0.8 },
    visible: (custom) => ({
        y: 0,
        opacity: 1,
        scale: 1,
        transition: {
            delay: custom * 0.3,
            duration: ANIMATION_DURATION.SLOW, // 500ms for performance
            ease: EASING.EASE_OUT,
        },
    }),
};
// Confetti Animation
export const confettiVariants = {
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
// Fade In Animation (general purpose)
export const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: ANIMATION_DURATION.NORMAL,
        },
    },
};
// Slide In Animation (general purpose)
export const slideInVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            duration: ANIMATION_DURATION.NORMAL,
            ease: EASING.EASE_OUT,
        },
    },
};
// Scale In Animation (general purpose)
export const scaleInVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
        },
    },
};
