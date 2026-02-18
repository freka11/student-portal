import { NextResponse } from 'next/server'

// This API provides instructions for creating test users manually
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

export async function GET() {
  return NextResponse.json({
    message: 'Test Users Creation Guide',
    instructions: {
      step1: 'Go to Firebase Console: https://console.firebase.google.com',
      step2: 'Select project: student-portal-fab55',
      step3: 'Go to Authentication → Users',
      step4: 'Click "Add user" for each user below:',
      users: TEST_USERS
    },
    note: 'After creating users in Firebase Authentication, you can login with these credentials'
  })
}

export async function POST() {
  return NextResponse.json({
    message: 'Manual user creation required',
    instructions: 'Use GET /api/create-test-user to see user creation instructions',
    users: TEST_USERS
  })
}
