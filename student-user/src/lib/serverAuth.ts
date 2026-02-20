import { cookies } from 'next/headers'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin'

export type SessionUser = {
  uid: string
  email: string
  name: string
  role: 'student' | 'admin'
  permissions: string[]
}

function roleFromEmail(email: string): 'student' | 'admin' {
  if (email.includes('@admin.com')) return 'admin'
  return 'student'
}

export async function getVerifiedSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')

  if (!session?.value) return null

  try {
    const decoded = await adminAuth.verifySessionCookie(session.value, true)
    const email = (decoded as any).email

    if (!email) return null

    let role: 'student' | 'admin' = roleFromEmail(email)
    let name: string = (decoded as any).name || email.split('@')[0]

    try {
      const userDoc = await adminFirestore.collection('users').doc(decoded.uid).get()
      const userData = userDoc.exists ? (userDoc.data() as any) : null

      if (userData?.role === 'admin' || userData?.role === 'student') {
        role = userData.role
      }

      if (typeof userData?.name === 'string' && userData.name.trim()) {
        name = userData.name
      }
    } catch {
      // Ignore Firestore errors; fall back to token/email-derived values
    }

    return {
      uid: decoded.uid,
      email,
      name,
      role,
      permissions: role === 'admin' ? ['read', 'write', 'delete'] : ['read', 'write'],
    }
  } catch {
    try {
      const decoded = await adminAuth.verifyIdToken(session.value)
      const email = (decoded as any).email

      if (!email) return null

      let role: 'student' | 'admin' = roleFromEmail(email)
      let name: string = (decoded as any).name || email.split('@')[0]

      try {
        const userDoc = await adminFirestore.collection('users').doc(decoded.uid).get()
        const userData = userDoc.exists ? (userDoc.data() as any) : null

        if (userData?.role === 'admin' || userData?.role === 'student') {
          role = userData.role
        }

        if (typeof userData?.name === 'string' && userData.name.trim()) {
          name = userData.name
        }
      } catch {
        // Ignore Firestore errors; fall back to token/email-derived values
      }

      return {
        uid: decoded.uid,
        email,
        name,
        role,
        permissions: role === 'admin' ? ['read', 'write', 'delete'] : ['read', 'write'],
      }
    } catch {
      return null
    }
  }
}

export async function requireStudent(): Promise<SessionUser | null> {
  const user = await getVerifiedSessionUser()
  if (!user) return null
  if (user.role !== 'student') return null
  return user
}
