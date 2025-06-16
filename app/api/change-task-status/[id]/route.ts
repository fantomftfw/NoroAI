import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const changeStatusSchema = z.object({
  isCompleted: z.boolean(),
})

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id
    const body = await request.json()
    const validation = changeStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.issues }, { status: 400 })
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
        userId: userId,
      },
      data: {
        isCompleted: validation.data.isCompleted,
        completedAt: validation.data.isCompleted ? new Date().toISOString() : null,
      },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error(`Error changing task status for ${params.id}:`, error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
} 