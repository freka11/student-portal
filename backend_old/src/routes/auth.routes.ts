import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken'

export function createAuthRouter() {
  const router = Router()

  // For Firebase-based auth, most apps sign-in on client and send ID token.
  // This endpoint can be used by frontends to validate token and fetch role/claims.
  router.get('/me', verifyFirebaseToken, (req, res) => {
    res.json({
      success: true,
      user: req.user ?? null,
    })
  })

  return router
}

