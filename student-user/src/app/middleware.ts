import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

export async function middleware(req: NextRequest) {
  const session = req.cookies.get('session')

  if (!session && req.nextUrl.pathname.startsWith('/user')) {
    return NextResponse.redirect(new URL('/user/login', req.url))
  }

  // If there's a session, verify it's a student
  if (session && req.nextUrl.pathname.startsWith('/user')) {
    try {
      const decoded = await adminAuth.verifyIdToken(session.value)
      const userRole = decoded.role || decoded.customClaims?.role
      
      // Only allow students to access user routes
      if (userRole !== 'student') {
        return NextResponse.redirect(new URL('/user/login', req.url))
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/user/login', req.url))
    }
  }
}

export const config = {
  matcher: ['/user/:path*'],
}
