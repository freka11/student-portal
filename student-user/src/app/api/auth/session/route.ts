import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin'

function roleFromEmail(email: string): 'student' | 'admin' {
  if (email.includes('@admin.com')) return 'admin'
  return 'student'
}

async function verifyAndBuildSessionUser(token: string) {
  const decoded = await adminAuth.verifyIdToken(token)
  const email = (decoded as any).email
  if (!email) return null

  let role: 'student' | 'admin' = roleFromEmail(email)

  try {
    const userDoc = await adminFirestore.collection('users').doc(decoded.uid).get()
    const userData = userDoc.exists ? (userDoc.data() as any) : null
    if (userData?.role === 'admin' || userData?.role === 'student') {
      role = userData.role
    }
  } catch {
    // If Firestore read fails, fall back to email domain
  }

  return {
    uid: decoded.uid,
    email,
    role,
    permissions: role === 'admin' ? ['read', 'write', 'delete'] : ['read', 'write'],
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]

  try {
    const userData = await verifyAndBuildSessionUser(token)
    
    if (!userData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('✅ Session created for:', userData.email, 'Role:', userData.role)

    const sessionData = {
      uid: userData.uid,
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions
    }

    const expiresIn = 60 * 60 * 24 * 7 * 1000
    const sessionCookie = await adminAuth.createSessionCookie(token, { expiresIn })

    const cookieStore = await cookies()
    cookieStore.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return NextResponse.json({ 
      success: true, 
      user: sessionData 
    })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Session creation failed' }, { status: 401 })
  }
}

export async function GET() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session')?.value

  if (!sessionToken) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionToken, true)
    const email = (decoded as any).email

    if (!email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    let role: 'student' | 'admin' = roleFromEmail(email)

    try {
      const userDoc = await adminFirestore.collection('users').doc(decoded.uid).get()
      const userData = userDoc.exists ? (userDoc.data() as any) : null
      if (userData?.role === 'admin' || userData?.role === 'student') {
        role = userData.role
      }
    } catch {
      // If Firestore read fails, fall back to email domain
    }

    const userData = {
      uid: decoded.uid,
      email,
      role,
      permissions: role === 'admin' ? ['read', 'write', 'delete'] : ['read', 'write'],
    }
    
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
