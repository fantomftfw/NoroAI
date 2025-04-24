import React from 'react'
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { format, addDays, subDays } from 'date-fns'

interface AppHeaderProps {
  date?: Date
  onPrevDay?: () => void
  onNextDay?: () => void
}

export function AppHeader({
  date = new Date(),
  onPrevDay = () => {},
  onNextDay = () => {},
}: AppHeaderProps) {
  const dayName = format(date, 'EEEE')
  const formattedDate = format(date, 'MMMM do, yyyy')

  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="outline"
          className="rounded-full border-none bg-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.2)]"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Track mood</span>
            <span className="text-orange-300">🌸</span>
          </div>
        </Button>

        <Button variant="ghost" size="icon" className="text-white">
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <div className="relative mb-4 flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 text-white"
          onClick={onPrevDay}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <div className="text-center">
          <h1 className="font-serif text-4xl">{dayName}</h1>
          <p className="text-xl text-gray-400">{formattedDate}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 text-white"
          onClick={onNextDay}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
