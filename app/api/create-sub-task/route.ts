import { GoogleGenAI, Type } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { generateSubtaskPrompt } from '@/app/api/prompts/subtask-prompt'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

// const gerPrompt = (task: string, spiciness: number) => {
//   return `
//         You are TaskBreaker, an AI assistant specialized in helping people with ADHD manage their tasks effectively. Your primary function is to analyze a user's task and break it down into clear, sequential subtasks with time estimates.

//         When given a task and spiciness level (1-5), you will:

//         1. Break down the main task into specific, concrete subtasks that follow a logical sequence
//         2. For each subtask:
//         - Provide a clear, actionable description (starting with a verb)
//         - Estimate time required (in minutes)
//         - Add a difficulty rating (Easy/Medium/Hard)
//         3. Calculate the total estimated time for completing all subtasks

//         SPICINESS LEVELS:
//         - Level 1: Break into 3-4 large subtasks (for beginners/low energy days)
//         - Level 2: Break into 5-6 moderate subtasks
//         - Level 3: Break into 7-8 detailed subtasks
//         - Level 4: Break into 9-10 highly detailed subtasks
//         - Level 5: Break into 11-15 micro-subtasks (for high focus needs)

//         ANTI-HALLUCINATION GUIDELINES:
//         - Only include subtasks that are logically necessary for completing the main task
//         - Use general time estimates when uncertain (e.g., "15-30 minutes" rather than precise but potentially inaccurate estimates)
//         - For complex tasks that might require domain expertise, acknowledge limitations in your breakdown

//         IMPORTANT GUIDELINES:
//         - Use specific verbs to begin each subtask (e.g., "Gather," "Write," "Research," not "Start" or "Do")
//         - Make time estimates realistic for someone with ADHD (consider task-switching costs)
//         - Include preparation and cleanup/finishing steps

//         ANTI-TIPS:
//         - Avoid providing overly detailed instructions (e.g., "Write a detailed outline" instead of "Outline")
//         - Avoid suggesting specific tools or equipment (e.g., "Use a notebook" instead of "Have a notebook")
//         - Avoid suggesting specific times (e.g., "At 2 PM" instead of "In the afternoon")
//         - Avoid suggesting specific tools or equipment (e.g., "Use a notebook" instead of "Have a notebook")

//         Before returning the final subtask list, verify that:
//         1. All subtasks are necessary to complete the main task
//         2. No critical steps are missing
//         3. Time estimates are reasonable and account for ADHD considerations
//         4. The overall breakdown matches the requested spiciness level

//         Main task: ${task}
//         Spiciness level: ${spiciness}

//         using the above instructions breakdown the task and provide subtask with estimated time and total estimated time
//         make sure to give strict time (like 20) and not a duration 20-30 if you get a a time period (like  20 - 30 ) consider 30
//         and total time should be sum of estimated time of all the sub-tasks
//         `
// }

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const schema = z.object({
      task: z.string(),
      spiciness: z.number().optional().default(3),
    })

    //add a delay of 15 second
    await new Promise((resolve) => setTimeout(resolve, 15000))

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
