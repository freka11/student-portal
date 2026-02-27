// student-admin/src/lib/auth.ts


import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from './firebase-client'

export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem('studentUser')
  return user ? JSON.parse(user) : null
}

export function isAuthenticated() {
  return !!getCurrentUser()
}

export function logout() {
  localStorage.removeItem('studentUser')
  window.location.href = '/User/login'
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  const token = await result.user.getIdToken()

  const { authSessionPost } = await import('./api')
  await authSessionPost(token)
}

export async function getStudentIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

export function getBackendUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'
  return `${base}${path}`
}

