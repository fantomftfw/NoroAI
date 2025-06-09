import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { updateTaskSchema } from '@/app/schemas/task.schema'
import { TaskService } from '@/app/services/task.service'
import { SupabaseTaskRepository } from '@/app/repositories/supabase/task.repository'

export async function PATCH(request: Request) {
  try {

    const body = await request.json()
    const result = updateTaskSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const taskRepository = new SupabaseTaskRepository(supabase)
    const taskService = new TaskService(taskRepository)

    const { data, error } = await taskService.updateTask(result.data)

    if (error) {
      if (error.message === 'Task not found') {
        return NextResponse.json({ message: 'Task not found' }, { status: 404 })
      }

      return NextResponse.json({ message: 'Failed to update task' }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: 'Task updated successfully',
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
