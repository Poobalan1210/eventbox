import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import eventRoutes, { setIoInstance as setEventRoutesIo } from './routes/events.js'
import activityRoutes, { setIoInstance as setActivityRoutesIo } from './routes/activities.js'
import { errorHandler } from './middleware/errorHandler.js'
import { WebSocketService } from './services/websocketService.js'
import { ClientToServerEvents, ServerToClientEvents } from './types/websocket.js'

const app = express()
const httpServer = createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
})

// Allow all origins in production for now (should be restricted to CloudFront URL in production)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:5173', 'http://localhost:3000'],
}))
app.use(express.json())

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Pass io instance to routes
setEventRoutesIo(io)
setActivityRoutesIo(io)

// API routes
app.use('/api', eventRoutes)
app.use('/api', activityRoutes)

// Error handling middleware (must be last)
app.use(errorHandler)

// Initialize WebSocket service
const wsService = new WebSocketService()
wsService.initializeHandlers(io)

const PORT = process.env.PORT || 3001

// Log environment info
console.log('Starting server...')
console.log('Environment:', process.env.NODE_ENV)
console.log('Port:', PORT)
console.log('AWS Region:', process.env.AWS_REGION)

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
  console.log(`✅ WebSocket server ready for connections`)
  console.log(`✅ Health check available at http://localhost:${PORT}/health`)
})

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
