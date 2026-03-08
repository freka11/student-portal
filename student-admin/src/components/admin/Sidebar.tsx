'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Lightbulb,
  HelpCircle,
  MessageSquare,
  Menu,
  X,
  User,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/admin/Button'
import { useAdminUser } from '@/hooks/useAdminUser'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Thought', href: '/admin/thought', icon: Lightbulb },
  { name: 'Question', href: '/admin/question', icon: HelpCircle },
  { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
]
export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { admin, ready } = useAdminUser()

  useEffect(() => {
    if (!ready) return
    if (!admin) {
      router.replace('/admin/login')
    }
  }, [ready, admin, router])

  const logout = () => {
    localStorage.removeItem('adminUser')
    router.push('/admin/login')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 active:scale-100"
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Admin Info */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="text-lg text-black">
              {admin?.name}
             
            </span>
          </div>

          <Button
            onClick={()=>setShowLogoutModal(true)}
            className="cursor-pointer hover:scale-105 transition-all duration-200 bg-white hover:bg-red-500 hover:text-white text-grey-400"
          >
            <LogOut className='w-5 h-5' />
          </Button>
        </div>

        <div className="p-4 lg:p-6">
          {/* Admin Portal Heading (same as Student Portal) */}
          <div className="hidden lg:block mb-6">
            <h1 className="text-xl lg:text-2xl font-bold text-black">
              Admin Portal
            </h1>
            <p className="text-sm text-black mt-1">
              Management Dashboard
              
   
            </p>
          </div>

          {/* Mobile Menu Title */}
          <div className="flex justify-between items-center lg:hidden mb-6">
            <h1 className="text-lg font-bold text-black">Menu</h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:block lg:mt-6">
            <div className="px-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-2 mb-1 rounded-lg text-sm font-medium
                      transition-transform duration-200 ease-in-out
                      hover:scale-105 active:scale-100
                      ${
                        isActive
                          ? 'bg-blue-50 text-black'
                          : 'text-black hover:bg-gray-50'
                      }
                    `}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Mobile Navigation */}
          <nav className="lg:hidden">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center px-3 py-2 mb-1 rounded-lg text-sm font-medium
                      transition-transform duration-200 ease-in-out
                      hover:scale-105 active:scale-100
                      ${
                        isActive
                          ? 'bg-blue-50 text-black'
                          : 'text-black hover:bg-gray-50'
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </aside>

      {showLogoutModal && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={() => setShowLogoutModal(false)} >
    <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-sm p-6"
    onClick={(e) => e.stopPropagation()}>
      <h2 className="text-lg font-semibold text-black">
        Confirm Logout
      </h2>

      <p className="text-sm text-gray-600 mt-2">
        Are you sure you want to logout?
      </p>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setShowLogoutModal(false)}
          className="px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
        >
          No
        </button>

        <button
          onClick={() => {
            setShowLogoutModal(false)
            logout()
          }}
          className="px-4 py-2 rounded-lg text-sm text-white bg-red-500 hover:bg-red-600 cursor-pointer"
        >
          Yes
        </button>
      </div>
    </div>
  </div>
)}

    </>
  )
}
