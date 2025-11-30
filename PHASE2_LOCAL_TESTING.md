# Phase 2 Local Testing Guide

## 🎉 Application is Running!

Your Live Quiz Event app with all Phase 2 features is now running locally:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **DynamoDB Admin**: http://localhost:8001
- **WebSocket**: ws://localhost:3001

## Quick Test Checklist

### 1. Game PIN System ✨

**Test Steps:**
1. Open http://localhost:3000
2. Click "Create Event"
3. Enter event name: "Phase 2 Test"
4. **Look for the 6-digit Game PIN** displayed prominently
5. Open a new incognito window
6. Click "Join with PIN" (or similar button)
7. Enter the PIN
8. Verify you join the correct event

**What to Verify:**
- ✅ PIN is exactly 6 digits
- ✅ PIN is numeric only
- ✅ PIN lookup works
- ✅ Invalid PIN shows error

---

### 2. Colorful Answer Buttons 🎨

**Test Steps:**
1. Create an event
2. Add a question with 4 answer options
3. Start the quiz
4. Join as a participant

**What to Verify:**
- ✅ Red Triangle (Option 1)
- ✅ Blue Diamond (Option 2)
- ✅ Yellow Circle (Option 3)
- ✅ Green Square (Option 4)
- ✅ Hover animations work
- ✅ Click animations work
- ✅ Shapes are clearly visible

**Try Different Option Counts:**
- 2 options: Red Triangle, Blue Diamond
- 3 options: + Yellow Circle
- 5 options: + Purple Pentagon

---

### 3. Speed-Based Scoring ⚡

**Test Steps:**
1. Create a question with a 30-second timer
2. Start quiz and join as participant
3. Answer correctly within 7.5 seconds (first 25%)
4. Check points earned

**What to Verify:**
- ✅ Fast answer (< 7.5s) = 1000 points
- ✅ Medium answer (15s) = ~750 points
- ✅ Slow answer (29s) = 500 points
- ✅ Incorrect answer = 0 points
- ✅ Points displayed immediately after answer

---

### 4. Answer Statistics 📊

**Test Steps:**
1. Create a question
2. Open 3+ browser windows as participants
3. Have each participant answer differently
4. Wait for question to end

**What to Verify:**
- ✅ Bar chart appears
- ✅ Shows count for each option
- ✅ Shows percentage for each option
- ✅ Percentages add up to 100%
- ✅ Correct answer is highlighted
- ✅ Bars animate/grow

---

### 5. Answer Result Reveal 🎯

**Test Steps:**
1. Answer a question correctly
2. Answer a question incorrectly

**What to Verify:**
- ✅ Immediate feedback after submission
- ✅ "Correct!" message with celebration animation
- ✅ "Incorrect" message with shake animation
- ✅ Points earned displayed
- ✅ Correct answer shown if wrong
- ✅ Confetti effect for correct answers

---

### 6. Podium Display 🏆

**Test Steps:**
1. Create a quiz with 3+ questions
2. Have 3+ participants complete the quiz
3. End the quiz

**What to Verify:**
- ✅ Podium appears after quiz ends
- ✅ 1st place in center (highest)
- ✅ 2nd place on left (medium)
- ✅ 3rd place on right (lowest)
- ✅ Staggered entrance animation
- ✅ Confetti or celebration effect
- ✅ Names and scores displayed

---

### 7. Question Images 🖼️

**Test Steps:**
1. Create a question
2. Click "Upload Image"
3. Select a JPEG/PNG image (< 5MB)
4. Save question
5. Display question to participants

**What to Verify:**
- ✅ Image preview appears after upload
- ✅ Image displays above question text
- ✅ Image is responsive (scales on mobile)
- ✅ Aspect ratio maintained
- ✅ JPEG, PNG, GIF formats work
- ✅ Files > 5MB are rejected

---

### 8. Answer Streak Tracking 🔥

**Test Steps:**
1. Create a quiz with 5+ questions
2. Join as participant
3. Answer 3 questions correctly in a row
4. Answer 1 incorrectly
5. Answer 2 more correctly

**What to Verify:**
- ✅ Streak increments on correct answer
- ✅ Streak shows current count
- ✅ Fire emoji appears at 3+ streak
- ✅ Streak resets to 0 on incorrect answer
- ✅ Streak animation is smooth

---

### 9. Nickname Generator 🎭

**Test Steps:**
1. Join an event
2. Look for nickname suggestions

**What to Verify:**
- ✅ 3 nickname suggestions appear
- ✅ Format is Adjective + Noun (e.g., "HappyPanda")
- ✅ Refresh button generates new suggestions
- ✅ Can select a suggested nickname
- ✅ Can enter custom name
- ✅ Nicknames are family-friendly

---

### 10. Visual Animations ✨

**Test Steps:**
1. Test all interactive elements
2. Watch transitions between questions
3. Observe leaderboard updates

**What to Verify:**
- ✅ Button hover effects
- ✅ Button click effects
- ✅ Question fade out/slide in
- ✅ Leaderboard rank changes animate
- ✅ Participant join animation
- ✅ All animations < 500ms
- ✅ Smooth performance

---

## Multi-User Testing

To test real-time features with multiple participants:

1. **Open Multiple Windows:**
   - Window 1: Organizer (create event)
   - Window 2-4: Participants (join event)
   - Use incognito windows or different browsers

2. **Test Real-Time Updates:**
   - Participants join → Organizer sees list update
   - Organizer starts quiz → Participants see quiz start
   - Participants answer → Organizer sees responses
   - Question ends → All see statistics
   - Leaderboard updates → All see new rankings

3. **Test WebSocket Stability:**
   - Keep all windows open for 10+ minutes
   - Verify no disconnections
   - Check browser console for errors

---

## Mobile Testing

### Using Browser DevTools:
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device: iPhone 12 Pro, Pixel 5, etc.
4. Test all features

### Viewport Sizes to Test:
- 320px (small phone)
- 375px (iPhone)
- 414px (large phone)
- 768px (tablet)

### What to Check:
- ✅ No horizontal scrolling
- ✅ Text is readable
- ✅ Buttons are tappable (44px min)
- ✅ Colorful buttons work well
- ✅ Images scale properly
- ✅ Animations are smooth

---

## Debugging Tips

### Backend Issues:
```bash
# View backend logs
# Check the terminal where backend is running

# Check DynamoDB tables
open http://localhost:8001

# Test API directly
curl http://localhost:3001/api/events
```

### Frontend Issues:
```bash
# Open browser console (F12)
# Check for errors in Console tab
# Check Network tab for failed requests
# Check Application tab for WebSocket connection
```

### WebSocket Issues:
```bash
# In browser console:
# Look for WebSocket connection status
# Should see: "WebSocket connected" or similar

# Check backend logs for WebSocket events
```

### Database Issues:
```bash
# Open DynamoDB Admin
open http://localhost:8001

# Check tables exist:
# - Events
# - GamePins (new!)
# - Questions
# - Participants
# - Answers

# View table contents
# Click on table name to see items
```

---

## Performance Testing

### Test with Multiple Participants:
1. Open 5 browser windows
2. All join same event
3. Complete full quiz
4. Monitor performance

**What to Check:**
- ✅ No lag in UI
- ✅ Real-time updates work
- ✅ Leaderboard updates quickly
- ✅ No console errors
- ✅ Animations stay smooth

---

## Known Local Limitations

1. **Image Storage**: Images stored in memory (not S3)
2. **Data Persistence**: DynamoDB data lost on container restart
3. **No CDN**: Images served directly (no CloudFront)
4. **Single Server**: No load balancing

These are expected in local development and work correctly in AWS deployment.

---

## Stopping the Application

```bash
# Stop backend: Ctrl+C in backend terminal
# Stop frontend: Ctrl+C in frontend terminal

# Stop DynamoDB
npm run db:stop
```

---

## Quick Commands

```bash
# Start everything
npm run dev

# Just start DynamoDB
npm run db:start

# View DynamoDB Admin
npm run db:admin

# Recreate tables (fresh start)
npx tsx scripts/setup-local-db.ts --recreate

# Check running containers
docker ps
```

---

## Success Criteria

Before considering Phase 2 complete, verify:

- [ ] All 10 Phase 2 features work
- [ ] Game PIN system functional
- [ ] Colorful buttons display correctly
- [ ] Speed-based scoring calculates properly
- [ ] Statistics chart displays
- [ ] Answer reveal works
- [ ] Podium displays for top 3
- [ ] Images upload and display
- [ ] Streak tracking works
- [ ] Nickname generator works
- [ ] All animations smooth
- [ ] Multi-user testing successful
- [ ] Mobile responsive
- [ ] No console errors

---

## Next Steps

Once local testing is complete:

1. ✅ All Phase 2 features verified locally
2. ⏳ Deploy to AWS (see TASK_35_FINAL_REPORT.md)
3. ⏳ Test on AWS deployment
4. ⏳ Verify mobile on real devices
5. ⏳ Performance test with 20+ users

---

## Need Help?

- **Backend not starting**: Check port 3001 is free
- **Frontend not starting**: Check port 3000 is free
- **DynamoDB errors**: Restart Docker
- **WebSocket issues**: Check backend logs
- **Feature not working**: Check browser console

**Documentation:**
- Design: `.kiro/specs/live-quiz-event/design.md`
- Requirements: `.kiro/specs/live-quiz-event/requirements.md`
- Troubleshooting: `TROUBLESHOOTING.md`

---

**Happy Testing! 🎉**

All Phase 2 Kahoot-style features are ready to test locally!
