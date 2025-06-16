import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const updateTaskSchema = z.object({
  title: z.string().optional(),
  type: z.string().optional(),
  tag: z.string().optional(),
  startUTCTimestamp: z.string().datetime().optional().nullable(),
  spiciness: z.number().optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().optional(),
  totalEstimatedTime: z.number().optional(),
  note: z.string().optional(),
  goalDifficulty: z.string().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().datetime().optional().nullable(),
  completedAt: z.string().optional(),
})

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id
    const body = await request.json()
    const validation = updateTaskSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.issues }, { status: 400 })
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
        userId: userId, // Ensure user can only update their own tasks
      },
      data: validation.data,
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error(`Error updating task ${params.id}:`, error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
} 