import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

// #region agent log
fetch('http://127.0.0.1:7242/ingest/43ca688c-b42f-4b46-b34a-008376a5d4f5', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: `log_${Date.now()}_firebaseClientInit`,
    timestamp: Date.now(),
    location: 'src/lib/firebase-client.ts:init',
    message: 'Firebase client initialized',
    data: {
      hasApiKey: !!firebaseConfig.apiKey,
      hasAuthDomain: !!firebaseConfig.authDomain,
      projectIdSet: !!firebaseConfig.projectId
    },
    runId: 'pre-fix',
    hypothesisId: 'H1'
  })
}).catch(() => {})
// #endregion

export const auth = getAuth(app)
