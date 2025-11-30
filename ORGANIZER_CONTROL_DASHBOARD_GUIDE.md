# Organizer Control Dashboard Guide

## Overview

The **Organizer Control Dashboard** is a comprehensive real-time control interface for managing Quiz, Poll, and Raffle activities during live events. It provides detailed controls and monitoring capabilities for each activity type.

## Accessing the Dashboard

### Method 1: From Event Activities Page
1. Go to **Organizer Dashboard** → Select your event
2. Click **"Live Control Dashboard"** button in the top-right corner
3. URL: `/events/{eventId}/control`

### Method 2: From Activity Control Panel
1. Navigate to any event's activities page
2. In the Activity Control Panel, click **"Advanced Controls"**

## Dashboard Features

### 📊 Real-Time Stats Bar
- **Participants**: Live count of connected participants
- **Total Activities**: Number of activities in the event
- **Ready**: Activities ready to be activated
- **Completed**: Finished activities

### 🎮 Active Activity Controls

The dashboard shows different controls based on the currently active activity type:

## Quiz Controls

### Primary Actions
- **▶️ Start Quiz**: Begin the quiz session
- **⏭️ Next Question**: Advance to the next question
- **📊 Show Results**: Display answer statistics for current question
- **🏆 Leaderboard**: Show current participant rankings
- **⏹️ End Quiz**: Complete the quiz and show final results

### Quiz Progress Panel
- **Questions**: Shows current question number (e.g., "3 / 10")
- **Scoring**: Indicates if scoring is enabled/disabled
- **Speed Bonus**: Shows if speed bonuses are active
- **Streak Tracking**: Displays streak tracking status

### Quiz Workflow
1. **Start Quiz** → Participants see first question
2. **Next Question** → Move through questions sequentially
3. **Show Results** → Display answer statistics after each question
4. **Show Leaderboard** → Show current standings (if scoring enabled)
5. **End Quiz** → Complete and show final results

## Poll Controls

### Primary Actions
- **▶️ Start Poll**: Begin the poll session
- **📊 Show Results**: Display live voting results
- **⏹️ End Poll**: Complete the poll and show final results

### Poll Details Panel
- **Question**: The poll question text
- **Options**: Number of available answer options
- **Live Results**: Real-time vote counts (if enabled)

### Poll Workflow
1. **Start Poll** → Participants can begin voting
2. **Show Results** → Display current vote distribution
3. **End Poll** → Finalize and show final results

## Raffle Controls

### Primary Actions
- **▶️ Start Raffle**: Begin the raffle entry period
- **🎲 Draw Winners**: Randomly select winners
- **⏹️ End Raffle**: Complete the raffle

### Raffle Details Panel
- **Prize**: Description of the prize
- **Winners**: Number of winners to be selected
- **Entry Method**: How participants can enter
- **Entry Count**: Number of participants entered

### Raffle Workflow
1. **Start Raffle** → Participants can enter
2. **Draw Winners** → Randomly select winners with animation
3. **End Raffle** → Complete and show final results

## Activity Status Indicators

### Status Colors
- 🟢 **Active**: Currently running activity
- 🔵 **Ready**: Configured and ready to activate
- 🟡 **Draft**: Still being configured
- 🟣 **Completed**: Finished activity

## Real-Time Features

### Live Updates
- **Participant Count**: Updates every 5 seconds
- **Activity Status**: Real-time status changes
- **WebSocket Integration**: Instant updates across all connected devices

### Responsive Design
- **Desktop**: Full control panel with all features
- **Tablet**: Optimized layout for touch controls
- **Mobile**: Essential controls with simplified interface

## Navigation

### Quick Actions
- **← Back to Activities**: Return to event activities page
- **🔴 Live Indicator**: Shows dashboard is connected and active

### Breadcrumb Navigation
```
Dashboard → Event → Activities → Live Control Dashboard
```

## Best Practices

### Quiz Management
1. **Pre-Quiz**: Review questions and settings
2. **During Quiz**: Use "Show Results" after each question for engagement
3. **Post-Quiz**: Show leaderboard and final results

### Poll Management
1. **Clear Question**: Ensure poll question is clear and concise
2. **Live Results**: Show results in real-time for engagement
3. **Discussion**: Use results as conversation starters

### Raffle Management
1. **Entry Period**: Give participants time to enter
2. **Build Suspense**: Use the drawing animation effectively
3. **Winner Announcement**: Clearly announce and celebrate winners

## Troubleshooting

### Common Issues
- **No Active Activity**: Activate an activity from the activities list first
- **Participants Not Seeing Updates**: Check WebSocket connection status
- **Controls Not Responding**: Refresh the page and check network connection

### Connection Status
- **🟢 Live**: Dashboard is connected and active
- **🟡 Connecting**: Attempting to establish connection
- **🔴 Disconnected**: Connection lost, refresh page

## Technical Details

### API Endpoints Used
- `GET /events/{eventId}/activities` - Fetch activities
- `POST /activities/{activityId}/activate` - Activate activity
- `POST /activities/{activityId}/start-quiz` - Start quiz
- `POST /activities/{activityId}/next-question` - Next question
- `POST /activities/{activityId}/start-poll` - Start poll
- `POST /activities/{activityId}/start-raffle` - Start raffle
- `POST /activities/{activityId}/draw-winners` - Draw raffle winners

### WebSocket Events
- Real-time participant updates
- Activity status changes
- Live result updates
- Winner announcements

## Security

### Access Control
- **Organizer ID**: Required for all API calls
- **Event Ownership**: Only event organizers can access controls
- **Session Management**: Secure session handling

The Organizer Control Dashboard provides a powerful, intuitive interface for managing live interactive activities, ensuring smooth and engaging experiences for both organizers and participants.