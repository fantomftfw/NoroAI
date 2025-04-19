import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');


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
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { task, spiciness = 3 } = body;

        if (!task) {
            return NextResponse.json(
                { error: 'Task is required' },
                { status: 400 }
            );
        }

        // Initialize the model
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Generate content
        const result = await model.generateContent(gerPrompt(task, spiciness));
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ response: text });
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return NextResponse.json(
            { error: 'Failed to process the request' },
            { status: 500 }
        );
    }
} 