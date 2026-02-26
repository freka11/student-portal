import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin'

async function verifyAdminSessionToken(token: string) {
  try {
    return await adminAuth.verifyIdToken(token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)

    // Some environments store a Firebase *session cookie* in `session`.
    // Session cookies have issuer `https://session.firebase.google.com/<projectId>`.
    // In that case, verify using `verifySessionCookie`.
    if (msg.includes('incorrect "iss"') || msg.includes('session.firebase.google.com')) {
      return await adminAuth.verifySessionCookie(token, true)
    }

    throw err
  }
}

function inferRoleFromEmail(email?: string | null): 'admin' | 'super_admin' | 'student' {
  if (!email) return 'student'
  if (email.includes('@admin.com')) {
    if (email.includes('teacher1@admin.com') || email.includes('teacher2@admin.com')) {
      return 'super_admin'
    }
    return 'admin'
  }
  return 'student'
}

async function resolveUserData(uid: string, email?: string | null) {
  const directSnap = await adminFirestore.collection('users').doc(uid).get()
  if (directSnap.exists) return directSnap.data() as any

  // Fallback: some environments store users under a different doc id.
  const byUidSnap = await adminFirestore
    .collection('users')
    .where('uid', '==', uid)
    .limit(1)
    .get()

  if (!byUidSnap.empty) return byUidSnap.docs[0].data() as any

  if (email) {
    const byEmailSnap = await adminFirestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (!byEmailSnap.empty) return byEmailSnap.docs[0].data() as any
  }

  return null
}

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
    const sessionToken =
      cookieStore.get('admin_session')?.value || cookieStore.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyAdminSessionToken(sessionToken)
    const userData = await resolveUserData(decoded.uid, decoded.email)

    const effectiveRole: string | undefined =
      userData?.role ||
      (decoded as any)?.role ||
      (decoded as any)?.customClaims?.role ||
      inferRoleFromEmail(decoded.email)

    if (effectiveRole !== 'admin' && effectiveRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden', role: effectiveRole },
        { status: 403 }
      )
    }
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
    
    const docRef = await adminFirestore.collection('thoughts').add(thoughtDoc)
    
    return NextResponse.json({
      success: true,
      message: 'Thought saved successfully',
      id: docRef.id,
    })
  } catch (error) {
    console.error('Error saving thought:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to save thought',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
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
