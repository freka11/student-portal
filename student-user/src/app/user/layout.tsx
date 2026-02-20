'use client'

import { Sidebar } from '@/components/user/Sidebar'

import { usePathname } from 'next/navigation'

export default function UserLayout({

  children,
}: {
  children: React.ReactNode
}) {
    const pathname = usePathname()
   const isLoginPage =  pathname === '/user/login'
   
   const isSignupPage =  pathname === '/user/signup'

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
