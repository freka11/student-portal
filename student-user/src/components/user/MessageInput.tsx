'use client'

import { Send } from 'lucide-react'
import { Button } from '@/components/admin/Button'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled: boolean
  loading: boolean
}

export const MessageInput = ({
  value,
  onChange,
  onSend,
  disabled,
  loading,
}: MessageInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled && !loading) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="p-3 border-t border-gray-200 bg-[#f0f2f5]">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={disabled || loading}
          className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <Button
          onClick={onSend}
          disabled={!value.trim() || disabled || loading}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send'}
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
