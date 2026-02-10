import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'

export async function GET() {
  try {
    // Fetch all answers from Firestore
    const snapshot = await adminFirestore.collection('answers').get()
    const answers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    return NextResponse.json(answers)
  } catch (error) {
    console.error('Error reading answers:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const answerId = searchParams.get('id')
    
    if (!answerId) {
      return NextResponse.json({ success: false, message: 'Answer ID is required' }, { status: 400 })
    }
    
    // Delete answer from Firestore
    await adminFirestore.collection('answers').doc(answerId).delete()
    
    return NextResponse.json({ success: true, message: 'Answer deleted successfully' })
  } catch (error) {
    console.error('Error deleting answer:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete answer' }, { status: 500 })
  }
}
