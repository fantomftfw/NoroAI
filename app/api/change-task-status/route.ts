/**
 * @swagger
 * /api/change-task-status:
 *   patch:
 *     summary: Mark a task as completed or pending
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - isCompleted
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: The ID of the task to update.
 *               isCompleted:
 *                 type: boolean
 *                 description: The new status of the task.
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     isCompleted:
 *                       type: boolean
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod' // Assuming zod is used for schema validation
import { TaskService } from '@/app/services/task.service'
import { SupabaseTaskRepository } from '@/app/repositories/supabase/task.repository'

// Define a schema for the request body
const updateTaskStatusSchema = z.object({
  id: z.string().uuid('Invalid task ID format'),
  isCompleted: z.boolean(),
})

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const result = updateTaskStatusSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const taskRepository = new SupabaseTaskRepository(supabase)
    const taskService = new TaskService(taskRepository)

    const { data, error } = await taskService.updateTaskStatus(
      result.data.id,
      result.data.isCompleted
    )

    if (error) {
      if (error.message === 'Task not found') {
        return NextResponse.json({ message: 'Task not found' }, { status: 404 })
      }

      console.error('Error updating task status:', error)
      return NextResponse.json({ message: 'Failed to update task status' }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: 'Task status updated successfully',
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
