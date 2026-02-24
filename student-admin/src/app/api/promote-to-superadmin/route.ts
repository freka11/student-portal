import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email is required'
      }, { status: 400 })
    }

    console.log('🔥 Promoting user to super admin:', email)

    // Find user by email
    const usersSnapshot = await adminFirestore
      .collection('users')
      .where('email', '==', email)
      .get()
    
    if (usersSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'User not found with provided email'
      }, { status: 404 })
    }
    
    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()

    // Update user to super_admin
    await userDoc.ref.update({
      role: 'super_admin',
      updatedAt: FieldValue.serverTimestamp()
    })

    console.log('✅ User promoted to super admin:', {
      uid: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: 'super_admin'
    })

    return NextResponse.json({
      success: true,
      message: 'User promoted to super admin successfully',
      user: {
        uid: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: 'super_admin'
      }
    })

  } catch (error) {
    console.error('❌ Error promoting user to super admin:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to promote user to super admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
