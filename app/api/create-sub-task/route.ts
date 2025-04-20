import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';




const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });



const gerPrompt = (task: string, spiciness: number) => {

    return `

    You are an AI task manager designed to assist users with ADHD by breaking down tasks into manageable subtasks. 
    The user will provide a main task and a spiciness level s, where s is a number between 1 and 5 . 
    Your role is to generate a list of subtasks based on the spiciness level. 
    
    Instructions:

    Ensure each subtask is a clear, actionable step that is easy to understand and execute.
    Arrange the subtasks in a logical order to complete the main task, if applicable.
    Tailor the breakdown to the nature of the task, ensuring the subtasks remain meaningful and relevant.


    Main task: ${task}
    Spiciness level: ${spiciness}
    
`
};





export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const schema = z.object({
            task: z.string(),
            spiciness: z.number().optional().default(3),
        });

        const { task, spiciness } = schema.parse(body);


        if (!task) {
            return NextResponse.json(
                { error: 'Task is required' },
                { status: 400 }
            );
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: gerPrompt(task, spiciness), // Pass spiciness here
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
                                    }
                                }
                            },


                        }
                    },
                    required: ['task', 'subtasks'],
                },
            }
        })

        const parsedResponseText = JSON.parse(response.text || '{}');

        return NextResponse.json(
            { result: parsedResponseText },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            console.error('Schema validation error:', (error as z.ZodError).errors);
            return NextResponse.json(
                { error: 'Invalid request data', details: (error as z.ZodError).errors },
                { status: 400 }
            );
        }
        console.error('Error calling Gemini API:', error);
        return NextResponse.json(
            { error: 'Failed to process the request' },
            { status: 500 }
        );
    }
} 
