import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'
import { requireStudent } from '@/lib/serverAuth'

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return toDateKey(dt)
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireStudent()
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'

    if (all) {
      const snapshot = await adminFirestore
        .collection('answers')
        .orderBy('submittedAt', 'desc')
        .get()

      const answers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      return NextResponse.json(answers)
    }

    // Fetch only current student's answers
    const snapshot = await adminFirestore
      .collection('answers')
      .where('studentId', '==', authUser.uid)
      .get()

    const answers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json(answers)
  } catch (error) {
    console.error('Error fetching answers:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireStudent()
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const answerData = await request.json()
    
    // Validate required fields
    if (!answerData.questionId || !answerData.answer) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: questionId, answer' },
        { status: 400 }
      )
    }
    
    // Create answer document
    const answerDoc = {
      studentId: authUser.uid,
      studentName: authUser.name,
      questionId: answerData.questionId,
      answer: answerData.answer,
      submittedAt: new Date().toISOString(),
      publishDate: answerData.publishDate || new Date().toISOString().split('T')[0]
    }
    
    // Save to Firestore
    const docRef = await adminFirestore.collection('answers').add(answerDoc)

    // Update streak counter (per-user doc) transactionally
    const todayKey = toDateKey(new Date())
    const yesterdayKey = addDays(todayKey, -1)
    const streakRef = adminFirestore.collection('streak').doc(authUser.uid)

    const streakResult = await adminFirestore.runTransaction(async (tx) => {
      const snap = await tx.get(streakRef)
      const existing = snap.exists ? (snap.data() as any) : null

      const lastAnsweredDate: string | null =
        typeof existing?.lastAnsweredDate === 'string' ? existing.lastAnsweredDate : null
      const prevCount: number =
        typeof existing?.streakCount === 'number' && Number.isFinite(existing.streakCount)
          ? existing.streakCount
          : 0

      let nextCount = prevCount
      let nextLast = lastAnsweredDate

      if (lastAnsweredDate === todayKey) {
        // already credited today; no change
        nextCount = prevCount
        nextLast = lastAnsweredDate
      } else if (lastAnsweredDate === yesterdayKey) {
        nextCount = prevCount + 1
        nextLast = todayKey
      } else {
        nextCount = 1
        nextLast = todayKey
      }

      tx.set(
        streakRef,
        {
          studentId: authUser.uid,
          studentName: authUser.name,                   
          streakCount: nextCount,
          lastAnsweredDate: nextLast,
        },
        { merge: true }
      )

      return { streakCount: nextCount, lastAnsweredDate: nextLast }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Answer submitted successfully',
      id: docRef.id,
      streak: streakResult,
    })
  } catch (error) {
    console.error('Error saving answer:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to submit answer' },
      { status: 500 }
    )
  }
}
