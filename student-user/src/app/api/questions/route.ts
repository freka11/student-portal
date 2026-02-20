import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    // Questions are public content, no authentication required
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date')
    
    // Fetch questions from Firestore - simplified query
    let questionsQuery = adminFirestore.collection('questions')
    
    if (dateFilter === 'all') {
      // Get all questions for history - no filters
      const snapshot = await questionsQuery.get()
      const questions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((q: any) => q.status === 'published' && q.deleted !== true)
      return NextResponse.json(questions)
    } else {
      // Get only today's questions - simplified query
      const today = new Date().toISOString().split('T')[0]
      const snapshot = await questionsQuery
        .where('publishDate', '==', today)
        .get()
      const questions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((q: any) => q.status === 'published' && q.deleted !== true)
      return NextResponse.json(questions)
    }
  } catch (error) {
    console.error('Error fetching questions:', error)
    // Return empty array instead of error status to prevent frontend crashes
    return NextResponse.json([])
  }
}
