import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin'

export async function middleware(req: NextRequest) {
  const session = req.cookies.get('session')

  const pathname = req.nextUrl.pathname

  // Allow unauthenticated access to login/signup pages
  if (pathname === '/user/login' || pathname === '/user/signup') {
    return NextResponse.next()
  }

  if (!session && req.nextUrl.pathname.startsWith('/user')) {
    return NextResponse.redirect(new URL('/user/login', req.url))
  }

  // If there's a session, verify it's a student
  if (session && req.nextUrl.pathname.startsWith('/user')) {
    try {
      const decoded = await adminAuth.verifySessionCookie(session.value, true)

      // Prefer role from Firestore user profile, fall back to allowing valid token
      try {
        const userDoc = await adminFirestore.collection('users').doc(decoded.uid).get()
        const userData = userDoc.exists ? (userDoc.data() as any) : null
        if (userData?.role && userData.role !== 'student') {
          return NextResponse.redirect(new URL('/user/login', req.url))
        }
      } catch {
        // Ignore Firestore errors; token validity is still enforced by verifyIdToken
      }

      return NextResponse.next()
    } catch (error) {
      return NextResponse.redirect(new URL('/user/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/user/:path*'],
}
