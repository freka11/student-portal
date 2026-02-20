'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'

function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
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
        focus:outline-none focus:border-black
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
  )
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    const trimmedEmail = email.trim()
    const trimmedUsername = username.trim()

    if (!trimmedEmail || !trimmedUsername || !password) {
      addToast('Please fill all fields', 'error')
      return
    }

    if (!trimmedEmail.includes('@')) {
      addToast('Please enter a valid email', 'error')
      return
    }

    if (password.length < 6) {
      addToast('Password must be at least 6 characters', 'error')
      return
    }

    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error')
      return
    }

    setLoading(true)

    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase-client')

      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password)

      try {
        await updateProfile(userCredential.user, { displayName: trimmedUsername })
      } catch {
        // Ignore profile update errors and continue; Firestore user doc will still be created.
      }

      const token = await userCredential.user.getIdToken()

      await setDoc(
        doc(db, 'users', userCredential.user.uid),
        {
          email: userCredential.user.email || trimmedEmail,
          username: trimmedUsername,
          name: userCredential.user.displayName || trimmedUsername,
          role: 'student',
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )

      // Create session via API (non-blocking)
      let sessionData: any = null
      try {
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'POST',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!sessionResponse.ok) {
          addToast('Session creation failed. Please try again.', 'error')
          return
        }
        sessionData = await sessionResponse.json()
      } catch {
        addToast('Session creation failed. Please try again.', 'error')
        return
      }

      const userData = {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || trimmedUsername,
        username: trimmedUsername,
        role: sessionData?.user?.role || 'student',
        permissions: sessionData?.user?.permissions || [],
      }

      localStorage.setItem('user', JSON.stringify(userData))
      router.push('/user/dashboard')
    } catch (err: any) {
      const code = err?.code || ''

      if (code === 'auth/email-already-in-use') {
        addToast('Email already in use. Try logging in.', 'error')
      } else if (code === 'auth/invalid-email') {
        addToast('Invalid email', 'error')
      } else if (code === 'auth/weak-password') {
        addToast('Weak password. Use at least 6 characters.', 'error')
      } else {
        addToast('Failed to create account', 'error')
      }
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
            <CardTitle className="text-2xl font-bold text-center">Create Student Account</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Student Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@student.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
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
                  placeholder="Create a password"
                  autoComplete="new-password"
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
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>

              <div className="text-center text-sm text-gray-700">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/user/login')}
                  className="text-blue-600 hover:underline"
                  disabled={loading}
                >
                  Log in
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
