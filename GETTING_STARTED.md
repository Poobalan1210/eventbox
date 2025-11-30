# Getting Started - Live Quiz Event

## 🚀 Run the App Locally in 3 Steps

### Step 1: Start Docker Desktop

Make sure Docker Desktop is running on your Mac.

**How to check:**
- Look for the whale icon 🐳 in your menu bar
- If you don't see it, open Docker Desktop from Applications

### Step 2: Install and Start

Open your terminal in the project directory and run:

```bash
npm install
npm run dev
```

Wait for everything to start (about 10-15 seconds)...

### Step 3: Open Your Browser

Go to: **http://localhost:5173**

That's it! 🎉

---

## 📖 What You'll See

### Home Page
- Two options: "Create Event" (for organizers) or "Join Event" (for participants)

### Create an Event (Organizer)
1. Click "Create Event"
2. Enter event name
3. Add questions:
   - Question text
   - 4 multiple choice options
   - Mark the correct answer
   - Set timer (seconds)
4. Click "Create Event"
5. You'll get a join link and QR code to share!

### Join an Event (Participant)
1. Click "Join Event" or use the join link
2. Enter your name
3. Wait for the organizer to start
4. Answer questions as they appear
5. See your score on the leaderboard!

### Run the Quiz (Organizer)
1. From your dashboard, click "Start Event"
2. Click "Next Question" to advance
3. See real-time participant responses
4. View leaderboard after each question
5. Click "End Event" when done

---

## 🧪 Testing with Multiple Participants

Want to see the real-time features in action?

1. **Create an event** in your main browser window
2. **Copy the join link**
3. **Open 2-3 new browser windows** (or incognito windows)
4. **Paste the join link** in each window
5. **Enter different names** for each participant
6. **Go back to the organizer window** and start the event
7. **Answer questions** in the participant windows
8. **Watch the real-time updates!** ⚡

You'll see:
- Participants joining in real-time
- Answers appearing as they're submitted
- Leaderboard updating instantly
- Question transitions synchronized across all windows

---

## 🛠️ Useful Tools

### View Your Database
Open http://localhost:8001 to see all your data in real-time:
- Events
- Questions
- Participants
- Answers

### Stop Everything
Press `Ctrl+C` in the terminal where you ran `npm run dev`

To stop the database:
```bash
npm run db:stop
```

### Start Fresh
To delete all data and start over:
```bash
npm run setup:local-db:recreate
```

---

## 🎯 Quick Tips

- **Multiple tabs**: Open the app in multiple browser tabs to simulate multiple users
- **Incognito mode**: Use incognito windows to test with different participants
- **Real-time**: All updates happen instantly via WebSocket - no page refresh needed!
- **Mobile**: The app is mobile-responsive - try it on your phone!

---

## 📱 Test on Your Phone

1. Find your computer's local IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `backend/.env.local` to allow your IP:
   ```
   CORS_ORIGIN=http://localhost:5173,http://YOUR_IP:5173
   ```

3. Update `frontend/.env.local`:
   ```
   VITE_API_URL=http://YOUR_IP:3001/api
   VITE_WEBSOCKET_URL=http://YOUR_IP:3001
   ```

4. Restart the servers

5. Open `http://YOUR_IP:5173` on your phone

---

## ❓ Troubleshooting

### "Docker is not running"
- Open Docker Desktop from Applications
- Wait for it to fully start (whale icon in menu bar)
- Try again

### "Port 3001 already in use"
- Something else is using that port
- Change the port in `backend/.env.local`
- Or find and kill the process: `lsof -i :3001`

### "Cannot connect to backend"
- Make sure backend is running (check terminal output)
- Try refreshing the page
- Check http://localhost:3001/health

### "Tables not found"
- Run: `npm run setup:local-db:recreate`
- Check http://localhost:8001 to verify tables exist

---

## 🎓 Next Steps

Once you're comfortable with local development:

1. **Read the full guide**: [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)
2. **Deploy to AWS**: [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Customize the app**: Modify components in `frontend/src/`
4. **Add features**: Check the design doc in `.kiro/specs/live-quiz-event/`

---

## 🆘 Need Help?

- Check [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed troubleshooting
- Look at browser console (F12) for frontend errors
- Check terminal output for backend errors
- View database at http://localhost:8001

Happy quizzing! 🎉
