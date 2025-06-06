

import { NextRequest, NextResponse } from 'next/server'
import { Task, Subtask } from '@/types/database.types'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all'
    const includeSubtasks = searchParams.get('includeSubtasks') === 'true' || false
    const startDate = searchParams.get('startDate')
    const { userId } = await auth()

    const supabase = await createServerSupabaseClient()

    let query = supabase.from('tasks').select('*').eq('user_id', userId)

    if (type !== 'all') {
      query = query.eq('type', type)
    }

    // Apply startDate filter if provided
    if (startDate) {
      // Filter tasks where startUTCTimestamp is on the given date (UTC)
      const startOfDay = `${startDate}T00:00:00Z`
      const endOfDay = `${startDate}T23:59:59Z`
      query = query.gte('startUTCTimestamp', startOfDay).lte('startUTCTimestamp', endOfDay)
    }

    // Execute the query
    const { data: tasks, error: tasksError } = await query.order('order', { ascending: true })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json({ message: 'Error fetching tasks' }, { status: 500 })
    }

    let response: { task: Task; subtasks?: Subtask[] }[] = []

    // If subtasks are requested, fetch them
    if (includeSubtasks && tasks && tasks.length > 0) {
      const taskIds = tasks.map((task) => task.id)

      const { data: subtasks, error: subtasksError } = await supabase
        .from('sub-tasks')
        .select('*')
        .in('task_id', taskIds)
        .order('order', { ascending: true })

      if (subtasksError) {
        console.error('Error fetching subtasks:', subtasksError)
        return NextResponse.json({ message: 'Error fetching subtasks' }, { status: 500 })
      }

      // Group subtasks by task_id
      const subtasksByTaskId = subtasks.reduce(
        (acc, subtask) => {
          if (!acc[subtask.task_id]) {
            acc[subtask.task_id] = []
          }
          acc[subtask.task_id].push(subtask)
          return acc
        },
        {} as Record<string, Subtask[]>
      )

      // Create response with tasks and their subtasks
      response = tasks.map((task) => ({
        ...task,
        subtasks: subtasksByTaskId[task.id] || [],
      }))
    } else {
      // Create response with just tasks
      response = tasks.map((task) => ({ task }))
    }

    return NextResponse.json(
      {
        data: response,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
