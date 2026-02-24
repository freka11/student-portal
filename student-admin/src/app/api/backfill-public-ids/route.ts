import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'
import { generatePublicId } from '@/lib/idGenerator'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Starting backfill of public IDs for existing users...')

    // Get all users from Firestore
    const usersSnapshot = await adminFirestore.collection('users').get()
    
    if (usersSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No users found to backfill',
        usersUpdated: 0
      })
    }

    console.log(`📊 Found ${usersSnapshot.size} users to process`)

    let usersUpdated = 0
    const errors: string[] = []

    // Process users in batches to avoid overwhelming the database
    const batchSize = 10
    const users = usersSnapshot.docs

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      
      for (const userDoc of batch) {
        try {
          const userData = userDoc.data()
          
          // Skip if user already has a publicId
          if (userData.publicId) {
            console.log(`⏭️  User ${userDoc.id} already has publicId: ${userData.publicId}`)
            continue
          }

          // Determine role from existing data or default to 'student'
          let role = userData.role || 'student'
          
          // Handle role mapping for existing admins
          if (role === 'admin') {
            // For now, keep existing admins as 'admin'
            // Later we can transition them to super_admin/teacher
            role = 'admin'
          }

          // Generate public ID
          const publicId = await generatePublicId(role as any)

          // Update user document
          await adminFirestore.collection('users').doc(userDoc.id).update({
            publicId: publicId,
            updatedAt: FieldValue.serverTimestamp()
          })

          console.log(`✅ Updated user ${userDoc.id} (${userData.email}) with publicId: ${publicId}`)
          usersUpdated++

        } catch (error) {
          const errorMsg = `Failed to update user ${userDoc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(`❌ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }

      // Small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`🎉 Backfill completed! Updated ${usersUpdated} users`)

    return NextResponse.json({
      success: true,
      message: `Backfill completed successfully`,
      stats: {
        totalUsers: usersSnapshot.size,
        usersUpdated,
        usersSkipped: usersSnapshot.size - usersUpdated,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ Error during backfill:', error)
    return NextResponse.json({
      success: false,
      message: 'Backfill failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get current status of public IDs
    const usersSnapshot = await adminFirestore.collection('users').get()
    
    let withPublicId = 0
    let withoutPublicId = 0
    const usersByRole: Record<string, number> = {}

    usersSnapshot.forEach(doc => {
      const userData = doc.data()
      const role = userData.role || 'unknown'
      
      usersByRole[role] = (usersByRole[role] || 0) + 1
      
      if (userData.publicId) {
        withPublicId++
      } else {
        withoutPublicId++
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Public ID status retrieved',
      stats: {
        totalUsers: usersSnapshot.size,
        withPublicId,
        withoutPublicId,
        usersByRole
      }
    })

  } catch (error) {
    console.error('❌ Error getting public ID status:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
