'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/Card'
import { Button } from '@/components/admin/Button'
import { useToast } from '@/components/admin/Toast'
import { signInWithGoogle } from '@/lib/auth'


  

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

    const handleLogin = async () => {
    await signInWithGoogle()
    router.push('/admin/dashboard')
  }

  const router = useRouter()
  const { addToast, ToastContainer } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('adminUser', JSON.stringify(data.user))
        router.push('/admin/dashboard') 
      } else {
        addToast(data.message || 'Invalid credentials', 'error')
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
               <Button onClick={handleLogin}>
                Sign in with Google
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
