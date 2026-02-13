import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin'

async function requireStudent() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')

  if (!session) return null

  try {
    const decoded = await adminAuth.verifyIdToken(session.value)
    const userRole = (decoded as any).role || decoded.customClaims?.role
    if (userRole !== 'student') return null
    return decoded
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const authUser = await requireStudent()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all answers from Firestore
    const snapshot = await adminFirestore.collection('answers').get()
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const answerData = await request.json()
    
    // Validate required fields
    if (!answerData.studentId || !answerData.studentName || !answerData.questionId || !answerData.answer) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: studentId, studentName, questionId, answer' },
        { status: 400 }
      )
    }
    
    // Create answer document
    const answerDoc = {
      studentId: answerData.studentId,
      studentName: answerData.studentName,
      questionId: answerData.questionId,
      answer: answerData.answer,
      submittedAt: new Date().toISOString()
    }
    
    // Save to Firestore
    const docRef = await adminFirestore.collection('answers').add(answerDoc)
    
    return NextResponse.json({
      success: true,
      message: 'Answer submitted successfully',
      id: docRef.id
    })
  } catch (error) {
    console.error('Error saving answer:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to submit answer' },
      { status: 500 }
    )
  }
}
