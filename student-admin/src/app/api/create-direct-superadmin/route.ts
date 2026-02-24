import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore, adminAuth } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 })
    }

    console.log('🔥 Creating super admin:', email)

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name || 'Super Admin',
    })

    console.log('✅ Firebase Auth user created:', userRecord.uid)

    // Get next super admin counter
    const counterDoc = await adminFirestore.collection('counters').doc('superAdminCounter').get()
    let counterValue = 1
    
    if (counterDoc.exists) {
      const counterData = counterDoc.data()
      if (counterData && typeof counterData.value === 'number') {
        counterValue = counterData.value + 1
      }
      await adminFirestore.collection('counters').doc('superAdminCounter').update({
        value: counterValue
      })
    } else {
      await adminFirestore.collection('counters').doc('superAdminCounter').set({
        value: counterValue
      })
    }

    // Generate public ID
    const publicId = `SUP-${counterValue.toString().padStart(4, '0')}`

    // Create user document in Firestore
    const userDoc = {
      uid: userRecord.uid,
      email,
      name: name || 'Super Admin',
      role: 'super_admin',
      publicId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      emailVerified: true,
      disabled: false
    }

    await adminFirestore.collection('users').doc(userRecord.uid).set(userDoc)

    console.log('✅ Firestore user document created')

    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully',
      user: {
        uid: userRecord.uid,
        email,
        name: name || 'Super Admin',
        role: 'super_admin',
        publicId
      }
    })

  } catch (error) {
    console.error('❌ Error creating super admin:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create super admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
