# Task 35: Manual Testing Guide for Phase 2 Features

## Overview
This guide provides step-by-step instructions for manually testing all Phase 2 features after deployment.

## Prerequisites
- Deployment completed successfully
- Frontend URL accessible
- Backend WebSocket server running
- Multiple devices available for testing (desktop, mobile)

## Test Environment Setup

### Get Your URLs
After deployment, note these URLs:
- **Frontend URL**: From CloudFront output
- **Backend URL**: From ALB output

### Test Accounts
You'll need multiple browser windows/devices to simulate multiple participants.

## Feature Testing

### 1. Game PIN System

#### Test 1.1: PIN Generation
1. Open frontend URL
2. Click "Create Event"
3. Enter event name: "Phase 2 Test"
4. Click "Create"
5. **Verify**: 6-digit numeric PIN is displayed
6. **Verify**: PIN is exactly 6 digits (e.g., "123456")
7. **Verify**: QR code is displayed

#### Test 1.2: PIN Lookup
1. Open new incognito window
2. Go to frontend URL
3. Click "Join with PIN"
4. Enter the 6-digit PIN from Test 1.1
5. Click "Join"
6. **Verify**: Navigates to correct event
7. **Verify**: Event name matches

#### Test 1.3: Invalid PIN
1. Open new incognito window
2. Go to frontend URL
3. Click "Join with PIN"
4. Enter invalid PIN: "999999"
5. Click "Join"
6. **Verify**: Error message displayed
7. **Verify**: Does not navigate

#### Test 1.4: PIN Uniqueness
1. Create 3 different events
2. **Verify**: Each has a different PIN
3. **Verify**: All PINs are 6 digits

---

### 2. Colorful Answer Buttons

#### Test 2.1: Two Options
1. Create event
2. Add question with 2 options
3. Start quiz and join as participant
4. Display question
5. **Verify**: Red Triangle button
6. **Verify**: Blue Diamond button
7. **Verify**: Shapes are visible and distinct

#### Test 2.2: Three Options
1. Add question with 3 options
2. Display question
3. **Verify**: Red Triangle
4. **Verify**: Blue Diamond
5. **Verify**: Yellow Circle

#### Test 2.3: Four Options
1. Add question with 4 options
2. Display question
3. **Verify**: Red Triangle
4. **Verify**: Blue Diamond
5. **Verify**: Yellow Circle
6. **Verify**: Green Square

#### Test 2.4: Five Options
1. Add question with 5 options
2. Display question
3. **Verify**: Red Triangle
4. **Verify**: Blue Diamond
5. **Verify**: Yellow Circle
6. **Verify**: Green Square
7. **Verify**: Purple Pentagon

#### Test 2.5: Animations (Desktop)
1. Display question with 4 options
2. Hover over each button
3. **Verify**: Scale animation on hover
4. Click button
5. **Verify**: Click animation
6. **Verify**: Selected state styling

#### Test 2.6: Animations (Mobile)
1. Open on mobile device
2. Display question
3. Tap button
4. **Verify**: Tap animation
5. **Verify**: Touch target is easy to tap
6. **Verify**: No accidental taps

---

### 3. Speed-Based Scoring

#### Test 3.1: Fast Answer (1000 points)
1. Create question with 30-second timer
2. Start quiz
3. Answer correctly within 7.5 seconds (first 25%)
4. **Verify**: Earned 1000 points
5. **Verify**: Points displayed immediately

#### Test 3.2: Medium Speed Answer
1. Create question with 30-second timer
2. Answer correctly at 15 seconds (50%)
3. **Verify**: Earned 750 points (approximately)
4. **Verify**: Points between 500-1000

#### Test 3.3: Slow Answer (500 points)
1. Create question with 30-second timer
2. Answer correctly at 29 seconds
3. **Verify**: Earned 500 points (minimum)

#### Test 3.4: Incorrect Answer
1. Create question
2. Answer incorrectly
3. **Verify**: Earned 0 points
4. **Verify**: Zero displayed

#### Test 3.5: Leaderboard Points
1. Complete quiz with multiple questions
2. View leaderboard
3. **Verify**: Shows total points (not just count)
4. **Verify**: Ranking based on points
5. **Verify**: Time-based tie-breaking works

---

### 4. Answer Statistics

#### Test 4.1: Statistics Display
1. Create question with 4 options
2. Have 3+ participants answer
3. Wait for question to end
4. **Verify**: Bar chart appears
5. **Verify**: Shows count for each option
6. **Verify**: Shows percentage for each option

#### Test 4.2: Percentage Calculation
1. View statistics from Test 4.1
2. Add up all percentages
3. **Verify**: Total equals 100% (±0.1%)

#### Test 4.3: Correct Answer Highlight
1. View statistics
2. **Verify**: Correct answer has distinct styling
3. **Verify**: Correct answer is clearly marked

#### Test 4.4: Animation
1. Watch statistics appear
2. **Verify**: Bars animate/grow
3. **Verify**: Animation is smooth
4. **Verify**: Completes within 500ms

---

### 5. Answer Result Reveal

#### Test 5.1: Correct Answer Feedback
1. Answer question correctly
2. **Verify**: "Correct!" message appears
3. **Verify**: Celebration animation plays
4. **Verify**: Points earned displayed
5. **Verify**: Confetti or similar effect

#### Test 5.2: Incorrect Answer Feedback
1. Answer question incorrectly
2. **Verify**: "Incorrect" message appears
3. **Verify**: Shake animation plays
4. **Verify**: 0 points displayed
5. **Verify**: Correct answer shown

#### Test 5.3: Immediate Feedback
1. Submit answer
2. **Verify**: Feedback appears immediately
3. **Verify**: No delay > 1 second

---

### 6. Podium Display

#### Test 6.1: Top 3 Display
1. Complete quiz with 5+ participants
2. End quiz
3. **Verify**: Podium appears
4. **Verify**: Shows top 3 participants
5. **Verify**: Shows names and scores

#### Test 6.2: Podium Positions
1. View podium from Test 6.1
2. **Verify**: 1st place in center (highest)
3. **Verify**: 2nd place on left (medium height)
4. **Verify**: 3rd place on right (lowest height)

#### Test 6.3: Staggered Animation
1. Watch podium appear
2. **Verify**: Participants appear one by one
3. **Verify**: Order: 2nd, 3rd, then 1st
4. **Verify**: Smooth entrance animation

#### Test 6.4: Confetti Effect
1. View podium
2. **Verify**: Confetti or celebration effect
3. **Verify**: Effect is visible but not overwhelming

#### Test 6.5: Fewer Than 3 Participants
1. Complete quiz with 2 participants
2. **Verify**: Podium shows only 2
3. **Verify**: No errors or empty spaces

---

### 7. Question Image Support

#### Test 7.1: Image Upload
1. Create question
2. Click "Upload Image"
3. Select JPEG image (< 5MB)
4. **Verify**: Image preview appears
5. **Verify**: Upload succeeds
6. **Verify**: Image URL returned

#### Test 7.2: Image Formats
1. Upload JPEG image - **Verify**: Works
2. Upload PNG image - **Verify**: Works
3. Upload GIF image - **Verify**: Works
4. Try uploading PDF - **Verify**: Rejected

#### Test 7.3: File Size Limit
1. Try uploading 6MB image
2. **Verify**: Rejected with error message
3. Upload 4MB image
4. **Verify**: Accepted

#### Test 7.4: Image Display
1. Create question with image
2. Display question to participants
3. **Verify**: Image appears above question text
4. **Verify**: Image is clear and readable

#### Test 7.5: Responsive Images
1. View question with image on desktop
2. **Verify**: Image fits well
3. View on mobile
4. **Verify**: Image scales down
5. **Verify**: Aspect ratio maintained
6. **Verify**: No horizontal scrolling

---

### 8. Answer Streak Tracking

#### Test 8.1: Streak Increment
1. Answer question 1 correctly
2. **Verify**: Streak shows 1
3. Answer question 2 correctly
4. **Verify**: Streak shows 2
5. Answer question 3 correctly
6. **Verify**: Streak shows 3

#### Test 8.2: Fire Emoji
1. Achieve 3+ streak
2. **Verify**: Fire emoji appears
3. **Verify**: Special indicator for high streak

#### Test 8.3: Streak Reset
1. Have streak of 3
2. Answer next question incorrectly
3. **Verify**: Streak resets to 0
4. **Verify**: Fire emoji disappears

#### Test 8.4: Streak Animation
1. Get correct answer
2. Watch streak update
3. **Verify**: Smooth animation
4. **Verify**: Number changes clearly

---

### 9. Nickname Generator

#### Test 9.1: Suggestions Display
1. Join event
2. **Verify**: 3 nickname suggestions appear
3. **Verify**: Format is Adjective + Noun
4. **Verify**: Names are family-friendly

#### Test 9.2: Refresh Suggestions
1. Click refresh button
2. **Verify**: New suggestions appear
3. **Verify**: Different from previous
4. Click refresh again
5. **Verify**: Another set of suggestions

#### Test 9.3: Select Suggestion
1. Click on a suggested nickname
2. **Verify**: Name is selected
3. **Verify**: Input field shows selected name
4. Join event
5. **Verify**: Nickname used in quiz

#### Test 9.4: Custom Name
1. Ignore suggestions
2. Type custom name
3. Join event
4. **Verify**: Custom name used

---

### 10. Visual Feedback & Animations

#### Test 10.1: Button Animations
1. Test all button types
2. **Verify**: Hover effects work
3. **Verify**: Click effects work
4. **Verify**: Animations are smooth

#### Test 10.2: Question Transitions
1. Advance through multiple questions
2. **Verify**: Fade out animation
3. **Verify**: Slide in animation
4. **Verify**: Smooth transition

#### Test 10.3: Leaderboard Animations
1. View leaderboard after each question
2. **Verify**: Rank changes animate
3. **Verify**: Smooth position transitions
4. **Verify**: Highlighting for changes

#### Test 10.4: Join Animation
1. Join as new participant
2. **Verify**: Welcome animation
3. **Verify**: Name appears smoothly

#### Test 10.5: Performance
1. Test all animations
2. **Verify**: All complete within 500ms
3. **Verify**: No lag or stuttering
4. **Verify**: Smooth on mobile

---

## Mobile Responsiveness Testing

### Device Testing Matrix

| Feature | iPhone | Android | iPad | Tablet |
|---------|--------|---------|------|--------|
| Game PIN Input | ☐ | ☐ | ☐ | ☐ |
| Colorful Buttons | ☐ | ☐ | ☐ | ☐ |
| Answer Statistics | ☐ | ☐ | ☐ | ☐ |
| Podium Display | ☐ | ☐ | ☐ | ☐ |
| Question Images | ☐ | ☐ | ☐ | ☐ |
| Streak Indicator | ☐ | ☐ | ☐ | ☐ |
| Nickname Generator | ☐ | ☐ | ☐ | ☐ |
| Animations | ☐ | ☐ | ☐ | ☐ |

### Viewport Testing

Test at these widths:
- [ ] 320px (small phone)
- [ ] 375px (iPhone)
- [ ] 414px (large phone)
- [ ] 768px (tablet portrait)
- [ ] 1024px (tablet landscape)

### Mobile-Specific Checks

For each viewport:
- [ ] No horizontal scrolling
- [ ] Text is readable without zooming
- [ ] Touch targets are at least 44px
- [ ] Buttons are easily tappable
- [ ] Images scale properly
- [ ] Animations are smooth
- [ ] No layout breaks

---

## Performance Testing

### Load Testing

#### Test with 5 Participants
1. Open 5 browser windows
2. All join same event
3. Complete full quiz
4. **Verify**: No lag
5. **Verify**: Real-time updates work
6. **Verify**: Leaderboard updates quickly

#### Test with 10 Participants
1. Open 10 browser windows
2. All join same event
3. Complete full quiz
4. **Verify**: Performance acceptable
5. **Verify**: No errors in console

#### Test with 20 Participants
1. Open 20 browser windows (use multiple devices)
2. All join same event
3. Complete full quiz
4. **Verify**: System handles load
5. **Verify**: Updates still real-time

### Browser Testing

Test in each browser:
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Edge (desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

For each browser:
- [ ] All features work
- [ ] Animations smooth
- [ ] No console errors
- [ ] WebSocket connects

---

## Monitoring and Debugging

### CloudWatch Logs
```bash
# View ECS logs
aws logs tail /ecs/live-quiz-websocket-server --follow

# Filter for errors
aws logs tail /ecs/live-quiz-websocket-server --follow --filter-pattern "ERROR"
```

### ECS Service Health
```bash
# Check service status
aws ecs describe-services \
  --cluster live-quiz-cluster \
  --services websocket-service

# Check task health
aws ecs list-tasks \
  --cluster live-quiz-cluster \
  --service-name websocket-service
```

### DynamoDB Tables
```bash
# Check GamePins table
aws dynamodb scan --table-name LiveQuizGamePins --max-items 5

# Check Events table
aws dynamodb scan --table-name LiveQuizEvents --max-items 5
```

### S3 Buckets
```bash
# List question images
aws s3 ls s3://live-quiz-question-images-<account-id>/

# Check bucket size
aws s3 ls s3://live-quiz-question-images-<account-id>/ --recursive --summarize
```

---

## Issue Tracking

### Issues Found

| # | Feature | Issue | Severity | Status |
|---|---------|-------|----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### Severity Levels
- **Critical**: Blocks core functionality
- **High**: Major feature broken
- **Medium**: Minor feature issue
- **Low**: Cosmetic or edge case

---

## Sign-off Checklist

- [ ] All Phase 2 features tested
- [ ] Mobile responsiveness verified
- [ ] Performance acceptable
- [ ] No critical issues
- [ ] Documentation updated
- [ ] Ready for production use

**Tested By:** _______________
**Date:** _______________
**Environment:** Production
**Notes:** _______________
