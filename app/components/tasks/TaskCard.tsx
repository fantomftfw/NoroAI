import React from 'react'
import { CircleCheckButton } from '../ui/CircleCheckButton'
import { Clock, CheckSquare, AlertCircle } from 'lucide-react'

type TaskStatus = string // 'active' | 'paused' | 'completed'
type TaskIcon = string // 'timer' | 'checkmark' | 'test'

interface TaskCardProps {
  title: string
  status: TaskStatus
  statusText?: string
  icon: TaskIcon
  onComplete?: () => void
  checked?: boolean
}

export function TaskCard({
  title,
  status,
  statusText,
  icon,
  onComplete,
  checked = false,
}: TaskCardProps) {
  const getIcon = () => {
    switch (icon) {
      case 'timer':
        return <Clock className="h-6 w-6 text-indigo-300" />
      case 'checkmark':
        return <CheckSquare className="h-6 w-6 text-red-300" />
      case 'test':
        return <AlertCircle className="h-6 w-6 text-green-300" />
      default:
        return <Clock className="h-6 w-6 text-indigo-300" />
    }
  }

  return (
    <div className="my-2 flex items-center justify-between rounded-xl bg-[#111111] p-4">
      <div className="flex items-center">
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#222222]">
          {getIcon()}
        </div>
        <div>
          <h3 className="font-medium text-white">{title}</h3>
          <p className="text-sm text-gray-400">{statusText || status}</p>
        </div>
      </div>
      <CircleCheckButton checked={checked} onClick={onComplete} />
    </div>
  )
}
