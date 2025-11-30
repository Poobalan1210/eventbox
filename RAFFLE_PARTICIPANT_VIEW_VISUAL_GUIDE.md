# Raffle Participant View - Visual Guide

## Overview

This guide provides a visual walkthrough of the `RaffleParticipantView` component, showing all UI states and interactions from the participant's perspective.

## Component States Flow

```
┌─────────────────┐
│  Raffle Started │
│  (Initial View) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Entry Button   │◄──── Participant sees prize description
│    Visible      │      and "Enter Raffle" button
└────────┬────────┘
         │ Click "Enter Raffle"
         ▼
┌─────────────────┐
│   Entering...   │◄──── Loading state with spinner
│  (API Call)     │
└────────┬────────┘
         │ Entry confirmed via WebSocket
         ▼
┌─────────────────┐
│ Entry Confirmed │◄──── Green checkmark, "You're Entered!"
│  (Waiting)      │      message displayed
└────────┬────────┘
         │ Organizer draws winners
         ▼
┌─────────────────┐
│    Drawing...   │◄──── Animated dice, "Drawing Winners..."
│  (Animation)    │      message with loading dots
└────────┬────────┘
         │ Winners selected
         ▼
┌─────────────────┐
│    Winners      │◄──── Winner/non-winner status card
│   Announced     │      + Full winners list displayed
└────────┬────────┘
         │ Raffle ends
         ▼
┌─────────────────┐
│  Raffle Ended   │◄──── Final thank you message
│   (Complete)    │      Winners list remains visible
└─────────────────┘
```

## Visual States

### 1. Initial State - Not Entered

```
╔═══════════════════════════════════════════════════════════╗
║  🎁 Raffle Time! 🎁                                       ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║                    ┌─────────────┐                        ║
║                    │     🎁      │  (Animated)            ║
║                    └─────────────┘                        ║
║                                                           ║
║              Win Amazing Prizes!                          ║
║                                                           ║
║         [Prize description text appears here]             ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │                                                     │ ║
║  │           🎟️  Enter Raffle                         │ ║
║  │                                                     │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Visual Elements:**
- Purple-to-pink gradient header
- Animated gift icon (scales and rotates)
- Large, prominent entry button
- Clean, centered layout

### 2. Entering State

```
╔═══════════════════════════════════════════════════════════╗
║  🎁 Raffle Time! 🎁                                       ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║                    ┌─────────────┐                        ║
║                    │     🎁      │                        ║
║                    └─────────────┘                        ║
║                                                           ║
║              Win Amazing Prizes!                          ║
║                                                           ║
║         [Prize description text appears here]             ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │                                                     │ ║
║  │           ⟳  Entering...                           │ ║
║  │                                                     │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Visual Elements:**
- Button disabled with gray background
- Spinning loader icon
- "Entering..." text
- Prevents duplicate submissions

### 3. Entry Confirmed State

```
╔═══════════════════════════════════════════════════════════╗
║  🎁 Raffle Time! 🎁                                       ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║                    ┌─────────────┐                        ║
║                    │     🎁      │                        ║
║                    └─────────────┘                        ║
║                                                           ║
║              Win Amazing Prizes!                          ║
║                                                           ║
║         [Prize description text appears here]             ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │                    ┌───┐                            │ ║
║  │                    │ ✓ │  (Animated checkmark)      │ ║
║  │                    └───┘                            │ ║
║  │                                                     │ ║
║  │              You're Entered! ✓                      │ ║
║  │                                                     │ ║
║  │          Good luck, [Participant Name]!            │ ║
║  │                                                     │ ║
║  │   Winners will be announced soon. Stay tuned! 🎉   │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Visual Elements:**
- Green confirmation box with border
- Animated checkmark icon (spring animation)
- Success message with participant name
- Encouraging "stay tuned" message

### 4. Drawing State

```
╔═══════════════════════════════════════════════════════════╗
║  🎁 Raffle Time! 🎁                                       ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║                    ┌─────────────┐                        ║
║                    │     🎁      │                        ║
║                    └─────────────┘                        ║
║                                                           ║
║              Win Amazing Prizes!                          ║
║                                                           ║
║         [Prize description text appears here]             ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │                                                     │ ║
║  │                    ┌───┐                            │ ║
║  │                    │ 🎲 │  (Spinning & scaling)     │ ║
║  │                    └───┘                            │ ║
║  │                                                     │ ║
║  │             Drawing Winners...                      │ ║
║  │                                                     │ ║
║  │   Hold tight! The winners are being selected!      │ ║
║  │                                                     │ ║
║  │                  • • •  (Pulsing dots)             │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Visual Elements:**
- Purple gradient box with border
- Animated dice icon (rotates 360° continuously)
- "Drawing Winners..." heading
- Pulsing loading dots
- Builds anticipation

### 5. Winners Announced - Winner View

```
╔═══════════════════════════════════════════════════════════╗
║  🎁 Raffle Time! 🎁                                       ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │                                                     │ ║
║  │                    🎉  (Pulsing)                    │ ║
║  │                                                     │ ║
║  │              Congratulations!                       │ ║
║  │                                                     │ ║
║  │           You Won the Raffle!                       │ ║
║  │                                                     │ ║
║  │      [Participant Name], you're a winner! 🏆       │ ║
║  │                                                     │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │              🏆 Winners 🏆                          │ ║
║  │                                                     │ ║
║  │  ┌───────────────────────────────────────────────┐ │ ║
║  │  │ 🥇  Alice Johnson                             │ │ ║
║  │  └───────────────────────────────────────────────┘ │ ║
║  │  ┌───────────────────────────────────────────────┐ │ ║
║  │  │ 🥈  [Your Name] (You!) ⭐ (Pulsing)           │ │ ║
║  │  └───────────────────────────────────────────────┘ │ ║
║  │  ┌───────────────────────────────────────────────┐ │ ║
║  │  │ 🥉  Charlie Davis                             │ │ ║
║  │  └───────────────────────────────────────────────┘ │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Visual Elements:**
- Yellow-to-orange gradient winner card
- Pulsing trophy emoji
- Large congratulations message
- Winners list with medals (🥇🥈🥉)
- Current participant highlighted with yellow gradient
- Animated star for winner's entry

### 6. Winners Announced - Non-Winner View

```
╔═══════════════════════════════════════════════════════════╗
║  🎁 Raffle Time! 🎁                                       ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │                                                     │ ║
║  │                      😊                             │ ║
║  │                                                     │ ║
║  │         Thanks for Participating!                   │ ║
║  │                                                     │ ║
║  │      Better luck next time, [Your Name]!           │ ║
║  │                                                     │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │              🏆 Winners 🏆                          │ ║
║  │                                                     │ ║
║  │  ┌───────────────────────────────────────────────┐ │ ║
║  │  │ 🥇  Alice Johnson                             │ │ ║
║  │  └───────────────────────────────────────────────┘ │ ║
║  │  ┌───────────────────────────────────────────────┐ │ ║
║  │  │ 🥈  Bob Williams                              │ │ ║
║  │  └───────────────────────────────────────────────┘ │ ║
║  │  ┌───────────────────────────────────────────────┐ │ ║
║  │  │ 🥉  Charlie Davis                             │ │ ║
║  │  └───────────────────────────────────────────────┘ │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Visual Elements:**
- White/transparent card with encouraging message
- Smiling emoji
- "Better luck next time" message
- Winners list without highlighting
- Respectful, positive tone

### 7. Raffle Ended State

```
╔═══════════════════════════════════════════════════════════╗
║  🎁 Raffle Time! 🎁                                       ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  [Winner/Non-Winner Status Card - as shown above]         ║
║                                                           ║
║  [Winners List - as shown above]                          ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │                                                     │ ║
║  │   Thanks for participating, [Participant Name]! 🎊 │ ║
║  │                                                     │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Visual Elements:**
- All previous elements remain visible
- Additional thank you message at bottom
- Final state - no more interactions

## Animation Details

### 1. Gift Icon Animation
- **Type**: Continuous loop
- **Effects**: Scale (1 → 1.1 → 1) + Rotate (0° → 5° → -5° → 0°)
- **Duration**: 2 seconds
- **Purpose**: Draw attention to prize

### 2. Entry Button Hover
- **Type**: On hover
- **Effect**: Scale (1 → 1.02)
- **Purpose**: Interactive feedback

### 3. Entry Button Tap
- **Type**: On click
- **Effect**: Scale (1 → 0.98)
- **Purpose**: Tactile feedback

### 4. Checkmark Entrance
- **Type**: One-time on entry confirmation
- **Effect**: Scale (0 → 1) + Rotate (-180° → 0°)
- **Transition**: Spring (stiffness: 300, damping: 20)
- **Purpose**: Celebratory confirmation

### 5. Drawing Dice Animation
- **Type**: Continuous loop during drawing
- **Effects**: Scale (1 → 1.2 → 1) + Rotate (0° → 360°)
- **Duration**: 2 seconds
- **Purpose**: Show active drawing process

### 6. Winner Card Entrance
- **Type**: One-time on winner announcement
- **Effect**: Scale (0 → 1) + Rotate (-180° → 0°)
- **Transition**: Spring (stiffness: 200, damping: 15)
- **Purpose**: Dramatic reveal

### 7. Trophy Pulse (Winner)
- **Type**: Continuous loop for winners
- **Effect**: Scale (1 → 1.2 → 1)
- **Duration**: 1 second
- **Purpose**: Celebrate victory

### 8. Star Pulse (Winner Highlight)
- **Type**: Continuous loop for winner's entry
- **Effects**: Scale (1 → 1.2 → 1) + Rotate (0° → 10° → -10° → 0°)
- **Duration**: 1 second
- **Purpose**: Highlight winner in list

### 9. Winners List Stagger
- **Type**: One-time on list display
- **Effect**: Opacity (0 → 1) + X position (-20 → 0)
- **Delay**: 0.1s per item
- **Purpose**: Sequential reveal

## Color Palette

### Primary Colors
- **Header Gradient**: `from-purple-600 to-pink-600`
- **Background**: `bg-white/10` with `backdrop-blur-sm`
- **Border**: `border-white/20`

### State Colors
- **Success/Entry**: `green-500` with `green-500/20` background
- **Winner**: `from-yellow-400 to-orange-500`
- **Drawing**: `from-purple-500/20 to-pink-500/20`
- **Non-Winner**: `bg-white/20`

### Text Colors
- **Primary**: `text-white`
- **Secondary**: `text-white/90`
- **Tertiary**: `text-white/80`
- **Muted**: `text-white/70`

## Responsive Breakpoints

### Mobile (< 768px)
- Text: `text-2xl` (header), `text-base` (body)
- Padding: `p-6`, `py-5`
- Icons: `w-8 h-8`

### Tablet/Desktop (≥ 768px)
- Text: `md:text-3xl` (header), `md:text-lg` (body)
- Padding: `md:p-8`, `md:py-6`
- Icons: `md:w-10 md:h-10`

### Large Desktop (≥ 1024px)
- Text: `lg:text-4xl` (header), `lg:text-xl` (body)
- Maximum width: `max-w-2xl`

## Accessibility Features

1. **Semantic HTML**: Proper heading hierarchy and button elements
2. **High Contrast**: White text on dark backgrounds
3. **Large Touch Targets**: Buttons are 48px+ in height
4. **Clear Visual Feedback**: Every interaction has visual response
5. **Loading States**: Prevent accidental double-submissions
6. **Error Messages**: User-friendly alerts for failures
7. **Keyboard Navigation**: All interactive elements are keyboard accessible

## User Experience Flow

1. **Discovery**: Participant sees attractive prize description
2. **Action**: Large, obvious entry button
3. **Feedback**: Immediate loading state on click
4. **Confirmation**: Clear success message with checkmark
5. **Anticipation**: Engaging drawing animation
6. **Revelation**: Dramatic winner announcement
7. **Closure**: Thank you message and final state

## Best Practices

1. **Always show prize description** - It's the main motivator
2. **Provide immediate feedback** - Loading states prevent confusion
3. **Celebrate winners** - Make them feel special
4. **Be gracious to non-winners** - Positive messaging
5. **Keep animations smooth** - 60fps for all animations
6. **Test on mobile** - Most participants use phones
7. **Handle errors gracefully** - Network issues happen

## Integration Notes

- Component is self-contained and manages its own state
- Communicates via WebSocket for real-time updates
- Uses REST API for entry submission
- Filters events by activityId for multi-activity support
- Cleans up event listeners on unmount

## Testing Checklist

- [ ] Prize description displays correctly
- [ ] Entry button is clickable and responsive
- [ ] Loading state shows during API call
- [ ] Entry confirmation appears after success
- [ ] Drawing animation plays smoothly
- [ ] Winner status displays correctly
- [ ] Non-winner status displays correctly
- [ ] Winners list shows all winners
- [ ] Current participant is highlighted if winner
- [ ] Animations are smooth (60fps)
- [ ] Responsive design works on mobile
- [ ] Error handling shows user-friendly messages
- [ ] WebSocket events are properly filtered by activityId
- [ ] Component cleans up on unmount
