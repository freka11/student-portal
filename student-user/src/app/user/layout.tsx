'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/user/Sidebar'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`relative transition-all duration-300 ease-in-out        
        overflow-hidden`}
      >
        <Sidebar/>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div>{children}</div>
      </main>
    </div>
  )
}
