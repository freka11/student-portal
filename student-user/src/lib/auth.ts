import { auth } from './firebase-client'

export async function getStudentIdToken(): Promise<string | null> {
  try {
    await auth.authStateReady()
    return auth.currentUser ? await auth.currentUser.getIdToken() : null
  } catch {
    return null
  }
}
