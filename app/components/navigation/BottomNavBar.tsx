import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckSquare, Calendar, Target, User } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  label: string
}

export function BottomNavBar() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { name: 'to-do', href: '/tasks', icon: <CheckSquare className="h-6 w-6" />, label: 'To-Do' },
    { name: 'plan', href: '/plan', icon: <Calendar className="h-6 w-6" />, label: 'Plan' },
    { name: 'focus', href: '/focus', icon: <Target className="h-6 w-6" />, label: 'Focus' },
    { name: 'me', href: '/profile', icon: <User className="h-6 w-6" />, label: 'Me' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 flex h-16 items-center justify-around border-t border-gray-800 bg-black px-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href

        return (
          <Link key={item.name} href={item.href} className="w-full">
            <div
              className={cn(
                'flex flex-col items-center',
                isActive ? 'text-white' : 'text-gray-500'
              )}
            >
              {item.icon}
              <span className="mt-1 text-xs">{item.label}</span>
              {isActive && <div className="mt-1 h-1 w-12 rounded-full bg-white" />}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
