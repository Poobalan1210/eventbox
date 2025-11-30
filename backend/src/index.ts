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
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
})

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
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

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`WebSocket server ready for connections`)
})
