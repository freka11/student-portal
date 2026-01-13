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

    // 🔒 Future ready: check Firestore role here
    // if (decoded.role !== 'admin') throw new Error()

    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: true,
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
