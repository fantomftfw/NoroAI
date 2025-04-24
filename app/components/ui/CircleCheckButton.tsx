import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface CircleCheckButtonProps {
  checked?: boolean
  onClick?: () => void
  className?: string
}

export function CircleCheckButton({ checked = false, onClick, className }: CircleCheckButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full transition-all',
        checked
          ? 'bg-green-500 text-white'
          : 'border-2 border-white/30 text-transparent hover:border-white/50',
        className
      )}
    >
      <Check className="h-5 w-5" />
    </button>
  )
}
