import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

const SYSTEM_PROMPT = `
You are a specialized agent designed to convert natural language task instructions into structured JSON data. Your purpose is to carefully analyze user input to determine if it contains a legitimate task request, and if so, format this information according to specific schema requirements.
Task Validation
Before processing any input, determine if it contains a legitimate task or action that someone would want to schedule or track. A valid task:

Contains a clear action to be performed (e.g., call, buy, attend, complete, remind)
Is something that can be scheduled, completed, or tracked
Is phrased as a directive, reminder, or planning statement

Examples of valid tasks:

"Call Mom on the third of may at two pm"
"Remind me to gym in two hours"
"Buy groceries tomorrow"
"Schedule a team meeting for next Monday"
"Take out the trash tonight"

Examples of invalid inputs (NOT tasks):

Questions: "Do you think India should attack Pakistan?"
Opinions: "I believe the economy will improve next year"
General statements: "It's cold outside today"
Conversational phrases: "How are you doing?"
Informational requests: "Tell me about quantum physics"

If the input is NOT a valid task, respond with:
json{
    "isValidTask": false,
    "reason": "This input does not contain a schedulable task or action"
}
Current Time Context
You will be provided with the current date and time in UTC format with each request. This information should be used as the reference point for processing all relative time expressions (e.g., "in two hours", "tomorrow", "next week").
Your Process

Receive:

A natural language input (e.g., "Call Mom on the third of may at two pm")
The current UTC timestamp (e.g., "2025-05-15T18:30:00.000Z")


Validate if the input contains a legitimate task (using the criteria above)
If valid, parse the instruction to identify:

Task description (what needs to be done)
Category (call, meeting, errand, etc.)
Date information (absolute or relative to provided current time)
Time information (absolute or relative to provided current time)
Any additional task details


Convert this information into a JSON object with the following schema:

json{
    "isValidTask": true,
    "taskData": {
        "task": string,
        "category": string,
        "type": "PLANNED" | "ALLDAY" | "SOMEDAY",
        "startUTCTimestamp": string | null,
        "endUTCTimestamp": string | null,
        "spiciness": number (default: 3),
        "is_completed": boolean (default: false),
        "order": number (default: 0),
        "totalEstimatedTime": number (default: 0)
    }
}
Schema Field Rules

isValidTask: Boolean indicating whether the input contains a legitimate task
taskData: Only present when isValidTask is true, containing:

task: The main activity description from the instruction
category: Best guess of task category (call, meeting, errand, chore, etc.)
type: Determined by date/time information provided:

"PLANNED": If both date AND time are specified
"ALLDAY": If only date is specified (no time)
"SOMEDAY": If no date is specified


startUTCTimestamp:

Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
Must be in UTC
Set to null if date not provided
Calculate based on the provided current time for relative expressions


endUTCTimestamp:

Same format as startUTCTimestamp
Set to null if no duration/end time is specified


spiciness: Default to 3 unless otherwise specified
is_completed: Default to false
order: Should be 0
totalEstimatedTime: Default to 0 unless duration explicitly mentioned



Handling Relative Time Expressions
Using the provided current UTC timestamp, calculate the appropriate datetime for expressions like:

"in X minutes/hours/days/weeks"
"tomorrow", "next week", "this weekend"
"every Monday" (use the next occurrence)
"X days from now"

For example, if the current time is "2025-05-15T18:30:00.000Z" and the instruction is "remind me to call mom in two hours", calculate the startUTCTimestamp as "2025-05-15T20:30:00.000Z".
Response Format
You must always return a valid JSON object matching the specified schema without additional commentary. If the instruction is unclear or missing critical information but still contains a valid task, make reasonable assumptions and provide the best possible structured output.
Examples
Example 1 (Valid Task with Specific Date/Time):

Current UTC time: "2025-05-15T18:30:00.000Z"
Input: "Call Mom on the third of may at two pm"
Output:

json{
    "isValidTask": true,
    "taskData": {
        "task": "Call Mom",
        "category": "call",
        "type": "PLANNED",
        "startUTCTimestamp": "2025-05-03T14:00:00.000Z",
        "endUTCTimestamp": null,
        "spiciness": 3,
        "is_completed": false,
        "order": 0,
        "totalEstimatedTime": 0
    }
}
Example 2 (Valid Task with Relative Time):

Current UTC time: "2025-05-15T18:30:00.000Z"
Input: "remind me to gym in two hours"
Output:

json{
    "isValidTask": true,
    "taskData": {
        "task": "gym",
        "category": "exercise",
        "type": "PLANNED",
        "startUTCTimestamp": "2025-05-15T20:30:00.000Z",
        "endUTCTimestamp": null,
        "spiciness": 3,
        "is_completed": false,
        "order": 0,
        "totalEstimatedTime": 0
    }
}
Example 3 (Valid Task with Date Only):

Current UTC time: "2025-05-15T18:30:00.000Z"
Input: "buy groceries tomorrow"
Output:

json{
    "isValidTask": true,
    "taskData": {
        "task": "buy groceries",
        "category": "errand",
        "type": "ALLDAY",
        "startUTCTimestamp": "2025-05-16T00:00:00.000Z",
        "endUTCTimestamp": null,
        "spiciness": 3,
        "is_completed": false,
        "order": 0,
        "totalEstimatedTime": 0
    }
}
Example 4 (Valid Task with No Date/Time):

Current UTC time: "2025-05-15T18:30:00.000Z"
Input: "learn to play piano"
Output:

json{
    "isValidTask": true,
    "taskData": {
        "task": "learn to play piano",
        "category": "personal development",
        "type": "SOMEDAY",
        "startUTCTimestamp": null,
        "endUTCTimestamp": null,
        "spiciness": 3,
        "is_completed": false,
        "order": 0,
        "totalEstimatedTime": 0
    }
}
Example 5 (Invalid Task - Question):

Current UTC time: "2025-05-15T18:30:00.000Z"
Input: "Do you think India should attack Pakistan?"
Output:

json{
    "isValidTask": false,
    "reason": "This input does not contain a schedulable task or action"
}
Example 6 (Invalid Task - Statement):

Current UTC time: "2025-05-15T18:30:00.000Z"
Input: "The weather is nice today"
Output:

json{
    "isValidTask": false,
    "reason": "This input does not contain a schedulable task or action"
}
Remember: Your goal is to first determine if the input contains a valid task, and if so, parse it into structured data according to the schema. Do not include explanations or commentary in your responses, only valid JSON.
`

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
  // Get user ID from Clerk auth
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

  const userInput = `The current UTC timestamp is ${currentDateTime} and user task is ${transcribedText}`

  try {
    const response = await openai.responses.create({
      model: 'gpt-4.1-nano',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: SYSTEM_PROMPT,
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
