'use client'

import React from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { AppHeader } from '../components/header/AppHeader'
import { TasksSection } from '../components/tasks/TasksSection'
import { TaskCard } from '../components/tasks/TaskCard'
import { ReviewDayCard } from '../components/tasks/ReviewDayCard'
import { FloatingActionButton } from '../components/ui/FloatingActionButton'
import { QuickActionsBar } from '../components/ui/QuickActionsBar'
import { BottomNavBar } from '../components/navigation/BottomNavBar'

export default function TasksPage() {
  // Sample tasks data - in a real app, this would come from a database or API
  const plannedTasks = [
    {
      id: 1,
      title: '30 m focus time',
      status: 'paused' as const,
      statusText: 'Paused',
      icon: 'timer' as const,
    },
    {
      id: 2,
      title: 'Market my product',
      status: 'paused' as const,
      statusText: 'Paused',
      icon: 'checkmark' as const,
    },
    { id: 3, title: 'Test', status: 'active' as const, statusText: '17:27', icon: 'test' as const },
  ]

  const anytimeTasks = [
    {
      id: 4,
      title: 'Longpress this task',
      status: 'active' as const,
      statusText: '5m',
      icon: 'timer' as const,
    },
    {
      id: 5,
      title: 'Click on checkmark to complete task',
      status: 'active' as const,
      statusText: '5m',
      icon: 'checkmark' as const,
    },
  ]

  return (
    <MainLayout>
      <AppHeader date={new Date()} />

      <div className="pb-20">
        <TasksSection title="PLANNED" count={plannedTasks.length}>
          {plannedTasks.map((task) => (
            <TaskCard
              key={task.id}
              title={task.title}
              status={task.status}
              statusText={task.statusText}
              icon={task.icon}
            />
          ))}
        </TasksSection>

        <TasksSection title="ANYTIME" count={anytimeTasks.length}>
          {anytimeTasks.map((task) => (
            <TaskCard
              key={task.id}
              title={task.title}
              status={task.status}
              statusText={task.statusText}
              icon={task.icon}
            />
          ))}
        </TasksSection>

        <ReviewDayCard />
      </div>

      <FloatingActionButton />
      <QuickActionsBar />
      <BottomNavBar />
    </MainLayout>
  )
}
