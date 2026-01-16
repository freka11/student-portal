import { NextRequest, NextResponse } from 'next/server'

// Simple API that returns mock data for testing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date')
    
    // Return mock data for testing
    const mockThoughts = [
      {
        id: 'sample-thought',
        text: 'Today is a great day to learn something new and expand your knowledge!',
        status: 'published',
        createdBy: {
          uid: 'admin-uid-sample',
          name: 'Admin User'
        },
        createdAt: new Date().toISOString(),
        publishDate: '2026-01-16'
      }
    ]
    
    return NextResponse.json(mockThoughts)
  } catch (error) {
    console.error('Error fetching thoughts:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newThoughtData = await request.json()
    
    // For now, just return success without saving to Firestore
    console.log('Thought received:', newThoughtData)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Thought saved successfully (mock)',
      data: {
        id: 'mock-id-' + Date.now(),
        text: newThoughtData.thought,
        status: 'published',
        createdBy: {
          uid: 'admin-123',
          name: 'Admin User'
        },
        createdAt: new Date().toISOString(),
        publishDate: new Date().toISOString().split('T')[0]
      }
    })
  } catch (error) {
    console.error('Error saving thought:', error)
    return NextResponse.json({ success: false, message: 'Failed to save thought' }, { status: 500 })
  }
}
