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
    
    // Fetch questions from Firestore - simplified query
    let questionsQuery = adminFirestore.collection('questions')
    
    if (dateFilter === 'all') {
      // Get all questions for history - no filters
      const snapshot = await questionsQuery.get()
      const questions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((q: any) => q.deleted !== true)
      return NextResponse.json(questions)
    } else {
      // Get only today's questions - simplified query
      const today = new Date().toISOString().split('T')[0]
      const snapshot = await questionsQuery
        .where('publishDate', '==', today)
        .get()
      const questions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((q: any) => q.deleted !== true)
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

    // Validate required fields
    if (!newQuestionData.question || typeof newQuestionData.question !== 'string' || !newQuestionData.question.trim()) {
      return NextResponse.json(
        { success: false, message: 'Question text is required' },
        { status: 400 }
      )
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
    
    // Add question to Firestore with student audience
    const questionData = {
      text: String(newQuestionData.question).trim(),
      status: newQuestionData.status || 'published', // Use status from frontend
      deleted: false,
      createdBy: {
        uid: decoded.uid,
        name: resolvedName,
      },
      createdAt: new Date().toISOString(),
      publishDate: new Date().toISOString().split('T')[0]
    }
    
    const docRef = await adminFirestore.collection('questions').add(questionData)
    
    return NextResponse.json({
      success: true,
      message: 'Question saved successfully',
      id: docRef.id,
    })
  } catch (error) {
    console.error('Error saving question:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to save question',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
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
    
    // Soft delete question in Firestore
    await adminFirestore.collection('questions').doc(questionId).update({
      deleted: true,
      deletedAt: new Date().toISOString()
    })
    
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

    if (body?.status !== 'published' && body?.status !== 'draft') {
      return NextResponse.json(
        { success: false, message: 'Status must be published or draft' },
        { status: 400 }
      )
    }

    await adminFirestore
      .collection('questions')
      .doc(questionId)
      .update({
        status: body.status,
        updatedAt: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully'
    })
  } catch (error) {
    console.error('Error updating question status:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update question' },
      { status: 500 }
    )
  }
}
