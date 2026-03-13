import admin from 'firebase-admin'
import fs from 'node:fs'
import path from 'node:path'

if (!admin.apps.length) {
    // Prefer a local service-account JSON when available, since multiline private keys
    // in .env files are easy to mangle on Windows.
    const workspaceRoot = path.resolve(process.cwd(), '..')
    const fallbackPath =
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
        path.join(workspaceRoot, 'student-portal-fab55-firebase-adminsdk-fbsvc-0440910da3.json')

    if (fs.existsSync(fallbackPath)) {
        const raw = fs.readFileSync(fallbackPath, 'utf8')
        const serviceAccount = JSON.parse(raw) as {
            project_id: string
            client_email: string
            private_key: string
        }

        console.log('🔐 Firebase Admin credential source: service account JSON')
        console.log('   Path:', fallbackPath)
        console.log('   project_id:', serviceAccount.project_id)
        console.log('   client_email:', serviceAccount.client_email)

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: serviceAccount.project_id,
                clientEmail: serviceAccount.client_email,
                privateKey: serviceAccount.private_key,
            }),
        })

        console.log('✅ Firebase Admin SDK initialized successfully')
    } else {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
    const formattedPrivateKey = privateKey
        ? privateKey.replace(/\\n/g, '\n').replace(/"/g, '')
        : undefined

    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

    try {
        if (!projectId || !clientEmail || !formattedPrivateKey) {
            throw new Error('Missing Firebase Admin SDK credentials in environment variables')
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: formattedPrivateKey,
            }),
        })

        console.log('🔐 Firebase Admin credential source: env vars')
        console.log('   FIREBASE_PROJECT_ID:', projectId)
        console.log('   FIREBASE_CLIENT_EMAIL:', clientEmail)
        console.log('✅ Firebase Admin SDK initialized successfully')
    } catch (err) {
        throw err
    }
    }
}

export const adminAuth = admin.auth()
export const adminFirestore = admin.firestore()
export default admin
