import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date')
    
    // Fetch questions from Firestore - simplified query
    let questionsQuery = adminFirestore.collection('questions')
    
    if (dateFilter === 'all') {
      // Get all questions for history - no filters
      const snapshot = await questionsQuery.get()
      const questions = snapshot.docs.map(doc => ({
  id: doc.id,
  disabled: false,
  ...doc.data()
}))

      return NextResponse.json(questions)
    } else {
      // Get only today's questions - simplified query
      const today = new Date().toISOString().split('T')[0]
      const snapshot = await questionsQuery
        .where('publishDate', '==', today)
        .get()
      const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      return NextResponse.json(questions)
    }
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newQuestionData = await request.json()
    
    // Add question to Firestore with student audience
    const questionData = {
      text: newQuestionData.question,
      status: newQuestionData.status || 'published', // Use status from frontend
       disabled: false,
      createdBy: {
        uid: 'admin-123', // This should come from authenticated admin
        name: 'Admin User' // This should come from authenticated admin
      },
      createdAt: new Date().toISOString(),
      publishDate: new Date().toISOString().split('T')[0]
    }
    
    await adminFirestore.collection('questions').add(questionData)
    
    return NextResponse.json({ success: true, message: 'Question saved successfully' })
  } catch (error) {
    console.error('Error saving question:', error)
    return NextResponse.json({ success: false, message: 'Failed to save question' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedQuestionData = await request.json()
    
    if (!updatedQuestionData.id) {
      return NextResponse.json({ success: false, message: 'Question ID is required' }, { status: 400 })
    }
    
    // Update question in Firestore
    await adminFirestore.collection('questions').doc(updatedQuestionData.id).update({
      text: updatedQuestionData.question,
      status: updatedQuestionData.status,
      updatedAt: new Date().toISOString()
    })
    
    return NextResponse.json({ success: true, message: 'Question updated successfully' })
  } catch (error) {
    console.error('Error updating question:', error)
    return NextResponse.json({ success: false, message: 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('id')
    
    if (!questionId) {
      return NextResponse.json({ success: false, message: 'Question ID is required' }, { status: 400 })
    }
    
    // Delete question from Firestore
    await adminFirestore.collection('questions').doc(questionId).delete()
    
    return NextResponse.json({ success: true, message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete question' }, { status: 500 })
  }
}


export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('id')

    if (!questionId) {
      return NextResponse.json(
        { success: false, message: 'Question ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    await adminFirestore
      .collection('questions')
      .doc(questionId)
      .update({
        disabled: body.disabled,
        updatedAt: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully'
    })
  } catch (error) {
    console.error('Error updating question disabled state:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update question' },
      { status: 500 }
    )
  }
}
