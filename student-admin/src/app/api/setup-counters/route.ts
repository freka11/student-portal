import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Setting up Firestore counters for public ID generation...')

    // Initialize counters for all roles
    const counters = [
      { id: 'studentCounter', lastNumber: 0, prefix: 'STU' },
      { id: 'adminCounter', lastNumber: 0, prefix: 'ADM' },
      { id: 'teacherCounter', lastNumber: 0, prefix: 'TCH' },
      { id: 'superAdminCounter', lastNumber: 0, prefix: 'SUP' }
    ]

    const batch = adminFirestore.batch()

    for (const counter of counters) {
      const counterRef = adminFirestore.collection('counters').doc(counter.id)
      batch.set(counterRef, {
        lastNumber: counter.lastNumber,
        prefix: counter.prefix,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      })
    }

    await batch.commit()

    console.log('✅ All counters initialized successfully!')

    return NextResponse.json({
      success: true,
      message: 'Counters initialized successfully',
      counters: [
        'studentCounter (STU-0001, STU-0002, ...)',
        'adminCounter (ADM-0001, ADM-0002, ...)',
        'teacherCounter (TCH-0001, TCH-0002, ...)',
        'superAdminCounter (SUP-0001, SUP-0002, ...)'
      ]
    })

  } catch (error) {
    console.error('❌ Error setting up counters:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to setup counters',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const countersSnapshot = await adminFirestore.collection('counters').get()
    const counters: any[] = []
    
    countersSnapshot.forEach(doc => {
      counters.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Counters retrieved successfully',
      counters
    })

  } catch (error) {
    console.error('❌ Error retrieving counters:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve counters',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
