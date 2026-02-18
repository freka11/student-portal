// student-user/src/app/api/users/login/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Convert username to email format for Firebase Auth
    const email = username.includes('@') ? username : `${username}@student.com`

    console.log('🔑 Student login attempt:', { username, email })

    // Return email for client-side Firebase authentication
    return NextResponse.json({
      email,
      message: 'Use Firebase client-side authentication',
      note: 'Firebase Admin SDK not configured - using client-side auth only'
    }, { status: 200 })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
