import { NextRequest, NextResponse } from 'next/server'

// Test users to create (for manual setup guide)
const TEST_USERS = [
  {
    username: 'student1',
    email: 'student1@student.com',
    password: 'student123',
    name: 'Student 1',
    role: 'student'
  },
  {
    username: 'student2',
    email: 'student2@student.com',
    password: 'student123',
    name: 'Student 2',
    role: 'student'
  },
  {
    username: 'teacher1',
    email: 'teacher1@admin.com',
    password: 'teacher123',
    name: 'Teacher 1',
    role: 'admin'
  },
  {
    username: 'teacher2',
    email: 'teacher2@admin.com',
    password: 'teacher123',
    name: 'Teacher 2',
    role: 'admin'
  }
]

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 User setup guide - Firebase Admin SDK not configured')
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK setup guide',
      setupRequired: true,
      instructions: {
        step1: 'Go to Firebase Console: https://console.firebase.google.com',
        step2: 'Select your project: student-portal-fab55',
        step3: 'Go to Project Settings → Service Accounts',
        step4: 'Click "Generate new private key"',
        step5: 'Download the JSON file',
        step6: 'Create .env.local file with these variables:',
        envVariables: {
          FIREBASE_PROJECT_ID: 'your-project-id',
          FIREBASE_CLIENT_EMAIL: 'your-client-email',
          FIREBASE_PRIVATE_KEY: 'your-private-key'
        },
        step7: 'Restart the development server',
        step8: 'Run this setup API again'
      },
      users: TEST_USERS.map(u => ({
        username: u.username,
        email: u.email,
        password: u.password,
        name: u.name,
        role: u.role
      })),
      note: 'For now, you can create users manually in Firebase Console → Authentication → Users'
    })
    
  } catch (error) {
    console.error('💥 Setup failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Setup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      message: 'Firebase Admin SDK setup required',
      setupRequired: true,
      instructions: 'Run POST /api/setup-users for detailed setup instructions',
      users: TEST_USERS.map(u => ({
        username: u.username,
        email: u.email,
        password: u.password,
        name: u.name,
        role: u.role
      }))
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      message: 'Error fetching setup info',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
