import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { email, uid } = await request.json()

    if (!email && !uid) {
      return NextResponse.json({
        success: false,
        message: 'Either email or uid must be provided'
      }, { status: 400 })
    }

    console.log('🔥 Creating super admin account...')

    let userQuery
    if (uid) {
      userQuery = adminFirestore.collection('users').doc(uid)
    } else {
      // Find user by email (requires query)
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
      
      userQuery = usersSnapshot.docs[0].ref
    }

    const userDoc = await userQuery.get()
    if (!userDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    const userData = userDoc.data()
    if (!userData) {
      return NextResponse.json({
        success: false,
        message: 'User data not found'
      }, { status: 404 })
    }
    const updatedData: any = {
      ...userData,
      role: 'super_admin',
      updatedAt: FieldValue.serverTimestamp()
    }

    // If user doesn't have a publicId, generate one
    if (!userData.publicId) {
      const { generatePublicId } = await import('@/lib/idGenerator')
      const publicId = await generatePublicId('super_admin')
      updatedData.publicId = publicId
    }

    await userQuery.update(updatedData)

    console.log('✅ Super admin created:', {
      uid: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: 'super_admin',
      publicId: updatedData.publicId
    })

    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully',
      user: {
        uid: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: 'super_admin',
        publicId: updatedData.publicId
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

export async function GET() {
  try {
    // List current super admins
    const superAdminsSnapshot = await adminFirestore
      .collection('users')
      .where('role', '==', 'super_admin')
      .get()

    const superAdmins: any[] = []
    superAdminsSnapshot.forEach(doc => {
      const data = doc.data()
      superAdmins.push({
        uid: doc.id,
        email: data.email,
        name: data.name,
        publicId: data.publicId,
        role: data.role
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Super admins retrieved',
      superAdmins
    })

  } catch (error) {
    console.error('❌ Error retrieving super admins:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve super admins',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
