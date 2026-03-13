import { cookies } from 'next/headers'

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

  return null
}

export async function requireStudent(): Promise<SessionUser | null> {
  const user = await getVerifiedSessionUser()
  if (!user) return null
  if (user.role !== 'student') return null
  return user
}
