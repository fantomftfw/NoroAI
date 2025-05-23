/**
 * @swagger
 * /api/change-subtask-status:
 *   patch:
 *     summary: Mark a subtask as completed or pending
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
 *                 description: The ID of the subtask to update.
 *               isCompleted:
 *                 type: boolean
 *                 description: The new status of the subtask.
 *     responses:
 *       200:
 *         description: Subtask status updated successfully
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
 *                     status:
 *                       type: string
 *                       description: The new status of the subtask ('completed' or 'pending').
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Subtask not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

import { SupabaseTaskRepository } from '@/app/repositories/supabase/task.repository'

// Define a schema for the request body
const updateSubtaskStatusSchema = z.object({
  id: z.string().uuid('Invalid subtask ID format'),
  isCompleted: z.boolean(),
})

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const result = updateSubtaskStatusSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ errors: result.error.issues }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const taskRepository = new SupabaseTaskRepository(supabase)

    const { data, error } = await taskRepository.updateSubtaskStatus(
      result.data.id,
      result.data.isCompleted
    )

    if (error) {
      if (error.message === 'Subtask not found') {
        return NextResponse.json({ message: 'Subtask not found' }, { status: 404 })
      }

      console.error('Error updating subtask status:', error)
      return NextResponse.json({ message: 'Failed to update subtask status' }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: 'Subtask status updated successfully',
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating subtask status:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
