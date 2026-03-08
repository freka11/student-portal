import { cn } from '@/lib/utils'
import { Check, CheckCheck } from 'lucide-react'

interface ChatBubbleProps {
  message: string
  timestamp: string
  isSent: boolean
  isDelivered?: boolean
}

export function ChatBubble({ message, timestamp, isSent, isDelivered = false }: ChatBubbleProps) {
  return (
    <div className={cn('flex', isSent ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
          isSent
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        )}
      >
        <p className="text-sm">{message}</p>
        <div className={cn('flex items-center justify-between mt-1', isSent ? 'text-blue-100' : 'text-gray-500')}>
          <p className="text-xs">{timestamp}</p>
          {isSent && (
            <div className="ml-2">
              {isDelivered ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
