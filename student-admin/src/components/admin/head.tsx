'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'
import { Button } from '@/components/admin/Button'

interface AdminUser {
  id: string
  username: string
  name: string
}

export default function AdminHeader() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminUser')

    if (!storedAdmin) {
      router.replace('/admin/login')
      return
    }

    setAdmin(JSON.parse(storedAdmin))
  }, [router])

  const logout = () => {
    localStorage.removeItem('adminUser')
    router.push('/admin/login')
  }

  return (
   <div className="flex items-center justify-between bg-white px-4 py-2">
  {/* Left: User icon + name */}
  <div className="flex items-center gap-2">
    <User className="h-5 w-5 text-gray-500" />

    <div className="flex flex-col leading-tight">
      <p className="text-sm font-semibold text-gray-900">
        {admin?.name}
      </p>
      <p className="text-xs text-gray-500">
        {admin?.username}
      </p>
    </div>
  </div>

  {/* Right: Logout */}
  <Button
    variant="outline"
    size="sm"
    onClick={logout}
  >
    Logout
  </Button>
</div>
  )
}
