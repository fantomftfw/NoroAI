

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createTaskSchema } from '@/app/schemas/task.schema'
import { TaskService } from '@/app/services/task.service'
import { SupabaseTaskRepository } from '@/app/repositories/supabase/task.repository'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = createTaskSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const taskRepository = new SupabaseTaskRepository(supabase)
    const taskService = new TaskService(taskRepository)

    const { data, error } = await taskService.createTask(result.data)
    
    if (error) {
      console.log('Error creating task:', error)
      return NextResponse.json({ message: 'Failed to create task and subtasks' }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: 'Task created successfully',
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
