'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'

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
      const email = username.includes('@') ? username : `${username}@student.com`

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/43ca688c-b42f-4b46-b34a-008376a5d4f5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `log_${Date.now()}_login_attempt`,
          timestamp: Date.now(),
          location: 'src/app/user/login/page.tsx:handleSubmit',
          message: 'Login submit attempt',
          data: {
            usernameLength: username.length,
            emailDerived: email,
          },
          runId: 'pre-fix',
          hypothesisId: 'H2'
        })
      }).catch(() => {})
      // #endregion

      // Use Firebase client-side authentication
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase-client')
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const token = await userCredential.user.getIdToken()
        
        // Create session via API
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          
          // Store user data with role
          const userData = {
            id: userCredential.user.uid,
            email: userCredential.user.email,
            name: userCredential.user.displayName || username,
            username: username,
            role: sessionData.user?.role || 'student',
            permissions: sessionData.user?.permissions || []
          }
          
          localStorage.setItem('user', JSON.stringify(userData))
          router.push('/user/dashboard')
        } else {
          addToast('Failed to create session', 'error')
        }
        
      } catch (firebaseError: any) {
        console.error('Firebase auth error:', firebaseError)

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/43ca688c-b42f-4b46-b34a-008376a5d4f5', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `log_${Date.now()}_firebase_error`,
            timestamp: Date.now(),
            location: 'src/app/user/login/page.tsx:handleSubmit',
            message: 'Firebase auth error',
            data: {
              code: firebaseError?.code || null,
              name: firebaseError?.name || null,
              message: firebaseError?.message || null,
            },
            runId: 'pre-fix',
            hypothesisId: 'H3'
          })
        }).catch(() => {})
        // #endregion
        
        // Handle specific Firebase auth errors
        if (firebaseError.code === 'auth/user-not-found') {
          addToast('User not found', 'error')
        } else if (firebaseError.code === 'auth/wrong-password') {
          addToast('Invalid password', 'error')
        } else if (firebaseError.code === 'auth/invalid-email') {
          addToast('Invalid email format', 'error')
        } else if (firebaseError.code === 'auth/invalid-credential') {
          addToast('Invalid credential. Check email/password or Firebase config.', 'error')
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
            User Sign In
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
                  placeholder="Enter your username (rahul or likhith)"
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
                  placeholder="Enter your password (rahul123 or likhith123)"
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
