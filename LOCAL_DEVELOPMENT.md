# Local Development Guide

Run the Live Quiz Event app locally without deploying to AWS!

## Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for local DynamoDB)

## Quick Start (One Command!)

```bash
npm run dev
```

This will:
1. Start local DynamoDB in Docker
2. Create all required tables
3. Start the backend server (port 3001)
4. Start the frontend dev server (port 5173)

Then open http://localhost:5173 in your browser! 🎉

## Manual Setup (Step by Step)

If you prefer to run things separately:

### 1. Start Local DynamoDB

```bash
npm run db:start
```

This starts:
- DynamoDB Local on http://localhost:8000
- DynamoDB Admin UI on http://localhost:8001

### 2. Create Tables

```bash
npm run setup:local-db
```

To recreate tables (deletes existing data):
```bash
npm run setup:local-db:recreate
```

### 3. Start Backend

```bash
npm run dev:backend
```

Backend runs on http://localhost:3001

### 4. Start Frontend

In a new terminal:
```bash
npm run dev:frontend
```

Frontend runs on http://localhost:5173

## Viewing Your Data

Open the DynamoDB Admin UI to see your data in real-time:

```bash
npm run db:admin
```

Or visit: http://localhost:8001

## Environment Variables

### Backend (.env.local)
Already configured for local development:
- DynamoDB endpoint: http://localhost:8000
- Port: 3001
- CORS: Allows localhost:5173

### Frontend (.env.local)
Already configured:
- API URL: http://localhost:3001/api
- WebSocket URL: http://localhost:3001

## Testing the App

1. **Create an Event**
   - Open http://localhost:5173
   - Click "Create Event"
   - Fill in event details and add questions
   - Click "Create Event"

2. **Join as Participant**
   - Copy the join link or scan QR code
   - Open in a new browser window/tab
   - Enter your name to join

3. **Start the Quiz**
   - Go back to organizer dashboard
   - Click "Start Event"
   - Advance through questions
   - See real-time participant responses!

## Stopping Services

Stop DynamoDB:
```bash
npm run db:stop
```

Stop backend/frontend: Press `Ctrl+C` in their terminals

## Troubleshooting

### DynamoDB Connection Error

Make sure Docker is running:
```bash
docker ps
```

You should see `live-quiz-dynamodb` container running.

Restart DynamoDB:
```bash
npm run db:stop
npm run db:start
```

### Backend Won't Start

Check if port 3001 is already in use:
```bash
lsof -i :3001
```

Kill the process or change the port in `backend/.env.local`

### Frontend Won't Start

Check if port 5173 is already in use:
```bash
lsof -i :5173
```

### Tables Not Created

Manually create tables:
```bash
npm run setup:local-db:recreate
```

Check DynamoDB Admin UI to verify: http://localhost:8001

### WebSocket Connection Failed

1. Make sure backend is running on port 3001
2. Check browser console for errors
3. Verify CORS settings in backend
4. Try refreshing the page

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- Frontend: Vite automatically reloads on file changes
- Backend: tsx watch restarts on file changes

### Debugging

**Backend:**
Add breakpoints in VS Code and use the debugger, or add console.logs:
```typescript
console.log('Debug:', someVariable);
```

**Frontend:**
Use browser DevTools:
- Console for logs
- Network tab for API calls
- Application tab for WebSocket connections

### Viewing Logs

Backend logs appear in the terminal where you ran `npm run dev:backend`

Frontend logs appear in the browser console (F12)

### Database Inspection

Use DynamoDB Admin UI (http://localhost:8001) to:
- View all tables
- Browse items
- Query data
- Delete items
- See table structure

### Testing WebSocket

Open multiple browser windows to simulate multiple participants:
1. Create event in window 1 (organizer)
2. Join event in windows 2, 3, 4 (participants)
3. Start quiz in window 1
4. Answer questions in participant windows
5. See real-time updates in all windows!

## Project Structure

```
.
├── backend/              # Node.js + Express + Socket.io
│   ├── src/
│   │   ├── index.ts     # Entry point
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── db/          # Database repositories
│   └── .env.local       # Local config
│
├── frontend/            # React + Vite
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   └── contexts/    # React contexts
│   └── .env.local       # Local config
│
├── docker-compose.yml   # Local DynamoDB setup
└── scripts/
    └── setup-local-db.ts # Table creation script
```

## Common Development Tasks

### Add a New API Endpoint

1. Create route in `backend/src/routes/`
2. Add business logic in `backend/src/services/`
3. Update types in `backend/src/types/`
4. Test with curl or Postman

### Add a New Page

1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add navigation link if needed

### Modify Database Schema

1. Update table definition in `scripts/setup-local-db.ts`
2. Recreate tables: `npm run setup:local-db:recreate`
3. Update repository in `backend/src/db/repositories/`
4. Update types

### Add WebSocket Event

1. Add event type in `backend/src/types/websocket.ts`
2. Add handler in `backend/src/services/websocketService.ts`
3. Add listener in `frontend/src/contexts/WebSocketContext.tsx`
4. Use in components

## Performance Tips

- Keep DynamoDB running between sessions (no need to stop/start)
- Use `npm run dev` for the fastest startup
- Close unused browser tabs to save memory
- Use React DevTools for component debugging

## Data Persistence

**Important**: DynamoDB Local runs in-memory by default. Data is lost when you stop the container.

To persist data between restarts, modify `docker-compose.yml`:
```yaml
command: "-jar DynamoDBLocal.jar -sharedDb -dbPath /data"
volumes:
  - ./dynamodb-data:/data
```

## Next Steps

Once you're happy with local development:

1. Review the deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Deploy to AWS: [infrastructure/QUICKSTART.md](./infrastructure/QUICKSTART.md)
3. Set up CI/CD for automated deployments

## Need Help?

- Check browser console for frontend errors
- Check terminal for backend errors
- View DynamoDB Admin UI for data issues
- Review the design document: `.kiro/specs/live-quiz-event/design.md`

Happy coding! 🚀
