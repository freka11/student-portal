import express from 'express'
import cors from 'cors'
import { createAuthRouter } from './routes/auth.routes'
import { createAdminRouter } from './routes/admin.routes'
import { createStudentRouter } from './routes/student.routes'
import { errorHandler } from './middleware/errorHandler'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
    })
  )

  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', createAuthRouter())
  app.use('/api/admin', createAdminRouter())
  app.use('/api/student', createStudentRouter())

  app.use(errorHandler)

  return app
}

export function startServer(port = Number(process.env.PORT) || 4000) {
  const app = createApp()
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`)
  })
}

if (require.main === module) {
  startServer()
}

