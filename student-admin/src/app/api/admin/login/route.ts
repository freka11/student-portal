// student-admin/src/app/api/admin/login/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Convert username to email format for Firebase Auth
    const email = username.includes('@') ? username : `${username}@admin.com`

    // Return email for client-side Firebase authentication
    return NextResponse.json({
      email,
      message: 'Use Firebase client-side authentication'
    }, { status: 200 })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
