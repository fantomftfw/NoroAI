import { NextResponse } from 'next/server'
// import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createTaskSchema } from '@/app/schemas/task.schema'
// import { TaskService } from '@/app/services/task.service'
// import { SupabaseTaskRepository } from '@/app/repositories/supabase/task.repository'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = createTaskSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 })
    }

    const { subtasks, ...taskData } = result.data

    const createdTask = await prisma.task.create({
      data: {
        ...taskData,
        userId: userId,
        // Prisma expects dates as ISO strings or Date objects, which Zod provides.
        // The rest of the fields should map directly.
      },
    })

    // The Supabase implementation did not seem to handle subtasks, so we will omit it for now
    // to maintain equivalent functionality. If subtasks need to be created, that would be an addition.

    /*
    const supabase = await createServerSupabaseClient()
    const taskRepository = new SupabaseTaskRepository(supabase)
    const taskService = new TaskService(taskRepository)

    const { data, error } = await taskService.createTask(result.data)
    
    if (error) {
      console.log('Error creating task:', error)
      return NextResponse.json({ message: 'Failed to create task and subtasks' }, { status: 500 })
    }
    */

    return NextResponse.json(
      {
        message: 'Task created successfully',
        data: createdTask,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
