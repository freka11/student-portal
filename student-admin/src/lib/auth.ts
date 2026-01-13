// student-admin/src/lib/auth.ts


import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from './firebase-client'



export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem('adminUser')
  return user ? JSON.parse(user) : null
}

export function isAuthenticated() {
  return !!getCurrentUser()
}

export function logout() {
  localStorage.removeItem('adminUser')
  window.location.href = '/admin/login'
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  const token = await result.user.getIdToken()

  await fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
