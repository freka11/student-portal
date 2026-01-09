'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/admin/Sidebar'



export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isLoginPage = pathname === '/admin/login'

  return (
    <>

    <div className="flex h-screen bg-gray-50">
      {!isLoginPage && <Sidebar />}
     
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
    </>
  )
}


