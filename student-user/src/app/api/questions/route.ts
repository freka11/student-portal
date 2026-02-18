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
      const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
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
    // Return empty array instead of error status to prevent frontend crashes
    return NextResponse.json([])
  }
}
