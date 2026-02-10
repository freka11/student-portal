import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

export async function middleware(req: NextRequest) {
  const session = req.cookies.get('session')

  if (!session && req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  // If there's a session, verify it's an admin
  if (session && req.nextUrl.pathname.startsWith('/admin')) {
    try {
      const decoded = await adminAuth.verifyIdToken(session.value)
      const userRole = decoded.role || decoded.customClaims?.role
      
      // Only allow admins to access admin routes
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
