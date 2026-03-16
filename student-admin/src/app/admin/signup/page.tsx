'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'
import { config } from '@/lib/config'

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

export default function SignUpPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'teacher'>('teacher')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    // Validation
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      addToast('Please fill in all fields', 'error')
      return
    }

    if (password.length < 6) {
      addToast('Password must be at least 6 characters long', 'error')
      return
    }

    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error')
      return
    }

    setLoading(true)

    try {
      // Convert username to email format for Firebase
      const email = username.includes('@') ? username : `${username}@admin.com`

      // Check if email already exists in Firestore
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase-client')
      
      const usersRef = collection(db, 'users')
      const emailQuery = query(usersRef, where('email', '==', email))
      const emailSnapshot = await getDocs(emailQuery)
      
      if (!emailSnapshot.empty) {
        addToast('An account with this email already exists', 'error')
        setLoading(false)
        return
      }

      // Use Firebase client-side authentication
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase-client')
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const token = await userCredential.user.getIdToken()

        // Create session via API (non-blocking)
        let sessionData: any = null
        try {
          const sessionResponse = await fetch(`${config.API_BASE_URL}/api/auth/session`, {
            method: 'POST',
            credentials: 'include',
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

        // Create/update Firestore user profile with role
        await setDoc(
          doc(db, 'users', userCredential.user.uid),
          {
            email: userCredential.user.email || email,
            username,
            name: userCredential.user.displayName || username,
            role: role, // Store the selected role
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )

        // Store user data with role
        const userData = {
          id: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName || username,
          username: username,
          role: role,
          publicId: sessionData?.user?.publicId,
          permissions: sessionData?.user?.permissions || [],
        }

        localStorage.setItem('adminUser', JSON.stringify(userData))
        addToast(`Account created successfully! Welcome ${role}.`, 'success')
        router.push('/admin/dashboard')
        
      } catch (firebaseError: any) {
        console.error('Firebase auth error:', firebaseError)
        
        // Handle specific Firebase auth errors
        if (firebaseError.code === 'auth/email-already-in-use') {
          addToast('An account with this username already exists', 'error')
        } else if (firebaseError.code === 'auth/invalid-email') {
          addToast('Invalid username format', 'error')
        } else if (firebaseError.code === 'auth/weak-password') {
          addToast('Password is too weak', 'error')
        } else {
          addToast('Account creation failed', 'error')
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
              Admin Sign Up
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="teacher"
                      checked={role === 'teacher'}
                      onChange={(e) => setRole(e.target.value as 'admin' | 'teacher')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Teacher</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={(e) => setRole(e.target.value as 'admin' | 'teacher')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Admin</span>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/admin/login')}
                    className="text-blue-600 hover:text-blue-500 font-medium cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
