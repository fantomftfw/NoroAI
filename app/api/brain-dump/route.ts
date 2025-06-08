import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { BRAIN_DUMP_SYSTEM_PROMPT_2 } from '@/app/api/prompts/agent-sys-prompt'
import { auth } from '@clerk/nextjs/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const userInputSchema = z.object({
  userTasks: z.string(),
  currentDateTime: z
    .string()
    .datetime({ message: 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)' })
    .optional() // IF NO TIME PROVIDED THEN IT IS SOMEDAY TASK
    .nullable(),
  tags: z.array(z.string()).optional(),
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
    const response = await openai.responses.create({
      model: 'gpt-4.1-nano',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: BRAIN_DUMP_SYSTEM_PROMPT_2,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Users task is ${body.userTasks} and current time  is ${body.currentDateTime} and tags are ${body.tags} `,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'text',
        },
      },
      reasoning: {},
      tools: [],
      temperature: 1,
      max_output_tokens: 2048,
      top_p: 1,
      store: true,
    })

    const cleaned = response.output_text.replace(/^json\s*/i, '')
    const parsedData = JSON.parse(cleaned)

    console.log('parsedData = ', parsedData)

    return NextResponse.json({ success: true, task: parsedData })
  } catch (error) {
    console.error('Error processing task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
