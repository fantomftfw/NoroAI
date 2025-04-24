import React from 'react'
import { Plus } from 'lucide-react'

interface FloatingActionButtonProps {
  onClick?: () => void
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-24 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500 shadow-lg transition-colors hover:bg-purple-600"
    >
      <Plus className="h-7 w-7 text-white" />
    </button>
  )
}
