import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  const serviceAccountString = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT!, 'base64').toString('utf-8')
  const serviceAccount = JSON.parse(serviceAccountString)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

export async function POST() {
  try {
    const now = new Date()
    // 1. Find all tasks with reminders that are due and haven't been sent
    const tasksToNotify = await prisma.task.findMany({
      where: {
        reminderTime: {
          lte: now,
        },
        reminderEnabled: true,
        reminderSent: false,
      },
    })

    if (tasksToNotify.length === 0) {
      console.log('No reminders to send.')
      return NextResponse.json({ message: 'No reminders to send.' })
    }

    console.log(`Found ${tasksToNotify.length} tasks to notify.`)
    const sentTasks = []

    for (const task of tasksToNotify) {
      // 2. Find the devices for the user of the task
      const devices = await prisma.userDevice.findMany({
        where: { userId: task.userId },
      })

      const tokens = devices.map((d: { fcmToken: string }) => d.fcmToken)
      if (tokens.length === 0) continue

      // 3. Send notification via FCM
      const message = {
        notification: {
          title: 'Task Reminder',
          body: `Your task "${task.title}" is due now.`,
        },
        tokens: tokens,
      }

      const response = await admin.messaging().sendEachForMulticast(message)
      console.log(`Successfully sent ${response.successCount} messages for task: ${task.id}`)

      // 4. Mark the reminder as sent in the database
      await prisma.task.update({
        where: { id: task.id },
        data: { reminderSent: true },
      })

      sentTasks.push(task.id)
    }

    return NextResponse.json({ success: true, sentCount: sentTasks.length, sentTaskIds: sentTasks })
  } catch (error) {
    console.error('Error sending reminders:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
} 