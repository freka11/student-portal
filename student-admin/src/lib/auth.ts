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

  const { authSessionPost } = await import('./api')
  await authSessionPost(token)
}

export async function getAdminIdToken(): Promise<string | null> {
  // For development authentication, return a mock token
  // The backend will handle dev authentication without requiring Firebase tokens
  const user = getCurrentUser()
  console.log('🔍 Admin Auth Debug - Current User:', user)

  if (user && user.id) {
    // Return a mock token that the backend can recognize for development
    const token = `dev_token_${user.id}`
    console.log('🔍 Admin Auth Debug - Generated Token:', token)
    return token
  }

  // Fallback: try Firebase auth if available, but prefer dev tokens
  if (!auth.currentUser) {
    await new Promise<void>((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe()
        resolve()
      })
      // Timeout after 5 seconds just in case
      setTimeout(() => {
        unsubscribe()
        resolve()
      }, 5000)
    })
  }

  const firebaseUser = auth.currentUser
  if (firebaseUser) {
    console.log('🔍 Admin Auth Debug - Using Firebase token as fallback')
    return firebaseUser.getIdToken()
  }

  console.log('❌ Admin Auth Debug - No user found')
  return null
}

// Development helper function to bypass Firebase auth
export function setDevAdminUser(username: string = 'rahul') {
  const devUser = {
    id: `${username}123`, // This will match our local claims
    email: `${username}@admin.com`,
    name: `${username.charAt(0).toUpperCase() + username.slice(1)} Admin`,
    username: username,
    role: 'admin',
    publicId: `${username}123`,
    permissions: ['read', 'write', 'delete', 'manage_content'],
  }
  
  localStorage.setItem('adminUser', JSON.stringify(devUser))
  console.log('🔧 Development admin user set:', devUser)
  return devUser
}

// Auto-set development user if in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    setDevAdminUser('rahul')
  }
}

export function getBackendUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'
  return `${base}${path}`
}

