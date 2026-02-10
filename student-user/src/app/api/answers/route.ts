import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'

export async function GET() {
  try {
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
