# Animation Visual Guide

This guide provides a visual description of all animations implemented in the Live Quiz Event System.

## 🎯 Answer Button Animations

### Hover State
```
Normal State → Hover State
   [Button]  →  [Button↗]
   Scale: 1  →  Scale: 1.05
   Duration: 150ms
```

### Tap/Click State
```
Hover State → Tap State → Release
  [Button↗] → [Button↘] → [Button↗]
  Scale: 1.05 → 0.95 → 1.05
  Duration: 150ms
```

### Selection Animation
```
Unselected → Selected
  [Button]  → [Button✓]
  Spring animation with checkmark
  Stiffness: 500, Damping: 30
```

### Correct Answer Celebration
```
Selected → Correct Result
[Button✓] → [Button🎉]
           ↗ 🎊 ✨ ⭐ 🌟 🎉 ↖
Background: White → Green → White
Duration: 500ms + Confetti (1.5s)
```

### Incorrect Answer Shake
```
Selected → Incorrect Result
[Button✓] → ←→←→ [Button✗]
Horizontal shake: -10, 10, -10, 10, 0
Duration: 300ms
```

## 📝 Question Transition Animations

### Question Change Flow
```
Current Question → Transition → New Question
   [Question 1]  →  [Fade Out] → [Question 2]
   Slide Left ←     (300ms)      → Slide In
                                   (500ms)
```

### Timer Appearance
```
Question Appears → Timer Scales In
  [Question]     →  [Question]
                    [⏱️ 30s]
Scale: 0 → 1 (Spring animation)
Duration: 300ms
```

### Timer Urgent State (< 5 seconds)
```
Normal Timer → Urgent Timer
  [⏱️ 30s]   →  [⏱️ 4s]
                 ↕️ Pulse
Scale: 1 → 1.1 → 1 (Loop)
Duration: 500ms per cycle
```

## 📊 Leaderboard Animations

### Initial Display (Staggered)
```
Empty → Item 1 → Item 2 → Item 3
  [ ]     [#1]     [#1]     [#1]
          ↗        [#2]     [#2]
                   ↗        [#3]
                            ↗
Delay: 0ms, 50ms, 100ms, 150ms...
Duration: 300ms per item
```

### Rank Change Animation
```
Before Update → During Transition → After Update
  [#1 Alice]      [#1 Alice]         [#1 Bob]
  [#2 Bob]    →   [#2 Bob↑]      →   [#2 Alice]
  [#3 Carol]      [#3 Carol]         [#3 Carol]
                  
Smooth layout transition
Duration: 400ms
```

### Rank Improvement Highlight
```
Position Changes → Highlight → Normal
  [#2 Bob]       →  [#1 Bob]  → [#1 Bob]
                    (Yellow BG)  (Normal BG)
Background: White → Yellow → White
Duration: 500ms
```

## 👤 Participant Join Animations

### Join Form Appearance
```
Page Load → Form Fades In
  [ ]      →  [Join Quiz Event]
              [Choose nickname]
              [Nickname Options]
Fade in with staggered elements
Duration: 300ms + delays
```

### Element Stagger Timing
```
Title:     0ms   → [Join Quiz Event]
Subtitle:  100ms → [Choose nickname]
Content:   200ms → [Nickname Options]
Footer:    300ms → [Event ID: 123456]
```

### Successful Join Animation
```
Submitting → Success Screen
[Joining...] → [✓ You're In! 🎉]
               [Welcome, Alice]
               [Waiting for quiz...]

Icon: Rotate -180° → 0° + Scale 0 → 1
Title: Fade in from top (300ms delay)
Name: Fade in from top (400ms delay)
Waiting: Scale in (500ms delay)
```

### Welcome Icon Animation
```
Hidden → Rotating In → Visible
  [ ]   →   ↻ [✓]   →   [✓]
Scale: 0 → 1
Rotate: -180° → 0°
Spring animation
```

## 🏆 Podium Display Animations

### Entrance Sequence (Staggered)
```
Empty → 2nd Place → 3rd Place → 1st Place
 [ ]      [🥈]        [🥈]        [🥇]
          ↗           [🥉]        [🥈]
                      ↗           [🥉]
                                  ↗
Delays: 0ms, 300ms, 600ms
Duration: 500ms per position
```

### Medal Animation
```
Hidden → Spinning In → Visible
  [ ]   →   ↻ 🥇    →   🥇
Scale: 0 → 1
Rotate: -180° → 0°
Spring animation
```

### Confetti Effect (1st Place)
```
Continuous Loop:
    🎊 ✨ ⭐ 🌟 🎉
    ↑  ↑  ↑  ↑  ↑
    |  |  |  |  |
   [🥇 1st Place]
   
Particles rise and fade
Duration: 2s per cycle
Infinite loop
```

### Podium Shine Effect
```
Podium Block → Shine Passes → Normal
  [████]     →  [▓▓▓▓]    →  [████]
                ← Shine →
Gradient moves left to right
Duration: 1s
```

## 🎨 General Animation Patterns

### Fade In
```
Hidden → Visible
Opacity: 0 → 1
Duration: 300ms
```

### Slide In (Left)
```
Off Screen → On Screen
X: -20 → 0
Opacity: 0 → 1
Duration: 300ms
```

### Scale In
```
Hidden → Visible
Scale: 0 → 1
Opacity: 0 → 1
Spring animation
```

### Spring Physics
```
Start → Overshoot → Settle
  0   →    1.1    →   1
Stiffness: 300
Damping: 20
Natural bounce effect
```

## ⚡ Performance Characteristics

### GPU-Accelerated Properties
```
✅ transform: scale()
✅ transform: translate()
✅ transform: rotate()
✅ opacity
```

### Avoided Properties (Layout Triggers)
```
❌ width / height
❌ top / left (without transform)
❌ margin / padding
❌ border-width
```

### Animation Timing
```
FAST:   150ms (Hover, Tap)
NORMAL: 300ms (Transitions, Fades)
SLOW:   500ms (Complex animations)
MAX:    500ms (Performance requirement)
```

## 🎬 Complete User Journey Animation Flow

### 1. Joining Event
```
Load Page → Form Appears → Select Name → Joining → Success
   [ ]    →   [Form]     →   [Submit]  → [...]  → [✓ Welcome!]
   0ms        300ms          User         API      300ms
                             Action       Call     animation
```

### 2. Waiting for Quiz
```
Success Screen → Waiting Animation
[✓ Welcome!]   → [Waiting for quiz...]
                 [● ● ●] (Pulsing dots)
Continuous pulse animation
```

### 3. Quiz Starts
```
Waiting → First Question Appears
[Wait]  → [Question 1 slides in]
          [Timer scales in]
          [Answer buttons appear]
500ms transition
```

### 4. Answering Question
```
Question → Select → Submit → Result
[Q + A]  → [A✓]  → [...]  → [Correct! 🎉]
Hover     Spring   API      Confetti +
150ms     300ms    Call     Pulse 500ms
```

### 5. Viewing Results
```
Result → Statistics → Leaderboard
[🎉]   → [Bar Chart] → [Rankings]
         Bars grow    Items stagger
         500ms        50ms delay
```

### 6. Next Question
```
Leaderboard → Question Transition → New Question
[Rankings]  → [Slide out/in]     → [Question 2]
              300ms + 500ms         Timer appears
```

### 7. Quiz End
```
Last Question → Podium → Final Leaderboard
[Question 10] → [🥇🥈🥉] → [Full Rankings]
                Stagger    Fade in
                1.5s       After 3s
```

## 📱 Mobile Considerations

### Touch Feedback
```
Touch Start → Touch Active → Touch End
  [Button]  →   [Button↘]  → [Button]
  Scale: 1  →   Scale: 0.95 → Scale: 1
  150ms per transition
```

### Minimum Touch Targets
```
All interactive elements: 44px minimum height
Ensures comfortable mobile interaction
```

### Reduced Motion (Future)
```
If user prefers reduced motion:
- Instant transitions (0ms)
- No scale/rotate effects
- Simple fade in/out only
```

## 🎯 Animation Best Practices Applied

1. **Consistency**: All similar actions use same animation
2. **Feedback**: Every interaction has visual response
3. **Performance**: GPU-accelerated properties only
4. **Timing**: All animations ≤ 500ms
5. **Purpose**: Each animation serves UX purpose
6. **Accessibility**: Respects user preferences (future)

## 🔧 Customization Guide

To modify animation timings, edit `frontend/src/constants/animations.ts`:

```typescript
// Make animations faster
ANIMATION_DURATION = {
  FAST: 0.1,    // 100ms
  NORMAL: 0.2,  // 200ms
  SLOW: 0.4,    // 400ms
}

// Make animations slower
ANIMATION_DURATION = {
  FAST: 0.2,    // 200ms
  NORMAL: 0.4,  // 400ms
  SLOW: 0.6,    // 600ms (exceeds requirement)
}
```

---

**Note**: All animations are implemented using Framer Motion and follow Material Design animation principles for smooth, natural-feeling interactions.
