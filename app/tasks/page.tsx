'use client'

import React, { useEffect, useState } from 'react'
import { useApi } from '@/hooks/use-api'
import { TaskUpdateInput } from '../schemas/task.schema'
import { RecordingDialog } from '@/components/recording-dialog'

const TaskPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const {
    data: tasks,
    loading,
    error,
    callApi,
  } = useApi('/api/get-tasks', null, {
    params: {
      includeSubtasks: true,
      type: 'all',
    },
  })

  useEffect(() => {
    callApi()
  }, [callApi])

  if (loading) {
    return <div className="min-h-screen bg-black p-4 text-white">Loading tasks...</div>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-4 text-white">
        Error loading tasks: {error.message}
      </div>
    )
  }

  if (!tasks?.length) {
    return <div className="min-h-screen bg-black p-4 text-white">No tasks found.</div>
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <RecordingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center">
          {/* Avatar Placeholder */}
          <div className="mr-3 h-10 w-10 rounded-full bg-gray-700"></div>
          <div>
            <h1 className="flex items-center text-xl font-bold">
              Thursday{' '}
              <span className="ml-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </h1>
            <p className="text-sm text-gray-400">May 15</p>
          </div>
        </div>
        <div className="flex items-center">
          {/* Calendar Icon Placeholder */}
          <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          {/* Filter Icon Placeholder */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2"
              />
            </svg>
          </div>
        </div>
      </header>

      {/* Today's Goals */}
      <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold">Today&apos;s goals ({tasks?.length})</h2>
        <div className="space-y-3">
          {tasks?.map((task: TaskUpdateInput) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg bg-gray-800 p-4"
            >
              <div>
                <p className="text-white">{task.title}</p>
              </div>
              {/* Checkbox Placeholder */}
              <div
                className={`h-6 w-6 rounded-full border-2 ${task.isCompleted ? 'border-purple-500 bg-purple-500' : 'border-gray-500'}`}
              >
                {task.isCompleted && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-6 flex flex-col items-center space-y-4">
        <div
          id="recording-btn"
          onClick={() => setIsDialogOpen(true)}
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-purple-600 shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 11H5m14 0a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>{' '}
          {/* Placeholder Microphone Icon */}
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>{' '}
          {/* Placeholder Plus Icon */}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 flex h-16 items-center justify-around bg-gray-900">
        <div className="flex flex-col items-center text-purple-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l7 7M19 10v10a1 1 0 01-1 1h-3m-6 0a1 1 0 01-1-1v-4a1 1 0 00-1-1h-2a1 1 0 00-1 1v4a1 1 0 01-1 1m-6 0h16"
            />
          </svg>{' '}
          {/* Placeholder Home Icon */}
          <span className="text-xs">Home</span>
        </div>
        <div className="flex flex-col items-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>{' '}
          {/* Placeholder Focus Icon */}
          <span className="text-xs">Focus</span>
        </div>
        <div className="flex flex-col items-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>{' '}
          {/* Placeholder Discover Icon */}
          <span className="text-xs">Discover</span>
        </div>
      </div>
    </div>
  )
}

export default TaskPage
