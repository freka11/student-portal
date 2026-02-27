import { config } from 'dotenv'
import admin from 'firebase-admin'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require('./serviceacount.json')

config() // loads .env automatically (optionally, for other settings)

let app: admin.app.App | null = null

export function getFirebaseAdminApp() {
  if (app) return app

  if (admin.apps.length) {
    app = admin.app()
    return app
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  })

  return app
}

export function getAuth() {
  return getFirebaseAdminApp().auth()
}

export function getFirestore() {
  return getFirebaseAdminApp().firestore()
}