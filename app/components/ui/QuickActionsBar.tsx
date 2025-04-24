import React from 'react'
import { Search, Sparkles } from 'lucide-react'

interface QuickActionsBarProps {
  onSearchClick?: () => void
  onSparklesClick?: () => void
}

export function QuickActionsBar({ onSearchClick, onSparklesClick }: QuickActionsBarProps) {
  return (
    <div className="fixed bottom-16 left-1/2 z-10 -translate-x-1/2 transform">
      <div className="flex space-x-2 rounded-full bg-[#222222] p-2 shadow-lg">
        <button onClick={onSearchClick} className="rounded-full p-2 hover:bg-[#333333]">
          <Search className="h-5 w-5 text-white" />
        </button>
        <button onClick={onSparklesClick} className="rounded-full p-2 hover:bg-[#333333]">
          <Sparkles className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  )
}
