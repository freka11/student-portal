import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test if Firebase Admin SDK can be imported
    const admin = require('firebase-admin')
    
    // Test if environment variables are available
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK test',
      env: {
        projectId: projectId ? 'SET' : 'NOT_SET',
        clientEmail: clientEmail ? 'SET' : 'NOT_SET',
        privateKey: privateKey ? 'SET' : 'NOT_SET',
        privateKeyLength: privateKey ? privateKey.length : 0
      }
    })
  } catch (error) {
    console.error('Firebase test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
