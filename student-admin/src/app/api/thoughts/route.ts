import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date')
    
    // Fetch thoughts from Firestore - simplified query
    let thoughtsQuery = adminFirestore.collection('thoughts')
    
    if (dateFilter === 'all') {
      // Get all thoughts for history - no filters
      const snapshot = await thoughtsQuery.get()
      const thoughts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      return NextResponse.json(thoughts)
    } else {
      // Get only today's thoughts - simplified query
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

export async function POST(request: NextRequest) {
  try {
    const newThoughtData = await request.json()
    
    // Add thought to Firestore
    const thoughtDoc = {
      text: newThoughtData.thought,
      status: 'published',
      createdBy: {
        uid: 'admin-123', // This should come from authenticated admin
        name: 'Admin User' // This should come from authenticated admin
      },
      createdAt: new Date().toISOString(),
      publishDate: new Date().toISOString().split('T')[0]
    }
    
    await adminFirestore.collection('thoughts').add(thoughtDoc)
    
    return NextResponse.json({ success: true, message: 'Thought saved successfully' })
  } catch (error) {
    console.error('Error saving thought:', error)
    return NextResponse.json({ success: false, message: 'Failed to save thought' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const thoughtId = searchParams.get('id')
    
    if (!thoughtId) {
      return NextResponse.json({ success: false, message: 'Thought ID is required' }, { status: 400 })
    }
    
    // Delete thought from Firestore
    await adminFirestore.collection('thoughts').doc(thoughtId).delete()
    
    return NextResponse.json({ success: true, message: 'Thought deleted successfully' })
  } catch (error) {
    console.error('Error deleting thought:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete thought' }, { status: 500 })
  }
}
