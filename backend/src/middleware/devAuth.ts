import type { Request, Response, NextFunction } from 'express'

export type AuthenticatedUser = {
  uid: string
  email?: string
  name: string
  role: string
  publicId?: string
  claims?: Record<string, unknown>
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

// Development-only authentication bypass
export async function devAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.header('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null

    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing Authorization token' })
    }

    // For development: accept a special test token or try Firebase verification
    if (token === 'dev_test_token_rahul') {
      req.user = {
        uid: 'test-user-rahul-uid',
        email: 'rahul@student.com',
        name: 'rahul',
        role: 'student',
        publicId: 'rahul-123',
        claims: {},
      }
      return next()
    }

    if (token === 'dev_test_token_likhith') {
      req.user = {
        uid: 'test-user-likhith-uid',
        email: 'likhith@student.com',
        name: 'likhith',
        role: 'student',
        publicId: 'likhith-456',
        claims: {},
      }
      return next()
    }

    // Try Firebase verification (may fail due to service account issues)
    try {
      const { verifyToken, resolveUserData } = await import('../lib/authUtils')
      const decoded = await verifyToken(token)
      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid token' })
      }

      const userData = await resolveUserData(decoded.uid, decoded.email)

      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        name: userData?.name ?? decoded.email?.split('@')[0] ?? 'User',
        role: userData?.role ?? 'student',
        publicId: userData?.publicId,
        claims: {},
      }

      return next()
    } catch (firebaseError: any) {
      console.warn('Firebase auth failed, but continuing for development:', firebaseError.message)
      // For development, provide a fallback student user
      req.user = {
        uid: 'dev-fallback-uid',
        email: 'dev@student.com',
        name: 'Development User',
        role: 'student',
        publicId: 'dev-123',
        claims: {},
      }
      return next()
    }
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed' })
  }
}
