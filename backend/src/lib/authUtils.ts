import { getAuth, getFirestore } from '../config/firebase'

export type ResolvedUser = {
  uid: string
  email?: string
  name: string
  role: string
  publicId?: string
}

function inferRoleFromEmail(email?: string | null): string {
  if (!email) return 'student'
  if (email.includes('@admin.com')) {
    if (email.includes('superadmin@admin.com')) {
      return 'super_admin'
    }
    if(email.includes('@teacher.com')) {
      return 'teacher'
    }
    return 'admin'
  }
  return 'student'
}

export async function resolveUserData(
  uid: string,
  email?: string | null
): Promise<{ role: string; name: string; publicId?: string } | null> {
  const db = getFirestore()

  const directSnap = await db.collection('users').doc(uid).get()
  if (directSnap.exists) {
    const data = directSnap.data() as any
    return {
      role: data?.role ?? inferRoleFromEmail(email),
      name: typeof data?.name === 'string' && data.name.trim()
        ? data.name.trim()
        : (email?.split('@')[0] ?? 'User'),
      publicId: data?.publicId,
    }
  }

  const byUidSnap = await db
    .collection('users')
    .where('uid', '==', uid)
    .limit(1)
    .get()

  if (!byUidSnap.empty) {
    const data = byUidSnap.docs[0].data() as any
    return {
      role: data?.role ?? inferRoleFromEmail(email),
      name: typeof data?.name === 'string' && data.name.trim()
        ? data.name.trim()
        : (email?.split('@')[0] ?? 'User'),
      publicId: data?.publicId,
    }
  }

  if (email) {
    const byEmailSnap = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (!byEmailSnap.empty) {
      const data = byEmailSnap.docs[0].data() as any
      return {
        role: data?.role ?? inferRoleFromEmail(email),
        name: typeof data?.name === 'string' && data.name.trim()
          ? data.name.trim()
          : (email?.split('@')[0] ?? 'User'),
        publicId: data?.publicId,
      }
    }
  }

  return {
    role: inferRoleFromEmail(email),
    name: email?.split('@')[0] ?? 'User',
  }
}

export async function verifyToken(token: string): Promise<{
  uid: string
  email?: string
} | null> {
  try {
    const decoded = await getAuth().verifyIdToken(token)
    return { uid: decoded.uid, email: decoded.email }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('incorrect "iss"') || msg.includes('session.firebase.google.com')) {
      try {
        const decoded = await getAuth().verifySessionCookie(token, true)
        return { uid: decoded.uid, email: decoded.email }
      } catch {
        return null
      }
    }
    return null
  }
}
