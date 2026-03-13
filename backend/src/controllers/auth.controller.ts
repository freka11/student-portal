import { Request, Response } from 'express'
import { adminAuth, adminFirestore } from '../config/firebaseAdmin'

// ─── Admin Login ───────────────────────────────────────────────────
export async function postAdminLogin(req: Request, res: Response) {
    try {
        const { username, password } = req.body

        const email = username.includes('@') ? username : `${username}@admin.com`
        console.log('🔑 Admin login attempt:', { username, email })

        res.json({
            email,
            message: 'Use Firebase client-side authentication',
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}

// ─── User (Student) Login ──────────────────────────────────────────
export async function postUserLogin(req: Request, res: Response) {
    try {
        const { username, password } = req.body

        const email = username.includes('@') ? username : `${username}@student.com`
        console.log('🔑 Student login attempt:', { username, email })

        res.json({
            email,
            message: 'Use Firebase client-side authentication',
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}

// ─── POST /api/auth/session ────────────────────────────────────────
export async function postSession(req: Request, res: Response) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = await adminAuth.verifyIdToken(token)
        const email = (decoded as any).email
        if (!email) {
            res.status(401).json({ error: 'Invalid token' })
            return
        }

        let role: string = inferRoleFromEmail(email)
        let publicId: string | undefined

        try {
            const userDoc = await adminFirestore.collection('users').doc(decoded.uid).get()
            const userData = userDoc.exists ? (userDoc.data() as any) : null
            if (userData?.role) role = userData.role
            if (userData?.publicId) publicId = userData.publicId
        } catch {
            // Fall back to email-derived role
        }

        const sessionData = {
            uid: decoded.uid,
            email,
            role,
            publicId,
            permissions: ['admin', 'super_admin'].includes(role) ? ['read', 'write', 'delete'] : ['read', 'write'],
        }

        console.log('✅ Session created for:', email, 'Role:', role, 'PublicId:', publicId)

        res.json({ success: true, user: sessionData })
    } catch (error) {
        console.error('Session creation error:', error)
        res.status(401).json({ error: 'Session creation failed' })
    }
}

// ─── GET /api/auth/session ─────────────────────────────────────────
export async function getSession(req: Request, res: Response) {
    // With the unified backend, session validation uses the Bearer token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No session' })
        return
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = await adminAuth.verifyIdToken(token)
        const email = (decoded as any).email
        if (!email) {
            res.status(401).json({ error: 'Invalid session' })
            return
        }

        let role: string = inferRoleFromEmail(email)
        let publicId: string | undefined
        let name: string = (decoded as any).name || email.split('@')[0]

        try {
            const userDoc = await adminFirestore.collection('users').doc(decoded.uid).get()
            const userData = userDoc.exists ? (userDoc.data() as any) : null
            if (userData?.role) role = userData.role
            if (userData?.publicId) publicId = userData.publicId
            if (typeof userData?.name === 'string' && userData.name.trim()) name = userData.name
        } catch {
            // Fall back
        }

        res.json({
            success: true,
            user: {
                uid: decoded.uid,
                email,
                name,
                role,
                publicId,
                permissions: ['admin', 'super_admin'].includes(role) ? ['read', 'write', 'delete'] : ['read', 'write'],
            },
        })
    } catch (error) {
        res.status(401).json({ error: 'Session validation failed' })
    }
}

// ─── POST /api/auth/verify ───────────────────────────────────────────
export async function verifyToken(req: Request, res: Response) {
    try {
        const { token } = req.body
        
        if (!token) {
            return res.status(400).json({ error: 'Token is required' })
        }

        let decoded
        try {
            decoded = await adminAuth.verifyIdToken(token)
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            
            // Try session cookie verification
            if (msg.includes('incorrect "iss"') || msg.includes('session.firebase.google.com')) {
                decoded = await adminAuth.verifySessionCookie(token, true)
            } else {
                throw err
            }
        }

        const email = (decoded as any).email
        if (!email) {
            return res.status(401).json({ error: 'Invalid token' })
        }

        let role: string = inferRoleFromEmail(email)
        let publicId: string | undefined
        let name: string = (decoded as any).name || email.split('@')[0]

        try {
            const userDoc = await adminFirestore.collection('users').doc(decoded.uid).get()
            const userData = userDoc.exists ? (userDoc.data() as any) : null
            if (userData?.role) role = userData.role
            if (userData?.publicId) publicId = userData.publicId
            if (typeof userData?.name === 'string' && userData.name.trim()) name = userData.name
        } catch {
            // Fall back to defaults
        }

        res.json({
            uid: decoded.uid,
            email,
            name,
            role,
            publicId,
            userData: { role, publicId, name }
        })
    } catch (error) {
        console.error('Token verification failed:', error)
        res.status(401).json({ error: 'Invalid token' })
    }
}

// ─── Helper ────────────────────────────────────────────────────────
function inferRoleFromEmail(email: string): string {
    if (email.includes('@admin.com')) {
        if (email.includes('teacher1@admin.com') || email.includes('teacher2@admin.com')) {
            return 'super_admin'
        }
        return 'admin'
    }
    return 'student'
}
