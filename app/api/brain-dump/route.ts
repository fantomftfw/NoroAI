import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { NEW_BRAIN_DUMP_PROMPT } from '@/app/api/prompts/new-brain-dump-prompt'
import { auth } from '@clerk/nextjs/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

const userInputSchema = z.object({
  userTasks: z.string(),
  currentDateTime: z
    .string()
    .datetime({ message: 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)' })
    .optional() // IF NO TIME PROVIDED THEN IT IS SOMEDAY TASK
    .nullable(),
  tags: z.array(z.string()).optional(),
  temperature: z.number().min(0).max(2).optional().default(1),
})

// async function transcribeAudio(audioFile: File): Promise<string> {
//   const formData = new FormData()
//   formData.append('file', audioFile)
//   formData.append('model', 'whisper-1')

//   const response = await openai.audio.transcriptions.create({
//     file: audioFile,
//     model: 'whisper-1',
//     language: 'en',
//     prompt: 'Please transcribe the following audio into text.',
//   })

//   console.log('response AUDIo  = ', response)

//   return response.text
// }

// Initialize Supabase client
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const userInputValidationResult = userInputSchema.safeParse(body)

  if (!userInputValidationResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid task data received from AI',
        details: userInputValidationResult.error.errors,
      },
      { status: 500 }
    )
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-05-20',
      systemInstruction: NEW_BRAIN_DUMP_PROMPT,
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Users task is ${body.userTasks} and current time  is ${body.currentDateTime} and tags are ${body.tags} `,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: userInputValidationResult.data.temperature,
        responseMimeType: 'application/json',
      },
    })

    const response = result.response
    const text = response.text()
    const parsedData = JSON.parse(text)

    console.log('parsedData = ', parsedData)

    return NextResponse.json({ success: true, task: parsedData })
  } catch (error) {
    console.error('Error processing task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
