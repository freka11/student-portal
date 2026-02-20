import { NextRequest, NextResponse } from 'next/server'

// Simple API that returns mock data for testing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date')
    
    // Return mock data for testing
    const mockQuestions = [
      {
        id: 'sample-question',
        text: 'What is your favorite programming language and why?',
        status: 'published',
        deleted: false,
        createdBy: {
          uid: 'admin-uid-sample',
          name: 'Admin User'
        },
        createdAt: new Date().toISOString(),
        publishDate: '2026-01-16'
      }
    ]
    
    return NextResponse.json(mockQuestions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newQuestionData = await request.json()
    
    // For now, just return success without saving to Firestore
    console.log('Question received:', newQuestionData)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Question saved successfully (mock)',
      data: {
        id: 'mock-id-' + Date.now(),
        text: newQuestionData.question,
        status: 'published',
        deleted: false,
        createdBy: {
          uid: 'admin-123',
          name: 'Admin User'
        },
        createdAt: new Date().toISOString(),
        publishDate: new Date().toISOString().split('T')[0]
      }
    })
  } catch (error) {
    console.error('Error saving question:', error)
    return NextResponse.json({ success: false, message: 'Failed to save question' }, { status: 500 })
  }
}
