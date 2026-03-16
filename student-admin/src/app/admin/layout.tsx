'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/admin/Sidebar'
import { useAdminUser } from '@/hooks/useAdminUser'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'



export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, ready } = useAdminUser()

  const isLoginPage = pathname === '/admin/login'
  const isSignup = pathname === '/admin/signup'

  useEffect(() => {
    if (ready && !admin && !isLoginPage && !isSignup) {
      router.push('/admin/login')
    }
  }, [admin, ready, isLoginPage, isSignup, router])

  if (!ready || (!admin && !isLoginPage && !isSignup)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500 animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
      {!isLoginPage && !isSignup && <Sidebar />}
     
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
    </>
  )
}


