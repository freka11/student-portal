import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

interface SessionUser {
  uid: string
  email: string
  name: string
  role: 'student' | 'admin' | 'teacher' | 'super_admin'
  publicId?: string
  permissions: string[]
}

// Simple validation for demo purposes (in production, use proper Firebase Admin SDK)
async function validateToken(token: string) {
  try {
    // For demo: decode JWT without verification (NOT SECURE FOR PRODUCTION)
    const decoded = jwt.decode(token) as any
    
    if (!decoded || !decoded.email) {
      return null
    }
    
    const resolvedUid: string | undefined =
      decoded?.user_id || decoded?.uid || decoded?.sub

    if (!resolvedUid) {
      return null
    }

    // Determine role based on email domain
    let role = 'student'
    if (decoded.email.includes('@admin.com')) {
      role = 'admin'
      // PROMOTE SPECIFIC USERS TO SUPER ADMIN
      if (decoded.email.includes('teacher1@admin.com') || decoded.email.includes('teacher2@admin.com')) {
        role = 'super_admin'
      }
    } else if (decoded.email.includes('@student.com')) {
      role = 'student'
    }
    
    let publicId: string | undefined
    
    // Try to get user data from Firestore including publicId
    try {
      const userSnap = await adminFirestore.collection('users').doc(resolvedUid).get()
      const userData = userSnap.exists ? userSnap.data() : null
      
      if (userData) {
        // Use role from Firestore if available
        if (userData.role) {
          role = userData.role
        }
        // Get publicId if available
        if (userData.publicId) {
          publicId = userData.publicId
        }
      }
    } catch (firestoreError) {
      console.warn('Could not fetch user data from Firestore:', firestoreError)
      // Continue with default values
    }
    
    return {
      uid: resolvedUid,
      email: decoded.email,
      role: role,
      publicId: publicId,
      name: decoded.name || decoded.email?.split('@')[0],
      permissions: role === 'admin' ? ['read', 'write', 'delete'] : ['read', 'write']
    }
  } catch (error) {
    console.error('Token validation error:', error)
    return null
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]

  try {
    const userData = await validateToken(token)
    
    if (!userData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('✅ Admin session created for:', userData.email, 'Role:', userData.role, 'PublicId:', userData.publicId)

    const sessionData = {
      uid: userData.uid,
      email: userData.email,
      role: userData.role,
      publicId: userData.publicId,
      permissions: userData.permissions
    }

    const cookieStore = await cookies()
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return NextResponse.json({ 
      success: true, 
      user: sessionData 
    })
  } catch (error) {
    console.error('Admin session creation error:', error)
    return NextResponse.json({ error: 'Session creation failed' }, { status: 401 })
  }
}

export async function GET() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin_session')?.value || cookieStore.get('session')?.value

  if (!sessionToken) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  try {
    const userData = await validateToken(sessionToken)
    
    if (!userData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true, 
      user: userData 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Session validation failed' }, { status: 401 })
  }
}
