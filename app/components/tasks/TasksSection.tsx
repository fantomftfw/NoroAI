import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible'

interface TasksSectionProps {
  title: string
  count: number
  children: React.ReactNode
  defaultOpen?: boolean
}

export function TasksSection({ title, count, children, defaultOpen = true }: TasksSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4 w-full">
      <div className="px-4">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between py-3 text-sm font-bold tracking-wider text-gray-300">
            <span>
              {title} ({count})
            </span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="space-y-2 px-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
