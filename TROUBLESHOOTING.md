# Troubleshooting Guide

## Common Issues and Solutions

### ❌ "Connection error: Retrying..." Message

**Problem**: Frontend can't connect to the backend WebSocket server.

**Solutions**:

1. **Check backend is running**:
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"ok"}`

2. **Verify environment variables**:
   - Frontend `.env.local` should have: `VITE_WEBSOCKET_URL=http://localhost:3001`
   - Backend `.env.local` should have: `PORT=3001`

3. **Check CORS settings**:
   - Backend `src/index.ts` should allow `http://localhost:3000` in CORS origins

4. **Restart services**:
   ```bash
   # Stop all (Ctrl+C in terminal)
   npm run db:stop
   
   # Start again
   npm run dev
   ```

5. **Clear browser cache**:
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or open in incognito mode

### ❌ Port Already in Use

**Problem**: Error like "Port 3001 is already in use"

**Solutions**:

1. **Find what's using the port**:
   ```bash
   lsof -i :3001  # For backend
   lsof -i :3000  # For frontend
   ```

2. **Kill the process**:
   ```bash
   kill -9 <PID>
   ```

3. **Or change the port**:
   - Edit `backend/.env.local` and change `PORT=3001` to another port
   - Update `frontend/.env.local` to match

### ❌ Docker Not Running

**Problem**: "Cannot connect to Docker daemon"

**Solutions**:

1. **Start Docker Desktop**:
   - Open Docker Desktop from Applications
   - Wait for the whale icon 🐳 to appear in menu bar

2. **Verify Docker is running**:
   ```bash
   docker ps
   ```

3. **Restart Docker if needed**:
   - Quit Docker Desktop
   - Reopen it
   - Wait for it to fully start

### ❌ Tables Not Found

**Problem**: Database errors or "Table does not exist"

**Solutions**:

1. **Recreate tables**:
   ```bash
   npm run setup:local-db:recreate
   ```

2. **Check DynamoDB is running**:
   ```bash
   docker ps | grep dynamodb
   ```

3. **Verify tables in Admin UI**:
   - Open http://localhost:8001
   - Should see: Events, Questions, Participants, Answers

### ❌ Frontend Shows Blank Page

**Problem**: Browser shows blank page or loading forever

**Solutions**:

1. **Check browser console** (F12):
   - Look for error messages
   - Check Network tab for failed requests

2. **Verify frontend is running**:
   - Look for "VITE" message in terminal
   - Should show: `Local: http://localhost:3000/`

3. **Clear browser cache**:
   - Hard refresh: `Cmd+Shift+R`
   - Or try incognito mode

4. **Restart frontend**:
   ```bash
   # Stop (Ctrl+C) and restart
   npm run dev:frontend
   ```

### ❌ API Requests Failing

**Problem**: 404 or 500 errors when creating events

**Solutions**:

1. **Check backend logs**:
   - Look at terminal where backend is running
   - Check for error messages

2. **Verify API URL**:
   - Frontend `.env.local`: `VITE_API_URL=http://localhost:3001/api`

3. **Test API directly**:
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3001/api/events
   ```

4. **Check DynamoDB connection**:
   - Backend should connect to `http://localhost:8000`
   - Verify in `backend/.env.local`: `DYNAMODB_ENDPOINT=http://localhost:8000`

### ❌ WebSocket Disconnects Frequently

**Problem**: Connection keeps dropping

**Solutions**:

1. **Check backend logs** for errors

2. **Increase reconnect attempts**:
   - Edit `frontend/src/contexts/WebSocketContext.tsx`
   - Increase `maxReconnectAttempts` value

3. **Check network**:
   - Disable VPN if using one
   - Check firewall settings

4. **Restart everything**:
   ```bash
   npm run db:stop
   npm run dev
   ```

### ❌ Changes Not Appearing

**Problem**: Code changes don't show up

**Solutions**:

1. **For Frontend**:
   - Vite has hot reload - should update automatically
   - If not, hard refresh browser: `Cmd+Shift+R`

2. **For Backend**:
   - tsx watch should restart automatically
   - Check terminal for "Server running on port 3001"
   - If not restarting, stop and start manually

3. **For Environment Variables**:
   - Must restart the service after changing `.env.local`
   - Stop (Ctrl+C) and run `npm run dev` again

### ❌ npm install Fails

**Problem**: Errors during `npm install`

**Solutions**:

1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check Node version**:
   ```bash
   node --version  # Should be 18+
   ```

4. **Update npm**:
   ```bash
   npm install -g npm@latest
   ```

### ❌ TypeScript Errors

**Problem**: Type errors in IDE or during build

**Solutions**:

1. **Restart TypeScript server** (VS Code):
   - Cmd+Shift+P → "TypeScript: Restart TS Server"

2. **Check tsconfig.json** is present in workspace

3. **Reinstall dependencies**:
   ```bash
   npm install
   ```

## Debugging Tips

### Check All Services Status

```bash
# Backend health
curl http://localhost:3001/health

# Frontend (should load HTML)
curl http://localhost:3000

# DynamoDB
curl http://localhost:8000

# Docker containers
docker ps
```

### View Logs

**Backend logs**: Check terminal where `npm run dev:backend` is running

**Frontend logs**: Open browser console (F12)

**Database**: Open http://localhost:8001

### Test WebSocket Connection

Open browser console (F12) and run:
```javascript
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected!'));
socket.on('connect_error', (err) => console.error('Error:', err));
```

### Network Debugging

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "WS" to see WebSocket connections
4. Check for failed requests

## Still Having Issues?

1. **Check the logs**:
   - Backend terminal output
   - Browser console (F12)
   - DynamoDB Admin UI (http://localhost:8001)

2. **Start fresh**:
   ```bash
   # Stop everything
   npm run db:stop
   
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   
   # Start again
   npm run dev
   ```

3. **Check documentation**:
   - [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)
   - [GETTING_STARTED.md](./GETTING_STARTED.md)
   - [APP_IS_RUNNING.md](./APP_IS_RUNNING.md)

4. **Verify prerequisites**:
   - Node.js 18+ installed
   - Docker Desktop running
   - Ports 3000, 3001, 8000, 8001 available

## Quick Reset

If nothing works, try a complete reset:

```bash
# 1. Stop everything
# Press Ctrl+C in all terminals

# 2. Stop Docker
npm run db:stop

# 3. Clean everything
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json

# 4. Reinstall
npm install

# 5. Start fresh
npm run dev
```

This should resolve most issues!
