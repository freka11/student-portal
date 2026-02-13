'use client'

import { useEffect, useState } from 'react'

export interface StudentUser {
  id: string
  name: string
  email?: string
  username?: string
}

export function useStudentUser() {
  const [user, setUser] = useState<StudentUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) {
        const parsed = JSON.parse(stored)
        setUser({
          id: parsed.id,
          name: parsed.name,
          email: parsed.email,
          username: parsed.username,
        })
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setReady(true)
    }
  }, [])

  return { user, ready }
}

