import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin'

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
    
    // Validate required fields
    if (!newThoughtData.thought || newThoughtData.thought.trim() === '') {
      return NextResponse.json({ success: false, message: 'Thought text is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(sessionToken)
    const userRole = (decoded as any)?.role || (decoded as any)?.customClaims?.role
    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userSnap = await adminFirestore.collection('users').doc(decoded.uid).get()
    const userData = userSnap.exists ? (userSnap.data() as any) : null
    const resolvedName =
      (typeof userData?.name === 'string' && userData.name.trim())
        ? userData.name.trim()
        : (typeof (decoded as any)?.name === 'string' && (decoded as any).name.trim())
          ? (decoded as any).name.trim()
          : typeof decoded.email === 'string'
            ? decoded.email.split('@')[0]
            : 'Admin'
    
    // Add thought to Firestore
    const thoughtDoc = {
      text: newThoughtData.thought,
      status: 'published',
      createdBy: {
        uid: decoded.uid,
        name: resolvedName,
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
