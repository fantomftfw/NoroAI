import { NextResponse } from 'next/server'
import { z } from 'zod'
// import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

const registerDeviceSchema = z.object({
  fcm_token: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = registerDeviceSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.issues }, { status: 400 })
    }

    const { fcm_token } = validation.data
    // const supabase = await createServerSupabaseClient()

    // Upsert logic: Check if the token already exists for the user.
    const existingDevice = await prisma.userDevice.findFirst({
      where: {
        userId: userId,
        fcmToken: fcm_token,
      },
    })

    if (!existingDevice) {
      await prisma.userDevice.create({
        data: {
          userId: userId,
          fcmToken: fcm_token,
        },
      })
    }

    /*
    const { error } = await supabase
      .from('user_devices')
      .upsert({ user_id: userId, fcm_token }, { onConflict: 'user_id,fcm_token' })

    if (error) {
      console.error('Error registering device:', error)
      return NextResponse.json({ message: 'Failed to register device' }, { status: 500 })
    }
    */

    return NextResponse.json({ message: 'Device registered successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in register-device endpoint:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
} 