import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id

    await prisma.task.delete({
      where: {
        id: taskId,
        userId: userId, // Ensure user can only delete their own tasks
      },
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error(`Error deleting task ${params.id}:`, error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
} 