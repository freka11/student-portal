'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'


  

/* ---------- Local UI Components ---------- */

function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-700"
    >
      {children}
    </label>
  )
}

function Input({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
        focus:outline-none  focus:border-black
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
  )
}

/* ---------- Page ---------- */

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

    
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)

    try {
      // Convert username to email format for Firebase
      const email = username.includes('@') ? username : `${username}@admin.com`

      // Use Firebase client-side authentication
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase-client')
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const token = await userCredential.user.getIdToken()

        // Create/update Firestore user profile (canonical source for chat user discovery)
        await setDoc(
          doc(db, 'users', userCredential.user.uid),
          {
            email: userCredential.user.email || email,
            username,
            name: userCredential.user.displayName || username,
            role: 'admin',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )

        // Create session via API (non-blocking)
        let sessionData: any = null
        try {
          const sessionResponse = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (sessionResponse.ok) {
            sessionData = await sessionResponse.json()
          }
        } catch {
          sessionData = null
        }

        // Store user data with role
        const userData = {
          id: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName || username,
          username: username,
          role: sessionData?.user?.role || 'admin',
          permissions: sessionData?.user?.permissions || [],
        }

        localStorage.setItem('adminUser', JSON.stringify(userData))
        router.push('/admin/dashboard')
        
      } catch (firebaseError: any) {
        console.error('Firebase auth error:', firebaseError)
        
        // Handle specific Firebase auth errors
        if (firebaseError.code === 'auth/user-not-found') {
          addToast('User not found', 'error')
        } else if (firebaseError.code === 'auth/wrong-password') {
          addToast('Invalid password', 'error')
        } else if (firebaseError.code === 'auth/invalid-email') {
          addToast('Invalid email format', 'error')
        } else {
          addToast('Authentication failed', 'error')
        }
      }
      
    } catch {
      addToast('An error occurred. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <ToastContainer />

      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Admin Sign In
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
                           </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
