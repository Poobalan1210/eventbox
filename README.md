# Event Activities Platform

A real-time interactive event platform where organizers can create events containing multiple activities (quizzes, polls, and raffles). Participants join events and interact with whichever activity the organizer activates.

## 🚀 New Here? Start Here!

**→ [START_HERE.md](./START_HERE.md)** - Quick setup guide to get running in 3 steps!

## Features

### Core Features
- 🎯 **Multi-Activity Events** - Create events with quizzes, polls, and raffles
- 🎮 **Activity Control** - Organizers control which activity is active
- 👥 **Real-time Participation** - Participants join events and see live updates
- ⚡ **WebSocket Updates** - Instant feedback and synchronization
- 📱 **Mobile-Responsive** - Works seamlessly on all devices
- 🔗 **Easy Joining** - 6-digit game PINs for quick access

### Quiz Activities ✨
- 🎨 **Colorful Answer Buttons** - Geometric shapes (triangle, diamond, circle, square)
- ⚡ **Speed-Based Scoring** - 500-1000 points based on answer speed
- 📊 **Answer Statistics** - Bar charts showing answer distribution
- 🏆 **Podium Display** - Celebratory top 3 visualization
- 🖼️ **Question Images** - Upload and display images in questions
- 🔥 **Answer Streaks** - Track consecutive correct answers
- 📊 **Real-time Leaderboard** - Live score updates

### Poll Activities 📊
- 🗳️ **Interactive Voting** - Single or multiple choice polls
- 📈 **Live Results** - Real-time vote count updates
- 🎯 **Flexible Options** - Configure any number of voting options
- 📊 **Results Visualization** - Clear display of voting outcomes

### Raffle Activities 🎁
- 🎲 **Random Winner Selection** - Fair Fisher-Yates algorithm
- 🎟️ **Entry Management** - Automatic or manual entry methods
- 🏆 **Multiple Winners** - Draw multiple winners at once
- 🎉 **Winner Announcements** - Celebratory winner reveals

### Organizer Experience 🎨
- 📊 **Event Dashboard** - Manage all events in one place
- 🎯 **Activity Management** - Create, configure, and control activities
- 🔄 **Seamless Switching** - Switch between activities without participants leaving
- 🔒 **Privacy Controls** - Private events with join codes
- 📈 **Real-Time Monitoring** - See participant counts and activity status

## Quick Start - Local Development

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for local DynamoDB)

### Run Locally

1. **Start Docker Desktop** (make sure it's running)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start everything with one command:**
   ```bash
   npm run dev
   ```

   This will:
   - Start local DynamoDB in Docker
   - Create all required database tables
   - Start the backend server (port 3001)
   - Start the frontend dev server (port 5173)

4. **Open your browser:**
   ```
   http://localhost:5173
   ```

5. **View your database (optional):**
   ```
   http://localhost:8001
   ```

That's it! You're ready to create your first quiz event! 🎉

### Manual Setup (Alternative)

If you prefer to run services separately:

```bash
# 1. Start DynamoDB
npm run db:start

# 2. Create tables
npm run setup:local-db

# 3. Start backend (in one terminal)
npm run dev:backend

# 4. Start frontend (in another terminal)
npm run dev:frontend
```

## Project Structure

```
.
├── frontend/              # React + Vite frontend
├── backend/               # Node.js + Express + Socket.io backend
├── infrastructure/        # AWS CDK infrastructure code
├── docker-compose.yml     # Local DynamoDB setup
└── scripts/               # Utility scripts
```

## Documentation

### 📚 API Documentation
- **[Documentation Index](./API_DOCUMENTATION_INDEX.md)** - 📖 Start here! Complete documentation guide
- **[API Documentation](./API_DOCUMENTATION.md)** - Complete REST API reference
- **[API Quick Reference](./API_QUICK_REFERENCE.md)** - Quick lookups and examples
- **[WebSocket Events Reference](./WEBSOCKET_EVENTS_REFERENCE.md)** - Real-time events guide
- **[Migration Guide](./MIGRATION_GUIDE.md)** - Migrate from quiz-centric model

### Getting Started
- **[START_HERE.md](./START_HERE.md)** - Quick 3-step setup guide
- **[Local Development Guide](./LOCAL_DEVELOPMENT.md)** - Detailed local setup and development tips

### Deployment & Testing
- **[Phase 2 Quick Start](./PHASE2_QUICK_START.md)** - 🚀 Deploy Phase 2 in 3 steps!
- **[Phase 2 Deployment Guide](./PHASE2_DEPLOYMENT_GUIDE.md)** - Complete Phase 2 deployment guide
- **[Final Integration Guide](./FINAL_INTEGRATION_GUIDE.md)** - Complete testing and deployment walkthrough
- **[Deployment Verification](./DEPLOYMENT_VERIFICATION.md)** - Comprehensive testing checklist
- **[Deployment Guide](./DEPLOYMENT.md)** - Deploy to AWS overview
- **[Infrastructure Guide](./infrastructure/README.md)** - AWS infrastructure details

### Specification Documents
- **[Design Document](./.kiro/specs/event-activities-platform/design.md)** - System architecture and design
- **[Requirements Document](./.kiro/specs/event-activities-platform/requirements.md)** - Feature requirements
- **[Tasks Document](./.kiro/specs/event-activities-platform/tasks.md)** - Implementation tasks

### Testing Scripts
- `./scripts/deploy-phase2.sh` - 🚀 Deploy all Phase 2 features
- `./scripts/test-phase2-features.sh` - Test Phase 2 features on AWS
- `./scripts/test-local-flow.sh` - Automated local integration tests
- `./scripts/test-aws-deployment.sh` - Automated AWS deployment verification
- `./scripts/migrate-to-activities.ts` - Migrate data to activities model
- `./scripts/verify-migration.ts` - Verify migration success

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Socket.io Client
- React Router
- Tailwind CSS (if configured)

### Backend
- Node.js
- Express
- Socket.io
- TypeScript
- AWS SDK (DynamoDB)

### Infrastructure
- AWS DynamoDB
- AWS ECS Fargate
- AWS S3 + CloudFront
- AWS Application Load Balancer
- AWS CDK (Infrastructure as Code)

## Development Workflow

1. **Create an Event**
   - Open http://localhost:5173
   - Click "Create Event"
   - Enter event name and details
   - Click "Create Event"

2. **Add Activities**
   - Click "Add Activity" in your event
   - Choose activity type (Quiz, Poll, or Raffle)
   - Configure the activity:
     - **Quiz**: Add questions with multiple choice options
     - **Poll**: Set question and voting options
     - **Raffle**: Set prize description and entry method

3. **Join as Participant**
   - Copy the join code (6-digit PIN)
   - Open in a new browser window/tab
   - Enter the join code and your nickname

4. **Run Activities**
   - Activate an activity from the control panel
   - Participants see the activity automatically
   - Switch between activities seamlessly
   - See real-time responses and results!

## Useful Commands

```bash
# Development
npm run dev                    # Start everything (recommended)
npm run dev:frontend           # Start frontend only
npm run dev:backend            # Start backend only

# Database
npm run db:start               # Start local DynamoDB
npm run db:stop                # Stop local DynamoDB
npm run db:admin               # Open DynamoDB Admin UI
npm run setup:local-db         # Create tables
npm run setup:local-db:recreate # Recreate tables (deletes data)

# Building
npm run build:frontend         # Build frontend for production
npm run build:backend          # Build backend for production

# Deployment (AWS)
npm run deploy:infrastructure  # Deploy AWS infrastructure
npm run deploy:backend         # Deploy backend to ECS
npm run deploy:frontend        # Deploy frontend to S3/CloudFront

# Code Quality
npm run lint                   # Lint all workspaces
npm run format                 # Format code with Prettier
```

## Troubleshooting

### Docker not running
Make sure Docker Desktop is running before starting the app.

### Port already in use
- Backend (3001): Change `PORT` in `backend/.env.local`
- Frontend (5173): Vite will automatically try the next available port

### WebSocket connection failed
1. Make sure backend is running on port 3001
2. Check browser console for errors
3. Try refreshing the page

### Tables not created
```bash
npm run setup:local-db:recreate
```

## Deploying to AWS

### Phase 2 Deployment (Recommended)

Deploy all Phase 2 Kahoot-style features:

```bash
# Deploy everything (infrastructure + backend + frontend)
./scripts/deploy-phase2.sh production

# Test deployment
./scripts/test-phase2-features.sh production
```

See **[PHASE2_QUICK_START.md](./PHASE2_QUICK_START.md)** for the 3-step quick start guide!

### Manual Deployment

See the [Deployment Guide](./DEPLOYMENT.md) for detailed instructions on deploying to AWS.

Quick deploy:
```bash
cd infrastructure
npm run deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT

## Support

For detailed documentation:
- Local Development: [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)
- AWS Deployment: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Infrastructure: [infrastructure/README.md](./infrastructure/README.md)

---

Built with ❤️ using React, Node.js, and AWS
