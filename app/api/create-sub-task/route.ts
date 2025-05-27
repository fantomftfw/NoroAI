import { GoogleGenAI, Type } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { generateSubtaskPrompt } from '@/app/api/prompts/subtask-prompt'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

/**
 * @swagger
 * /api/create-sub-task:
 *   post:
 *     summary: Create subtasks for a main task
 *     description: Breaks down a main task into manageable subtasks using AI, with customizable complexity (spiciness) level
 *     tags:
 *       - Create Subtask With AI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task
 *             properties:
 *               task:
 *                 type: string
 *                 description: The main task to break down into subtasks
 *               spiciness:
 *                 type: number
 *                 description: Complexity level of subtask breakdown (1-5)
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 3
 *     responses:
 *       200:
 *         description: Successfully generated subtasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   type: string
 *                   description: The original main task
 *                 subtasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         description: Title of the subtask
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const schema = z.object({
      task: z.string(),
      spiciness: z.number().optional().default(3),
    })

    //add a delay of 11 second
    await new Promise((resolve) => setTimeout(resolve, 11000))

    const { task, spiciness } = schema.parse(body)

    if (!task) {
      return NextResponse.json({ error: 'Task is required' }, { status: 400 })
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: generateSubtaskPrompt(task, +spiciness),
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            task: {
              type: Type.STRING,
              description: 'The main task name',
              nullable: false,
            },
            totalEstimatedTime: {
              type: Type.NUMBER,
              description: 'estimated time of main task',
              nullable: false,
            },
            tag: {
              type: Type.STRING,
              description: 'tag of main task',
              nullable: false,
            },
            subtasks: {
              type: Type.ARRAY,
              description: 'sub tasks of main task',
              nullable: false,
              items: {
                type: Type.OBJECT,
                description: 'sub task of main task',
                nullable: false,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'title of sub task',
                    nullable: false,
                  },
                  estimatedTime: {
                    type: Type.NUMBER,
                    description: 'estimated time of sub task',
                    nullable: false,
                  },
                },
              },
            },
          },
          required: ['task', 'totalEstimatedTime', 'subtasks'],
        },
      },
    })

    console.log('🚀 ~ POST ~ response:', JSON.stringify(response, null, 2))

    const parsedResponseText = JSON.parse(response.text || '{}')

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
