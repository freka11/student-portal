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
          'max-w-[85%] sm:max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-sm wrap-break-word',
          isSent
            ? 'bg-blue-500 text-white rounded-tr-sm'
            : 'bg-white text-[#111b21] rounded-tl-sm'
        )}
      >
        <p className="text-sm leading-snug whitespace-pre-wrap">{message}</p>
        <div className="mt-1 flex items-end justify-end gap-1 text-[#667781]">
          <p className="text-[11px] leading-none">{timestamp}</p>
          {isSent && (
            <div className="ml-0.5">
              {isDelivered ? (
                <CheckCheck className={cn('h-4 w-4', isDelivered ? 'text-[#53bdeb]' : 'text-[#667781]')} />
              ) : (
                <Check className="h-4 w-4 text-[#667781]" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
