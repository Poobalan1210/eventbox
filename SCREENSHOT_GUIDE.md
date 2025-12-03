# EventBox Screenshot Guide

This document provides detailed instructions for capturing screenshots to showcase EventBox features in the README.

## 📸 Screenshot Requirements

### General Guidelines
- **Resolution**: 1920x1080 (desktop) or 375x812 (mobile)
- **Format**: PNG with transparency where applicable
- **Quality**: High quality, no compression artifacts
- **Content**: Real data, not lorem ipsum
- **Annotations**: Add arrows/highlights for key features (optional)

### Tools Recommended
- **Desktop**: Chrome DevTools (F12) for responsive testing
- **Screenshots**: macOS Screenshot (Cmd+Shift+4) or Windows Snipping Tool
- **Editing**: Figma, Sketch, or Photoshop for annotations
- **Optimization**: TinyPNG or ImageOptim for file size

---

## 📂 Screenshot List (20 Total)

### Folder Structure
```
screenshots/
├── logo.png
├── architecture-diagram.png
├── organizer/
│   ├── 01-landing-page.png
│   ├── 02-dashboard.png
│   ├── 03-event-activities.png
│   ├── 04-quiz-config.png
│   ├── 05-control-panel.png
│   ├── 06-participant-list.png
│   └── 07-results-view.png
├── participant/
│   ├── 08-join-screen.png
│   ├── 09-waiting-screen.png
│   ├── 10-quiz-question.png
│   ├── 11-poll-voting.png
│   ├── 12-raffle-entry.png
│   └── 13-winner-screen.png
├── mobile/
│   ├── 14-mobile-quiz.png
│   ├── 15-mobile-poll.png
│   └── 16-mobile-raffle.png
└── results/
    ├── 17-quiz-leaderboard.png
    ├── 18-poll-results.png
    └── 19-raffle-winners.png
```

---

## 🎯 Detailed Screenshot Instructions

### 1. Logo (logo.png)
**Purpose**: Brand identity for README header

**How to Capture**:
1. Open the app homepage
2. Zoom in on the EventBox logo
3. Capture just the logo with transparent background
4. Size: 400x100px

**What to Show**:
- EventBox logo
- Clean, professional appearance
- Transparent background

---

### 2. Architecture Diagram (architecture-diagram.png)
**Purpose**: Show system architecture

**How to Create**:
1. Use draw.io, Lucidchart, or similar tool
2. Create diagram showing:
   - CloudFront CDN
   - S3 (Frontend)
   - ALB + ECS (Backend)
   - DynamoDB (Database)
   - WebSocket connections
3. Export as PNG
4. Size: 1200x800px

**What to Show**:
- All major AWS components
- Data flow arrows
- Clear labels
- Professional styling

---

## 👨‍💼 Organizer Experience (7 screenshots)

### 3. Landing Page (01-landing-page.png)
**URL**: `http://localhost:5173/`

**How to Capture**:
1. Open homepage in incognito mode
2. Ensure you're logged out
3. Capture full page
4. Size: 1920x1080

**What to Show**:
- EventBox branding
- "Create Event" button prominently
- Clean, inviting design
- Brief description of platform

**Key Elements**:
- Hero section
- Call-to-action button
- Feature highlights
- Navigation bar

---

### 4. Organizer Dashboard (02-dashboard.png)
**URL**: `http://localhost:5173/dashboard`

**Setup**:
1. Create 3-4 sample events:
   - "Company Town Hall" (active)
   - "Product Training" (completed)
   - "Team Building" (draft)
2. Ensure events have different statuses

**How to Capture**:
1. Navigate to organizer dashboard
2. Capture full page showing event list
3. Size: 1920x1080

**What to Show**:
- List of events with cards
- Event status indicators (active/completed/draft)
- "Create Event" button
- Event details (name, date, participant count)
- Clean grid layout

**Key Elements**:
- Event cards with status badges
- Participant counts
- Quick action buttons
- Search/filter options (if available)

---

### 5. Event Activities Page (03-event-activities.png)
**URL**: `http://localhost:5173/events/{eventId}/activities`

**Setup**:
1. Create an event with multiple activities:
   - 2 quizzes
   - 1 poll
   - 1 raffle
2. Ensure activities have different statuses

**How to Capture**:
1. Navigate to event activities page
2. Show activity list
3. Size: 1920x1080

**What to Show**:
- Activity cards with icons (❓📊🎁)
- Activity types clearly labeled
- Status indicators
- "Add Activity" button
- Edit/Delete options
- Drag-to-reorder handles (if available)

**Key Elements**:
- Activity type icons
- Activity names
- Status badges
- Action buttons
- Clean list layout

---

### 6. Quiz Configuration (04-quiz-config.png)
**URL**: `http://localhost:5173/events/{eventId}/activities/new?type=quiz`

**Setup**:
1. Click "Add Activity" → "Quiz"
2. Fill in sample data:
   - Name: "Product Knowledge Quiz"
   - 3 questions with 4 options each
   - Enable scoring
   - Add a question image

**How to Capture**:
1. Show quiz configuration form
2. Capture with sample question visible
3. Size: 1920x1080

**What to Show**:
- Quiz name field
- Question editor
- Answer options (A, B, C, D)
- Correct answer selection
- Image upload option
- Scoring settings
- Time limit settings

**Key Elements**:
- Form fields
- Question/answer editor
- Settings toggles
- Save button
- Preview option

---

### 7. Activity Control Panel (05-control-panel.png)
**URL**: `http://localhost:5173/events/{eventId}/control`

**Setup**:
1. Start an event
2. Have 5-10 participants joined
3. Have one activity active

**How to Capture**:
1. Navigate to control panel
2. Show live event state
3. Size: 1920x1080

**What to Show**:
- Event name and PIN prominently
- List of activities with status
- Active activity highlighted
- Participant count
- Start/Stop buttons
- Real-time updates indicator

**Key Elements**:
- Activity list with controls
- Participant counter
- Active activity indicator
- Control buttons
- Status indicators

---

### 8. Participant List (06-participant-list.png)
**URL**: `http://localhost:5173/events/{eventId}/control` (participants section)

**Setup**:
1. Have 8-12 participants joined with varied nicknames
2. Show during an active quiz

**How to Capture**:
1. Scroll to participants section
2. Show participant list
3. Size: 1920x1080

**What to Show**:
- List of participant names
- Join timestamps
- Current scores (if quiz active)
- Online status indicators
- Total participant count

**Key Elements**:
- Participant avatars/icons
- Names
- Scores
- Status indicators
- Clean list layout

---

### 9. Results View (07-results-view.png)
**URL**: `http://localhost:5173/events/{eventId}/activities/{activityId}/results`

**Setup**:
1. Complete a quiz with 5+ participants
2. Ensure varied scores

**How to Capture**:
1. Navigate to results page
2. Show leaderboard
3. Size: 1920x1080

**What to Show**:
- Leaderboard with rankings
- Participant names and scores
- Top 3 highlighted (🥇🥈🥉)
- Answer statistics
- Export button

**Key Elements**:
- Leaderboard table
- Medal icons for top 3
- Score distribution
- Statistics cards
- Action buttons

---

## 👥 Participant Experience (6 screenshots)

### 10. Join Screen (08-join-screen.png)
**URL**: `http://localhost:5173/join`

**How to Capture**:
1. Open join page in incognito
2. Show empty state
3. Size: 1920x1080

**What to Show**:
- Large PIN entry field
- QR code option
- "Join Event" button
- Nickname input field
- Clean, simple design

**Key Elements**:
- PIN input (6 digits)
- Nickname field
- Join button
- QR code icon/option
- Instructions text

---

### 11. Waiting Screen (09-waiting-screen.png)
**URL**: Participant view when no activity is active

**Setup**:
1. Join an event as participant
2. Ensure no activity is active

**How to Capture**:
1. Show waiting state
2. Size: 1920x1080

**What to Show**:
- "Waiting for activity" message
- Animated loading indicator
- Event name
- Participant nickname
- Clean, calming design

**Key Elements**:
- Waiting message
- Animation/spinner
- Event info
- Elegant design

---

### 12. Quiz Question (10-quiz-question.png)
**URL**: Participant view during active quiz

**Setup**:
1. Start a quiz as organizer
2. Join as participant
3. Show a question with 4 colorful options

**How to Capture**:
1. Show quiz question screen
2. Capture before answering
3. Size: 1920x1080

**What to Show**:
- Question text clearly visible
- 4 colorful answer buttons:
  - 🔺 Triangle (Red)
  - 💎 Diamond (Blue)
  - ⭕ Circle (Yellow)
  - ⬜ Square (Green)
- Timer (if enabled)
- Question number (e.g., "Question 2 of 5")

**Key Elements**:
- Large, readable question
- Colorful geometric buttons
- Timer countdown
- Progress indicator
- Touch-friendly buttons

---

### 13. Poll Voting (11-poll-voting.png)
**URL**: Participant view during active poll

**Setup**:
1. Start a poll as organizer
2. Join as participant
3. Show poll with 3-4 options

**How to Capture**:
1. Show poll voting screen
2. Capture before voting
3. Size: 1920x1080

**What to Show**:
- Poll question
- Multiple voting options
- Selection indicators
- "Submit Vote" button
- Clean, simple design

**Key Elements**:
- Poll question
- Option buttons
- Selection checkboxes/radio
- Submit button
- Vote count (if live results enabled)

---

### 14. Raffle Entry (12-raffle-entry.png)
**URL**: Participant view during active raffle

**Setup**:
1. Start a raffle as organizer
2. Join as participant
3. Show entry screen

**How to Capture**:
1. Show raffle entry screen
2. Capture before entering
3. Size: 1920x1080

**What to Show**:
- Prize description
- "Enter Raffle" button (if manual)
- Raffle details
- Exciting, colorful design
- Prize emoji/icon

**Key Elements**:
- Prize description
- Entry button
- Raffle icon (🎁)
- Exciting visuals
- Clear instructions

---

### 15. Winner Screen (13-winner-screen.png)
**URL**: Participant view after winning raffle

**Setup**:
1. Complete a raffle
2. Ensure participant won
3. Show winner announcement

**How to Capture**:
1. Show winner celebration screen
2. Size: 1920x1080

**What to Show**:
- "YOU WON!" message
- Confetti animation
- Prize details
- Celebration emojis (🎉🏆🎊)
- Participant name

**Key Elements**:
- Large winner message
- Animated confetti
- Prize info
- Celebration design
- Participant name highlighted

---

## 📱 Mobile Views (3 screenshots)

### 16. Mobile Quiz (14-mobile-quiz.png)
**Device**: iPhone 12 Pro (375x812)

**Setup**:
1. Open Chrome DevTools
2. Select iPhone 12 Pro viewport
3. Join event and start quiz

**How to Capture**:
1. Show quiz question on mobile
2. Size: 375x812

**What to Show**:
- Mobile-optimized layout
- Large touch-friendly buttons
- Readable text
- Proper spacing
- Vertical layout

**Key Elements**:
- Responsive design
- Touch-optimized buttons
- Clear typography
- Proper mobile spacing

---

### 17. Mobile Poll (15-mobile-poll.png)
**Device**: iPhone 12 Pro (375x812)

**Setup**:
1. Use mobile viewport
2. Show poll voting screen

**How to Capture**:
1. Show poll on mobile
2. Size: 375x812

**What to Show**:
- Mobile-optimized poll
- Touch-friendly options
- Submit button
- Responsive layout

**Key Elements**:
- Mobile layout
- Large buttons
- Clear text
- Easy interaction

---

### 18. Mobile Raffle (16-mobile-raffle.png)
**Device**: iPhone 12 Pro (375x812)

**Setup**:
1. Use mobile viewport
2. Show raffle entry screen

**How to Capture**:
1. Show raffle on mobile
2. Size: 375x812

**What to Show**:
- Mobile-optimized raffle
- Prize description
- Entry button
- Responsive design

**Key Elements**:
- Mobile layout
- Large entry button
- Clear prize info
- Touch-friendly

---

## 📊 Results & Analytics (3 screenshots)

### 19. Quiz Leaderboard (17-quiz-leaderboard.png)
**URL**: Results page after quiz completion

**Setup**:
1. Complete quiz with 8+ participants
2. Ensure varied scores

**How to Capture**:
1. Show final leaderboard
2. Size: 1920x1080

**What to Show**:
- Full leaderboard table
- Top 3 with medals (🥇🥈🥉)
- Scores and rankings
- Answer statistics
- Podium visualization

**Key Elements**:
- Leaderboard table
- Medal icons
- Score columns
- Statistics cards
- Podium display

---

### 20. Poll Results (18-poll-results.png)
**URL**: Results page after poll completion

**Setup**:
1. Complete poll with 10+ votes
2. Ensure varied vote distribution

**How to Capture**:
1. Show poll results
2. Size: 1920x1080

**What to Show**:
- Bar chart with percentages
- Vote counts per option
- Total votes
- Visual distribution
- Clear labels

**Key Elements**:
- Bar chart
- Percentages
- Vote counts
- Color coding
- Clear labels

---

### 21. Raffle Winners (19-raffle-winners.png)
**URL**: Results page after raffle completion

**Setup**:
1. Complete raffle with 10+ entries
2. Draw 3 winners

**How to Capture**:
1. Show winner list
2. Size: 1920x1080

**What to Show**:
- Winner list with highlights
- All participants list
- Winner badges/icons
- Entry counts
- Prize details

**Key Elements**:
- Winner highlights
- Participant list
- Winner badges
- Statistics
- Clear layout

---

## 🎨 Screenshot Best Practices

### Before Capturing

1. **Use Realistic Data**
   - Real names (or realistic fake names)
   - Varied scores/votes
   - Proper timestamps
   - Complete information

2. **Clean UI State**
   - No console errors
   - No loading spinners (unless showing loading state)
   - Proper alignment
   - No placeholder text

3. **Consistent Styling**
   - Same theme across all screenshots
   - Consistent colors
   - Proper spacing
   - Professional appearance

### During Capture

1. **Framing**
   - Center important elements
   - Include relevant context
   - Avoid unnecessary whitespace
   - Show full features

2. **Resolution**
   - High DPI (2x for retina)
   - Sharp text
   - Clear images
   - No pixelation

3. **Timing**
   - Capture at right moment
   - Show active states
   - Include animations (if possible)
   - Proper loading states

### After Capture

1. **Optimization**
   - Compress images (TinyPNG)
   - Maintain quality
   - Reasonable file sizes (< 500KB each)
   - PNG format

2. **Annotations** (Optional)
   - Add arrows for key features
   - Highlight important elements
   - Add text labels
   - Use consistent style

3. **Organization**
   - Name files clearly
   - Use folder structure
   - Include in git
   - Update README references

---

## 📝 Screenshot Checklist

Use this checklist to ensure you have all required screenshots:

### Organizer Experience
- [ ] 01-landing-page.png
- [ ] 02-dashboard.png
- [ ] 03-event-activities.png
- [ ] 04-quiz-config.png
- [ ] 05-control-panel.png
- [ ] 06-participant-list.png
- [ ] 07-results-view.png

### Participant Experience
- [ ] 08-join-screen.png
- [ ] 09-waiting-screen.png
- [ ] 10-quiz-question.png
- [ ] 11-poll-voting.png
- [ ] 12-raffle-entry.png
- [ ] 13-winner-screen.png

### Mobile Views
- [ ] 14-mobile-quiz.png
- [ ] 15-mobile-poll.png
- [ ] 16-mobile-raffle.png

### Results & Analytics
- [ ] 17-quiz-leaderboard.png
- [ ] 18-poll-results.png
- [ ] 19-raffle-winners.png

### Additional
- [ ] logo.png
- [ ] architecture-diagram.png

---

## 🚀 Quick Capture Script

Use this workflow to capture all screenshots efficiently:

1. **Setup Phase** (15 minutes)
   - Create sample event
   - Add 3-4 activities
   - Prepare test data

2. **Organizer Screenshots** (20 minutes)
   - Capture dashboard and pages
   - Show configuration screens
   - Get control panel views

3. **Participant Screenshots** (20 minutes)
   - Join as participant
   - Capture each activity type
   - Get winner/results screens

4. **Mobile Screenshots** (15 minutes)
   - Switch to mobile viewport
   - Capture key screens
   - Test responsiveness

5. **Post-Processing** (20 minutes)
   - Optimize images
   - Add annotations
   - Organize files
   - Update README

**Total Time**: ~90 minutes

---

## 💡 Tips for Great Screenshots

1. **Use Real Data**: Avoid "Test User 1", "Test User 2"
2. **Show Activity**: Capture during active states
3. **Highlight Features**: Make key features obvious
4. **Be Consistent**: Same theme/style across all
5. **Test Mobile**: Ensure mobile screenshots look good
6. **Optimize Size**: Keep files under 500KB
7. **Update README**: Link screenshots correctly
8. **Version Control**: Commit screenshots to git

---

## 📞 Questions?

If you need help capturing screenshots or have questions about this guide, please:
- Open an issue on GitHub
- Check existing screenshots for reference
- Review the README for context

Happy screenshotting! 📸
