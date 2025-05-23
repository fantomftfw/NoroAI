import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { AGENT_SYSTEM_PROMPT_1 } from '@/app/api/prompts/agent-sys-prompt'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const userInputSchema = z.object({
  audio: z.instanceof(File),
  currentDateTime: z
    .string()
    .datetime({ message: 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)' })
    .optional() // IF NO TIME PROVIDED THEN IT IS SOMEDAY TASK
    .nullable(),
})

async function transcribeAudio(audioFile: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', audioFile)
  formData.append('model', 'whisper-1')

  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    prompt: 'Please transcribe the following audio into text.',
  })

  console.log('response AUDIo  = ', response)

  return response.text
}

// Initialize Supabase client
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const audio = formData.get('audio') as File
  const currentDateTime = formData.get('currentDateTime') as string

  const userInputValidationResult = userInputSchema.safeParse({ audio, currentDateTime })

  if (!userInputValidationResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid task data received from AI',
        details: userInputValidationResult.error.errors,
      },
      { status: 500 }
    )
  }

  // Transcribe the audio to text using Whisper API
  const transcribedText = await transcribeAudio(audio)

  const userInput = `The current UTC timestamp is ${currentDateTime} and user task is "${transcribedText}"`

  try {
    const response = await openai.responses.create({
      model: 'gpt-4.1-nano',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: AGENT_SYSTEM_PROMPT_1,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: userInput,
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
    const { taskData } = JSON.parse(cleaned)

    const supabase = createServerSupabaseClient()

    //  Store the task in Supabase with user ID
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        user_id: userId,
      })
      .select()

    if (error) {
      console.error('Error storing task:', error)
      return NextResponse.json({ error: 'Failed to store task' }, { status: 500 })
    }

    return NextResponse.json({ success: true, task: data[0] })
  } catch (error) {
    console.error('Error processing task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
