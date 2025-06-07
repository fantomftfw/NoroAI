import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { taskReorderSchema } from '@/app/schemas/task.schema'
import { TaskService } from '@/app/services/task.service'
import { SupabaseTaskRepository } from '@/app/repositories/supabase/task.repository'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const result = taskReorderSchema.safeParse(body)
    console.log("🚀 ~ PATCH ~ result: &&&&&&& ", JSON.stringify(result,null,2))

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const taskRepository = new SupabaseTaskRepository(supabase)
    const taskService = new TaskService(taskRepository)

    const { data, error } = await taskService.rearrangeTasks(result.data)
    
    if (error) {
      console.log('Error creating task:', error)
      return NextResponse.json({ message: 'Failed to rearrange tasks' }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: 'Task rearranged successfully',
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}