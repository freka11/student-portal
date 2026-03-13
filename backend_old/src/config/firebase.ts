import { config } from 'dotenv'
import admin from 'firebase-admin'

config() // loads .env automatically

let app: admin.app.App | null = null

export function getFirebaseAdminApp() {
  if (app) return app

  if (admin.apps.length) {
    app = admin.app()
    return app
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase environment variables')
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })

  return app
}

export function getAuth() {
  return getFirebaseAdminApp().auth()
}

export function getFirestore() {
  return getFirebaseAdminApp().firestore()
}