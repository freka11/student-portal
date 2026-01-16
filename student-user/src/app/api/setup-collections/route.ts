import { NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin'

export async function POST() {
  try {
    console.log('🔥 Starting Firestore collections setup...')
    
    // Create sample question document
    await adminFirestore.collection('questions').doc('sample-question').set({
      text: 'What is your favorite programming language and why?',
      status: 'published',
      targetAudience: 'students',
      createdBy: {
        uid: 'admin-uid-sample',
        name: 'Admin User'
      },
      createdAt: new Date(),
      publishDate: '2024-01-16'
    })

    console.log('✅ Sample question created')

    // Create sample thought document
    await adminFirestore.collection('thoughts').doc('sample-thought').set({
      text: 'Today is a great day to learn something new and expand your knowledge!',
      status: 'published',
      targetAudience: 'students',
      createdBy: {
        uid: 'admin-uid-sample',
        name: 'Admin User'
      },
      createdAt: new Date(),
      publishDate: '2024-01-16'
    })

    console.log('✅ Sample thought created')

    return NextResponse.json({
      success: true,
      message: 'Firestore collections created successfully!',
      collections: ['questions', 'thoughts'],
      schema: {
        questions: {
          text: 'string',
          status: 'published | draft',
          targetAudience: 'students',
          createdBy: {
            uid: 'string',
            name: 'string'
          },
          createdAt: 'Timestamp',
          publishDate: 'string (YYYY-MM-DD)'
        },
        thoughts: {
          text: 'string',
          status: 'published | draft',
          targetAudience: 'students',
          createdBy: {
            uid: 'string',
            name: 'string'
          },
          createdAt: 'Timestamp',
          publishDate: 'string (YYYY-MM-DD)'
        }
      }
    })

  } catch (error) {
    console.error('❌ Error creating collections:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
