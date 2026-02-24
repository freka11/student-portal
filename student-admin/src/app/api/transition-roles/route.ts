import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Starting role transition for existing users...')

    const { transitions } = await request.json()

    if (!transitions || !Array.isArray(transitions)) {
      return NextResponse.json({
        success: false,
        message: 'Transitions array is required'
      }, { status: 400 })
    }

    const batch = adminFirestore.batch()
    let processedCount = 0

    for (const transition of transitions) {
      const { email, newRole, publicId } = transition

      if (!email || !newRole) {
        console.log('⚠️ Skipping invalid transition:', transition)
        continue
      }

      // Find user by email
      const usersSnapshot = await adminFirestore
        .collection('users')
        .where('email', '==', email)
        .get()

      if (usersSnapshot.empty) {
        console.log(`⚠️ User not found: ${email}`)
        continue
      }

      const userDoc = usersSnapshot.docs[0]
      const userData = userDoc.data()

      const updateData: any = {
        role: newRole,
        updatedAt: FieldValue.serverTimestamp()
      }

      // Add publicId if provided
      if (publicId) {
        updateData.publicId = publicId
      }

      batch.update(userDoc.ref, updateData)
      processedCount++

      console.log(`✅ Queued transition: ${email} → ${newRole}`)
    }

    await batch.commit()

    console.log(`✅ Role transition completed. Processed ${processedCount} users.`)

    return NextResponse.json({
      success: true,
      message: `Successfully transitioned ${processedCount} users`,
      processedCount
    })

  } catch (error) {
    console.error('❌ Error during role transition:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to transition roles',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('🔥 Getting current role distribution...')

    const usersSnapshot = await adminFirestore.collection('users').get()
    
    const roleDistribution = {
      student: 0,
      admin: 0,
      teacher: 0,
      super_admin: 0,
      total: 0
    }

    const usersWithoutPublicId = []

    usersSnapshot.forEach(doc => {
      const data = doc.data()
      const role = data.role || 'student'
      
      if (roleDistribution.hasOwnProperty(role)) {
        roleDistribution[role]++
      }
      roleDistribution.total++

      if (!data.publicId) {
        usersWithoutPublicId.push({
          uid: doc.id,
          email: data.email,
          name: data.name,
          currentRole: role
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Role distribution retrieved successfully',
      roleDistribution,
      usersWithoutPublicId,
      suggestedTransitions: [
        { email: 'admin@admin.com', newRole: 'super_admin', publicId: 'SUP-0001' },
        { email: 'teacher1@admin.com', newRole: 'teacher', publicId: 'TCH-0001' },
        { email: 'teacher2@admin.com', newRole: 'teacher', publicId: 'TCH-0002' }
      ]
    })

  } catch (error) {
    console.error('❌ Error getting role distribution:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get role distribution',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
