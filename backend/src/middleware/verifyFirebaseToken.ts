import type { Request, Response, NextFunction } from 'express'
import { getAuth } from '../config/firebase'

export type AuthenticatedUser = {
  uid: string
  email?: string
  role?: string
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

export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.header('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null

    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing Authorization token' })
    }

    const decoded = await getAuth().verifyIdToken(token)
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: (decoded as any)?.role || (decoded as any)?.customClaims?.role,
      claims: decoded as any,
    }

    return next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

