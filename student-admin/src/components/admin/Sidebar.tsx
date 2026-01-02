'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  LayoutDashboard,
  Lightbulb,
  HelpCircle,
  MessageSquare,
  Menu,
  X
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Thought', href: '/admin/thought', icon: Lightbulb },
  { name: 'Questions', href: '/admin/question', icon: HelpCircle },
  { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
]

const tabs = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Thought', href: '/admin/thought' },
  { name: 'Questions', href: '/admin/question' },
  { name: 'Chat', href: '/admin/chat' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay - Only show when sidebar is open */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full bg-white shadow-lg transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64
      `}>
        <div className="p-4 lg:p-6">
          {/* Desktop Header */}
          <div className="hidden lg:block mb-6">
            <h1 className="text-xl lg:text-2xl font-bold text-black">Admin Panel</h1>
            <p className="text-sm text-black mt-1">Student Management</p>
          </div>
          
          {/* Mobile Header */}
          <div className="flex justify-between items-center lg:hidden mb-6">
            <h1 className="text-lg font-bold text-black">Menu</h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:mt-6 lg:block">
            <div className="px-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-2 mb-1 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-blue-50 text-black border-r-2 border-blue-700' 
                        : 'text-black hover:bg-gray-50 hover:text-black'
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

          {/* Mobile Tabs */}
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
                      block px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-blue-50 text-black border-r-2 border-blue-700' 
                        : 'text-black hover:bg-gray-50 hover:text-black'
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
