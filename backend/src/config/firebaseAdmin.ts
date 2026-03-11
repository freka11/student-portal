import admin from 'firebase-admin'

if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
    const formattedPrivateKey = privateKey
        ? privateKey.replace(/\\n/g, '\n').replace(/"/g, '')
        : undefined

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !formattedPrivateKey) {
        throw new Error('Missing Firebase Admin SDK credentials in environment variables')
    }

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: formattedPrivateKey,
        }),
    })

    console.log('✅ Firebase Admin SDK initialized successfully')
}

export const adminAuth = admin.auth()
export const adminFirestore = admin.firestore()
export default admin
