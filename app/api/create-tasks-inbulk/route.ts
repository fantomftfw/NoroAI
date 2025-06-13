import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createTaskSchema } from '@/app/schemas/task.schema'
import { TaskService } from '@/app/services/task.service'
import { SupabaseTaskRepository } from '@/app/repositories/supabase/task.repository'
import { z } from 'zod'

// Define schema for the array of tasks
const createTasksSchema = z.array(createTaskSchema).min(1, 'At least one task is required')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = createTasksSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const taskRepository = new SupabaseTaskRepository(supabase)
    const taskService = new TaskService(taskRepository)

    const tasks = result.data
    const results = []
    const errors = []

    // Process each task sequentially to maintain order
    for (const task of tasks) {
      console.log("task ", {...task, isVoiceDump: true})
      const { data, error } = await taskService.createTask({...task, isVoiceDump: true})
      
      if (error) {
        console.error('Error creating task:', error)
        errors.push({
          task,
          error: error.message || 'Failed to create task'
        })
      } else if (data) {
        results.push(data)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          message: `Failed to create ${errors.length} of ${tasks.length} tasks`,
          results,
          errors,
          success: results.length
        },
        { status: 207 } // Multi-status response
      )
    }

    return NextResponse.json(
      {
        message: `${results.length} tasks created successfully`,
        data: results,
        success: results.length
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating tasks:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
