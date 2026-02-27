import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken'

export function createAuthRouter() {
  const router = Router()

  // POST /api/auth/session - mirrors Next.js auth/session POST
  // Validates Bearer token and returns user (no cookies - backend is cross-origin)
  router.post('/session', verifyFirebaseToken, (req, res) => {
    const user = req.user!
    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        publicId: user.publicId,
        permissions: user.role === 'admin' || user.role === 'super_admin'
          ? ['read', 'write', 'delete']
          : ['read', 'write'],
      },
    })
  })

  // GET /api/auth/session or /api/auth/me - validate token and return user
  router.get('/session', verifyFirebaseToken, (req, res) => {
    const user = req.user!
    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        publicId: user.publicId,
        permissions: user.role === 'admin' || user.role === 'super_admin'
          ? ['read', 'write', 'delete']
          : ['read', 'write'],
      },
    })
  })

  router.get('/me', verifyFirebaseToken, (req, res) => {
    res.json({
      success: true,
      user: req.user ?? null,
    })
  })

  return router
}

