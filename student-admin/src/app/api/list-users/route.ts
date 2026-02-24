import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'

export async function GET() {
  try {
    console.log('🔥 Listing all users...')
    
    const usersSnapshot = await adminFirestore.collection('users').get()
    const users: any[] = []
    
    usersSnapshot.forEach(doc => {
      const data = doc.data()
      users.push({
        uid: doc.id,
        email: data.email,
        name: data.name,
        role: data.role,
        publicId: data.publicId || null,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || null
      })
    })

    console.log(`✅ Found ${users.length} users`)

    return NextResponse.json({
      success: true,
      message: 'Users retrieved successfully',
      users
    })

  } catch (error) {
    console.error('❌ Error listing users:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve users',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
