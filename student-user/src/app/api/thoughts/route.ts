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
    const authUser = await requireStudent()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date')
    
    // Fetch thoughts from Firestore - simplified query without complex filters
    let thoughtsQuery = adminFirestore.collection('thoughts')
    
    if (dateFilter === 'all') {
      // Get all thoughts for history - no filters
      const snapshot = await thoughtsQuery.get()
      const thoughts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      return NextResponse.json(thoughts)
    } else {
      // Get only today's published thoughts - simplified query
      const today = new Date().toISOString().split('T')[0]
      const snapshot = await thoughtsQuery
        .where('publishDate', '==', today)
        .get()
      const thoughts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      return NextResponse.json(thoughts)
    }
  } catch (error) {
    console.error('Error fetching thoughts:', error)
    return NextResponse.json([], { status: 500 })
  }
}
