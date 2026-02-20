import { NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'
import { requireStudent } from '@/lib/serverAuth'

export async function GET() {
  try {
    const authUser = await requireStudent()
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const snap = await adminFirestore.collection('streak').doc(authUser.uid).get()
    const data = snap.exists ? (snap.data() as any) : null

    return NextResponse.json({
      success: true,
      streak: {
        studentId: authUser.uid,
        studentName: authUser.name,
        streakCount: typeof data?.streakCount === 'number' ? data.streakCount : 0,
        lastAnsweredDate: typeof data?.lastAnsweredDate === 'string' ? data.lastAnsweredDate : null,
      },
    })
  } catch (error) {
    console.error('Error fetching streak:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch streak' }, { status: 500 })
  }
}
