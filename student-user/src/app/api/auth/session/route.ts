import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// Simple validation for demo purposes (in production, use proper Firebase Admin SDK)
function validateToken(token: string) {
  try {
    // For demo: decode JWT without verification (NOT SECURE FOR PRODUCTION)
    const decoded = jwt.decode(token) as any
    
    if (!decoded || !decoded.email) {
      return null
    }
    
    // Determine role based on email domain
    let role = 'student'
    if (decoded.email.includes('@admin.com')) {
      role = 'admin'
    } else if (decoded.email.includes('@student.com')) {
      role = 'student'
    }
    
    return {
      uid: decoded.uid || decoded.sub,
      email: decoded.email,
      role: role,
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
    const userData = validateToken(token)
    
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

    const cookieStore = await cookies()
    cookieStore.set('session', token, {
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
    const userData = validateToken(sessionToken)
    
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
