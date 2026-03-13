import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const session = req.cookies.get('user_session') || req.cookies.get('session')

  const pathname = req.nextUrl.pathname

  // Allow unauthenticated access to login/signup pages
  if (pathname === '/user/login' || pathname === '/user/signup') {
    return NextResponse.next()
  }

  if (!session && req.nextUrl.pathname.startsWith('/user')) {
    return NextResponse.redirect(new URL('/user/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/user/:path*'],
}
