import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
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
