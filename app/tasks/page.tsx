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
  interface Task {
    id: string
    title: string
    status: string
    statusText: string
    icon: string
  }

  interface TaskState {
    planned: Task[]
    anytime: Task[]
  }

  const [tasks, setTasks] = React.useState<TaskState>({
    planned: [],
    anytime: [],
  })

  React.useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/get-tasks?includeSubtasks=false')

        if (!response.ok) {
          throw new Error('Failed to fetch tasks')
        }

        const data = await response.json()

        // Separate tasks into planned and anytime
        const planned = data.data
          .filter((item: { task: { type: string } }) => item.task.type === 'planned')
          .map((item: { task: { id: string; task: string } }) => ({
            id: item.task.id,
            title: item.task.task,
            status: 'active',
            statusText: '5m',
            icon: 'checkmark',
          }))

        const anytime = data.data
          .filter((item: { task: { type: string } }) => item.task.type === 'anytime')
          .map((item: { task: { id: string; task: string } }) => ({
            id: item.task.id,
            title: item.task.task,
            status: 'active',
            statusText: '5m', // You may want to calculate this based on actual data
            icon: 'checkmark',
          }))

        setTasks({
          planned,
          anytime,
        })
      } catch (error) {
        console.error('Error fetching tasks:', error)
      }
    }

    fetchTasks()
  }, [])

  // Replace the hardcoded tasks with the fetched data
  const plannedTasks = tasks.planned
  const anytimeTasks = tasks.anytime

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
