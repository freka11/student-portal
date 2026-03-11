import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken'
import { getFirestore } from '../config/firebase'

export function createUserRouter() {
  const router = Router()
  const db = getFirestore()

  // GET /api/users - get current user info
  router.get('/', verifyFirebaseToken, (req, res) => {
    const user = req.user!
    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        publicId: user.publicId,
      },
    })
  })

  // POST /api/users/login - user login (mirrors Next.js API)
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body

      // For development: accept test credentials
      if (username === 'rahul' && password === 'rahul123') {
        const userData = {
          uid: 'test-user-rahul-uid',
          email: 'rahul@student.com',
          name: 'rahul',
          role: 'student',
          publicId: 'rahul-123',
        }
        return res.json({
          success: true,
          user: userData,
        })
      }

      if (username === 'likhith' && password === 'likhith123') {
        const userData = {
          uid: 'test-user-likhith-uid',
          email: 'likhith@student.com',
          name: 'likhith',
          role: 'student',
          publicId: 'likhith-456',
        }
        return res.json({
          success: true,
          user: userData,
        })
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    } catch (error) {
      console.error('Login error:', error)
      return res.status(500).json({
        success: false,
        message: 'Login failed',
      })
    }
  })

  return router
}
