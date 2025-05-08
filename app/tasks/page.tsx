'use client'

import React, { useEffect } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { AppHeader } from '../components/header/AppHeader'
import { TasksSection } from '../components/tasks/TasksSection'
import { TaskCard } from '../components/tasks/TaskCard'
import { ReviewDayCard } from '../components/tasks/ReviewDayCard'
import { FloatingActionButton } from '../components/ui/FloatingActionButton'
import { QuickActionsBar } from '../components/ui/QuickActionsBar'
import { BottomNavBar } from '../components/navigation/BottomNavBar'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
} from '../../components/ui/drawer'
import { useForm, Controller } from 'react-hook-form'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { useApi } from '@/hooks/use-api'

export default function TasksPage() {
  const { data, error, callApi } = useApi(
    '/api/get-tasks?includeSubtasks=false',
    { key: 'value' },
    { method: 'GET' }
  )

  if (error) {
    throw new Error(error.message)
  }

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

  const [drawerOpen, setDrawerOpen] = useState(false)
  interface Subtask {
    id: string
    title: string
    order: number
    status: string
  }
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [subtaskInput, setSubtaskInput] = useState('')

  interface FormData {
    title: string
    type: 'planned' | 'anytime'
    category: string
    start: string
    startTime: string
    end: string
    endTime: string
    repeat: string
  }

  useEffect(() => {
    callApi()
  }, [])

  useEffect(() => {
    const userTasks = data?.data
    if (userTasks) {
      // Separate tasks into planned and anytime
      const planned = userTasks
        .filter((item: { task: { type: string } }) => item.task.type === 'planned')
        .map((item: { task: { id: string; task: string } }) => ({
          id: item.task.id,
          title: item.task.task,
          status: 'active',
          statusText: '5m',
          icon: 'checkmark',
        }))

      const anytime = userTasks
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
    }
  }, [data])

  // Replace the hardcoded tasks with the fetched data
  const plannedTasks = tasks.planned
  const anytimeTasks = tasks.anytime

  // Drawer form logic
  const { control, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      title: '',
      type: 'planned',
      category: 'Visuals',
      start: '',
      startTime: '',
      end: '',
      endTime: '',
      repeat: 'None',
    },
  })

  // Add subtask
  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtasks([
        ...subtasks,
        {
          id: Date.now().toString(),
          title: subtaskInput,
          order: subtasks.length,
          status: 'pending',
        },
      ])
      setSubtaskInput('')
    }
  }

  // Drag-and-drop handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    if (active.id !== over.id) {
      const oldIndex = subtasks.findIndex((t) => t.id === active.id)
      const newIndex = subtasks.findIndex((t) => t.id === over.id)
      setSubtasks(arrayMove(subtasks, oldIndex, newIndex))
    }
  }

  // Save task
  const onSave = (data: FormData) => {
    // Convert date/time to UTC ISO
    const startDate = new Date(`${data.start}T${data.startTime}:00Z`).toISOString()
    const endDate = new Date(`${data.end}T${data.endTime}:00Z`).toISOString()
    const newTask = {
      id: Date.now().toString(),
      title: data.title,
      status: 'active',
      statusText: '0m',
      icon: 'checkmark',
      type: data.type,
      category: data.category,
      start: startDate,
      end: endDate,
      repeat: data.repeat,
      subtasks,
    }
    setTasks((prev) => ({
      ...prev,
      [data.type as keyof TaskState]: [...prev[data.type as keyof TaskState], newTask],
    }))
    setDrawerOpen(false)
    reset()
    setSubtasks([])
  }

  // Cancel drawer
  const onCancel = () => {
    setDrawerOpen(false)
    reset()
    setSubtasks([])
  }

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

      <FloatingActionButton onClick={() => setDrawerOpen(true)} />
      <QuickActionsBar />
      <BottomNavBar />

      {/* Drawer for adding task */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="mx-auto max-w-md rounded-t-2xl bg-[#181818] text-white">
          <DrawerHeader>
            <DrawerTitle>Add New Task</DrawerTitle>
          </DrawerHeader>
          <form onSubmit={handleSubmit(onSave)} className="px-4 pb-4">
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  placeholder="Task Title"
                  className="mb-3 w-full rounded-lg bg-[#222] p-3 text-lg font-semibold"
                  required
                />
              )}
            />
            <div className="mb-3 flex gap-2">
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <select {...field} className="flex-1 rounded-lg bg-[#222] p-3">
                    <option value="Visuals">Visuals</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                  </select>
                )}
              />
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <select {...field} className="flex-1 rounded-lg bg-[#222] p-3">
                    <option value="planned">Planned</option>
                    <option value="anytime">Anytime</option>
                  </select>
                )}
              />
            </div>
            <div className="mb-3 flex gap-2">
              <Controller
                name="start"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="date"
                    className="flex-1 rounded-lg bg-[#222] p-3"
                    required
                  />
                )}
              />
              <Controller
                name="startTime"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="time"
                    className="flex-1 rounded-lg bg-[#222] p-3"
                    required
                  />
                )}
              />
            </div>
            <div className="mb-3 flex gap-2">
              <Controller
                name="end"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="date"
                    className="flex-1 rounded-lg bg-[#222] p-3"
                    required
                  />
                )}
              />
              <Controller
                name="endTime"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="time"
                    className="flex-1 rounded-lg bg-[#222] p-3"
                    required
                  />
                )}
              />
            </div>
            <Controller
              name="repeat"
              control={control}
              render={({ field }) => (
                <select {...field} className="mb-3 w-full rounded-lg bg-[#222] p-3">
                  <option value="None">None</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                </select>
              )}
            />
            {/* Subtasks */}
            <div className="mb-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">Sub-tasks</span>
                <button type="button" onClick={handleAddSubtask} className="text-purple-400">
                  Add
                </button>
              </div>
              <div className="mb-2 flex gap-2">
                <input
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="Sub-task title"
                  className="flex-1 rounded-lg bg-[#222] p-2"
                />
              </div>
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={subtasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="mb-2 flex items-center rounded-lg bg-[#222] p-2"
                    >
                      <span className="mr-2 cursor-move">≡</span>
                      <span className="flex-1">{subtask.title}</span>
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            <DrawerFooter>
              <button
                type="button"
                onClick={onCancel}
                className="mb-2 w-full rounded-lg bg-[#333] py-3 font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full rounded-lg bg-purple-500 py-3 font-semibold text-white"
              >
                Save
              </button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </MainLayout>
  )
}
