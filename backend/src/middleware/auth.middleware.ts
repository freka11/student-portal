import { Request, Response, NextFunction } from 'express'
import { adminAuth, adminFirestore } from '../config/firebaseAdmin'

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string
                email: string
                name: string
                role: 'student' | 'admin' | 'teacher' | 'super_admin'
                publicId?: string
                permissions: string[]
            }
        }
    }
}

function inferRoleFromEmail(email?: string | null): 'admin' | 'super_admin' | 'student' {
    if (!email) return 'student'
    if (email.includes('@admin.com')) {
        if (email.includes('teacher1@admin.com') || email.includes('teacher2@admin.com')) {
            return 'super_admin'
        }
        return 'admin'
    }
    return 'student'
}

/**
 * Middleware that verifies Firebase ID token from Authorization header.
 * Attaches decoded user info to req.user.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' })
        return
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = await adminAuth.verifyIdToken(token)
        const email = decoded.email || ''
        const uid = decoded.uid

        // Resolve user data from Firestore
        let role: string = inferRoleFromEmail(email)
        let name: string = decoded.name || email.split('@')[0] || 'User'
        let publicId: string | undefined

        try {
            const userDoc = await adminFirestore.collection('users').doc(uid).get()
            const userData = userDoc.exists ? (userDoc.data() as any) : null

            if (userData?.role) {
                role = userData.role
            }
            if (typeof userData?.name === 'string' && userData.name.trim()) {
                name = userData.name
            }
            if (userData?.publicId) {
                publicId = userData.publicId
            }
        } catch {
            // If Firestore read fails, fall back to token/email-derived values
        }

        req.user = {
            uid,
            email,
            name,
            role: role as any,
            publicId,
            permissions: ['admin', 'super_admin'].includes(role)
                ? ['read', 'write', 'delete']
                : ['read', 'write'],
        }

        next()
    } catch (error) {
        console.error('Token verification failed:', error)
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}

/**
 * Optional auth middleware — sets req.user if token present, but doesn't block.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next()
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = await adminAuth.verifyIdToken(token)
        const email = decoded.email || ''
        const uid = decoded.uid

        let role: string = inferRoleFromEmail(email)
        let name: string = decoded.name || email.split('@')[0] || 'User'
        let publicId: string | undefined

        try {
            const userDoc = await adminFirestore.collection('users').doc(uid).get()
            const userData = userDoc.exists ? (userDoc.data() as any) : null
            if (userData?.role) role = userData.role
            if (typeof userData?.name === 'string' && userData.name.trim()) name = userData.name
            if (userData?.publicId) publicId = userData.publicId
        } catch {
            // Ignore
        }

        req.user = {
            uid,
            email,
            name,
            role: role as any,
            publicId,
            permissions: ['admin', 'super_admin'].includes(role)
                ? ['read', 'write', 'delete']
                : ['read', 'write'],
        }
    } catch {
        // Token invalid — proceed without user
    }

    next()
}
