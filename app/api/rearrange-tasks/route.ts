import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const rearrangeSchema = z.array(
  z.object({
    id: z.string(),
    order: z.number(),
  })
)

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = rearrangeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.issues }, { status: 400 })
    }

    const updates = validation.data.map((task) =>
      prisma.task.update({
        where: {
          id: task.id,
          userId: userId,
        },
        data: {
          order: task.order,
        },
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({ message: 'Tasks rearranged successfully' })
  } catch (error) {
    console.error('Error rearranging tasks:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}