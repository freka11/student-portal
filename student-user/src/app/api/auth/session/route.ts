import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = await adminAuth.verifyIdToken(token)

    // Check role from custom claims
    const userRole = decoded.role || decoded.customClaims?.role
    
    // Verify user has valid role
    if (!userRole || !['admin', 'student'].includes(userRole)) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 401 })
    }

    // Include role in session data
    const sessionData = {
      uid: decoded.uid,
      email: decoded.email,
      role: userRole,
      permissions: decoded.permissions || decoded.customClaims?.permissions || []
    }

    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: true,
      path: '/',
    })

    return NextResponse.json({ 
      success: true, 
      user: sessionData 
    })
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
