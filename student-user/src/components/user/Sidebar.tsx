'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Calendar,
  Menu,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
  { name: 'Previous Questions', href: '/user/previous-questions', icon: Calendar },
  { name: 'My Answers', href: '/user/answers', icon: FileText },
  { name: 'Chat with Admin', href: '/user/chat', icon: MessageSquare },
]

const tabs = [
  { name: 'Dashboard', href: '/user/dashboard' },
  { name: 'Previous Questions', href: '/user/previous-questions' },
  { name: 'My Answers', href: '/user/answers' },
  { name: 'Chat with Admin', href: '/user/chat' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 active:scale-100 "
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`
          fixed top-0 left-0 z-50 h-full bg-white shadow-lg transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto active:scale-100
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          w-64
        `}
      >
        <div className="p-4 lg:p-6">
          <div className="hidden lg:block mb-6">
            <h1 className="text-xl lg:text-2xl font-bold text-black">Student Portal</h1>
            <p className="text-sm text-black mt-1">Learning Management</p>
          </div>

          <div className="flex justify-between items-center lg:hidden mb-6">
            <h1 className="text-lg font-bold text-black">Menu</h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="hidden lg:mt-6 lg:block">
            <div className="px-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-2 mb-1 rounded-lg text-sm font-medium hover:scale-105
                      transition-transform duration-200 ease-in-out active:scale-100
                      ${
                        isActive
                          ? 'bg-blue-50 text-black '
                          : 'text-black hover:bg-gray-50'
                      }
                    `}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    <span className="hidden lg:inline">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          <nav className="lg:hidden">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center px-3 py-2 mb-1 rounded-lg text-sm font-medium hover:scale-105 active:scale-100
                      transition-transform duration-200 ease-in-out
                      ${
                        isActive
                          ? 'bg-blue-50 text-black '
                          : 'text-black hover:bg-gray-50'
                      }
                    `}
                  >
                    {tab.name}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
