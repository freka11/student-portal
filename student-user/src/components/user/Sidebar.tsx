'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
  { name: 'My Answers', href: '/user/answers', icon: FileText },
  { name: 'Chat with Admin', href: '/user/chat', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white shadow-lg h-full">
      {/* Header */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-black">
          Student Portal
        </h1>
        <p className="text-sm text-black mt-1">
          Learning Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        {navigation.map(item => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-3 py-2 mb-1 rounded-lg text-sm font-medium hover:scale-105 hover
                transition-transform duration-200 ease-in-out
                ${
                  isActive
                    ? 'bg-blue-50 text-black '
                    : 'text-black hover:bg-gray-50'
                }
              `}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
