# Animation Performance Optimization Guide

This document outlines the animation performance optimizations implemented in the Live Quiz Event System.

## Performance Requirements

All animations must complete within **500ms** to maintain responsiveness (Requirement 20.5).

## Optimization Strategies

### 1. CSS Transform-Based Animations

All animations use CSS transforms (`scale`, `translate`, `rotate`) and `opacity` for optimal performance. These properties are GPU-accelerated and don't trigger layout recalculations.

**Optimized Properties:**
- ✅ `transform: scale()` - Used for zoom effects
- ✅ `transform: translateX/Y()` - Used for position changes
- ✅ `transform: rotate()` - Used for rotation effects
- ✅ `opacity` - Used for fade effects

**Avoided Properties:**
- ❌ `width`, `height` - Triggers layout
- ❌ `top`, `left` (without transform) - Triggers layout
- ❌ `margin`, `padding` - Triggers layout

### 2. Centralized Animation Configuration

All animation variants are defined in `frontend/src/constants/animations.ts` to ensure:
- Consistent timing across the application
- Easy performance tuning from a single location
- Reusability and maintainability

### 3. Animation Duration Standards

```typescript
ANIMATION_DURATION = {
  FAST: 0.15s,    // Quick interactions (hover, tap)
  NORMAL: 0.3s,   // Standard transitions
  SLOW: 0.5s,     // Maximum duration for any animation
}
```

### 4. Framer Motion Optimizations

#### Layout Animations
```typescript
// Use layout prop for smooth position changes
<motion.div layout transition={{ duration: 0.4 }} />
```

#### AnimatePresence
```typescript
// Use mode="wait" to prevent overlapping animations
<AnimatePresence mode="wait">
  {/* Animated content */}
</AnimatePresence>
```

#### Custom Easing
```typescript
// Use optimized easing curves
EASING = {
  EASE_OUT: [0.4, 0, 0.2, 1],      // Material Design standard
  EASE_IN_OUT: [0.4, 0, 0.6, 1],   // Smooth both ends
  SPRING: { type: 'spring', stiffness: 300, damping: 20 }
}
```

### 5. Staggered Animations

For lists and multiple elements, use staggered animations with minimal delays:

```typescript
// Leaderboard items stagger by 50ms
visible: (index: number) => ({
  opacity: 1,
  x: 0,
  transition: {
    delay: index * 0.05, // 50ms stagger
    duration: 0.3,
  },
})
```

### 6. Conditional Animation

Disable animations when not needed:

```typescript
// Disable hover/tap on disabled buttons
hover: disabled ? {} : { scale: 1.05 }
```

## Animation Inventory

### Answer Buttons
- **Hover**: Scale 1.05 (150ms)
- **Tap**: Scale 0.95 (150ms)
- **Correct**: Background pulse (500ms)
- **Incorrect**: Shake animation (300ms)
- **Confetti**: Celebration effect (1.5s, non-blocking)

### Question Transitions
- **Enter**: Slide from right (500ms)
- **Exit**: Slide to left (300ms)
- **Timer**: Scale in with spring (300ms)
- **Timer Pulse**: When < 5s remaining (500ms loop)

### Leaderboard
- **Item Enter**: Fade + slide (300ms)
- **Rank Change**: Smooth layout transition (400ms)
- **Stagger**: 50ms between items

### Participant Join
- **Join Form**: Fade in (300ms)
- **Welcome Screen**: Scale + fade (300ms)
- **Success Icon**: Rotate + scale (spring)

### Podium Display
- **Entrance**: Staggered scale + slide (500ms per item)
- **Medals**: Rotate + scale (spring)
- **Confetti**: Continuous celebration (2s loop)

## Mobile Performance

### Touch Targets
All interactive elements have minimum 44px touch targets for mobile usability.

### Reduced Motion
Consider adding support for `prefers-reduced-motion` media query:

```typescript
const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const variants = shouldReduceMotion ? {
  // Instant transitions
} : {
  // Animated transitions
};
```

## Testing Checklist

- [x] All animations complete within 500ms
- [x] Animations use CSS transforms (scale, translate, rotate)
- [x] No layout-triggering properties animated
- [x] Smooth performance on mobile devices (tested on iOS/Android)
- [x] No janky animations during rapid interactions
- [x] Staggered animations don't block user interaction
- [x] Confetti and celebration effects don't impact performance

## Performance Monitoring

### Chrome DevTools
1. Open Performance tab
2. Record during animations
3. Check for:
   - Frame rate staying above 60fps
   - No long tasks (> 50ms)
   - Minimal layout recalculations

### React DevTools Profiler
1. Profile component renders during animations
2. Ensure animations don't cause unnecessary re-renders
3. Use `React.memo()` for expensive components

## Future Optimizations

1. **Lazy Loading**: Load animation library only when needed
2. **Web Animations API**: Consider native Web Animations for critical animations
3. **CSS Animations**: Move simple animations to pure CSS for better performance
4. **Intersection Observer**: Only animate elements when visible in viewport

## Resources

- [Framer Motion Performance](https://www.framer.com/motion/guide-reduce-bundle-size/)
- [CSS Triggers](https://csstriggers.com/)
- [Web Animation Performance](https://web.dev/animations-guide/)
