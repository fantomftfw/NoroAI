import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { zodTextFormat } from 'openai/helpers/zod'
import OpenAI from 'openai'

import { generateSubtaskPrompt } from '@/app/api/prompts/subtask-prompt'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const schema = z.object({
      task: z.string(),
      spiciness: z.number().optional().default(3),
    })

    const { task, spiciness } = schema.parse(body)

    if (!task) {
      return NextResponse.json({ error: 'Task is required' }, { status: 400 })
    }

    const responseSchema = z.object({
      task: z.string().describe('The main task name'),
      totalEstimatedTime: z.number().describe('estimated time of main task'),
      tag: z.string().describe('tag of main task'),
      subtasks: z
        .array(
          z
            .object({
              title: z.string().describe('title of sub task'),
              estimatedTime: z.number().describe('estimated time of sub task'),
            })
            .describe('sub task of main task')
        )
        .describe('sub tasks of main task'),
    })

    const response = await openai.responses.create({
      model: 'gpt-4.1-nano',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: generateSubtaskPrompt(task, +spiciness),
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(responseSchema, 'event'),
      },
      temperature: 0.3,
      top_p: 0.3,
      max_output_tokens: 2048,
      store: true,
    })

    const parsedResponseText = JSON.parse(response.output_text || '{}')

    return NextResponse.json({ result: parsedResponseText }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('Schema validation error:', (error as z.ZodError).errors)
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as z.ZodError).errors },
        { status: 400 }
      )
    }
    console.error('Error calling Gemini API:', error)
    return NextResponse.json({ error: 'Failed to process the request' }, { status: 500 })
  }
}
