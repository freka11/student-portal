'use client'

import { Sidebar } from '@/components/user/Sidebar'
import { usePathname, useRouter } from 'next/navigation'
import { useStudentUser } from '@/hooks/useStudentUser'
import { useEffect } from 'react'

export default function UserLayout({

  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, ready } = useStudentUser()

  const isLoginPage = pathname === '/user/login'
  const isSignupPage = pathname === '/user/signup'
  const isAuthPage = isLoginPage || isSignupPage

  useEffect(() => {
    if (ready && !user && !isAuthPage) {
      router.push('/user/login')
    }
  }, [user, ready, isAuthPage, router])

  if (!ready || (!user && !isAuthPage)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500 animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`relative transition-all duration-300 ease-in-out        
        overflow-hidden`}
      >
        {!isLoginPage && !isSignupPage && <Sidebar/>}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div>{children}</div>
      </main>
    </div>
  )
}
