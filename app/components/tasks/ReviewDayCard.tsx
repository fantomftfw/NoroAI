import React from 'react'
import { ChevronRight } from 'lucide-react'

interface ReviewDayCardProps {
  onClick?: () => void
}

export function ReviewDayCard({ onClick }: ReviewDayCardProps) {
  return (
    <div
      className="mx-4 my-6 rounded-xl bg-gradient-to-b from-blue-900/20 to-indigo-900/20 p-4"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h3 className="font-serif text-2xl text-white">Review your day</h3>
          <p className="max-w-[70%] text-sm text-gray-300">
            Celebrate your wins and move unfinished tasks ahead.
          </p>
        </div>

        <div className="flex items-center">
          <div className="relative h-24 w-24">
            {/* Simplified illustration - in a real app, you'd use an actual SVG or image */}
            <div className="absolute inset-0 flex items-center justify-center opacity-80">
              <svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M50 80C65.4 80 78 67.4 78 52C78 36.6 65.4 24 50 24C34.6 24 22 36.6 22 52C22 67.4 34.6 80 50 80Z"
                  fill="#8B5CF6"
                  fillOpacity="0.2"
                />
                <path
                  d="M65 45C65 56 55 65 50 65C45 65 35 56 35 45C35 34 45 30 50 30C55 30 65 34 65 45Z"
                  fill="#EDE9FE"
                />
                <path
                  d="M60 50C60 58 56 64 50 64C44 64 40 58 40 50C40 42 44 38 50 38C56 38 60 42 60 50Z"
                  fill="#8B5CF6"
                />
              </svg>
            </div>
          </div>

          <ChevronRight className="h-6 w-6 text-gray-400" />
        </div>
      </div>
    </div>
  )
}
