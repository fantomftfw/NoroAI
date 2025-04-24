import React from 'react'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="relative mx-auto w-full max-w-md flex-1 pb-16">{children}</main>
    </div>
  )
}
