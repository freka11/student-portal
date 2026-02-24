import admin from 'firebase-admin'

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
    const formattedPrivateKey = privateKey
      ? privateKey.replace(/\\n/g, '\n').replace(/"/g, '')
      : undefined

    console.log('🔥 Initializing Firebase Admin SDK...')
    console.log('Project ID:', process.env.FIREBASE_PROJECT_ID)
    console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL)
    console.log('Private Key exists:', !!privateKey)

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !formattedPrivateKey) {
      throw new Error('Missing Firebase Admin SDK credentials')
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedPrivateKey,
      }),
    })

    console.log('✅ Firebase Admin SDK initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error)
    throw error
  }
}

export const adminAuth = admin.auth()
export const adminFirestore = admin.firestore()
