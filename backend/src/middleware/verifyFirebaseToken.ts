import type { Request, Response, NextFunction } from 'express'
import { verifyToken, resolveUserData } from '../lib/authUtils'

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

export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.header('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null

    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing Authorization token' })
    }

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
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

