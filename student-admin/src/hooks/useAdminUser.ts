'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase-client'

export interface AdminUser {
  id: string
  name: string
  email?: string
  username?: string
  firebaseUid?: string
  role?: 'admin' | 'teacher' | 'super_admin'
  publicId?: string
  permissions?: string[]
}

export function useAdminUser() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Check local storage first
    try {
      const stored = localStorage.getItem('adminUser')
      if (stored) {
        const parsed = JSON.parse(stored)
        
        // Check Firebase auth state
        const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
          if (firebaseUser) {
            // User is authenticated with Firebase
            setAdmin({
              id: parsed.id,
              email: parsed.email,
              username: parsed.username,
              name: parsed.name,
              firebaseUid: firebaseUser.uid,
              role: parsed.role,
              publicId: parsed.publicId,
              permissions: parsed.permissions,
            })
          } else {
            // User not authenticated with Firebase, but has local storage
            setAdmin({
              id: parsed.id,
              email: parsed.email,
              username: parsed.username,
              name: parsed.name,
              role: parsed.role,
              publicId: parsed.publicId,
              permissions: parsed.permissions,
            })
          }
          setReady(true)
        })

        return () => unsubscribe()
      } else {
        setAdmin(null)
        setReady(true)
      }
    } catch {
      setAdmin(null)
      setReady(true)
    }
  }, [])

  return { admin, ready }
}

