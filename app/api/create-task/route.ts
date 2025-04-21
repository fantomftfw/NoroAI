/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         task:
 *           type: string
 *         category:
 *           type: string
 *         type:
 *           type: string
 *           enum: [planned, anytime]
 *         startUTCTimestamp:
 *           type: string
 *           format: date
 *         endUTCTimestamp:
 *           type: string
 *           format: date
 *         spiciness:
 *           type: number
 *         user_id:
 *           type: string
 *           format: uuid
 *         created_at:
 *           type: string
 *           format: date-time
 *     Subtask:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         task_id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         order:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, completed]
 *         created_at:
 *           type: string
 *           format: date-time
 * 
 * @swagger
 * /api/create-task:
 *   post:
 *     summary: Create a new task with optional subtasks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task
 *               - category
 *               - type
 *               - startUTCTimestamp
 *               - endUTCTimestamp
 *             properties:
 *               task:
 *                 type: string
 *               category:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [planned, anytime]
 *               startUTCTimestamp:
 *                 type: string
 *                 format: date
 *               endUTCTimestamp:
 *                 type: string
 *                 format: date
 *               spiciness:
 *                 type: number
 *                 default: 3
 *               subtasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     order:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [pending, completed]
 *     responses:
 *       200:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     task:
 *                       type: string
 *                     category:
 *                       type: string
 *                     type:
 *                       type: string
 *                     startUTCTimestamp:
 *                       type: string
 *                     endUTCTimestamp:
 *                       type: string
 *                     spiciness:
 *                       type: number
 *                     user_id:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                     subtasks:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         task_id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         order:
 *                           type: number
 *                         status:
 *                           type: string
 *                         created_at:
 *                           type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */

import { z } from "zod";
import { TaskStatus } from "../../../types/taskStatus";
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, Task, Subtask } from "@/types/database.types";


const schema = z.object({
    task: z.string(),
    category: z.string(),
    type: z.enum(['planned', 'anytime']),
    startUTCTimestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Invalid ISO 8601 date format  startUTCTimestamp (YYYY-MM-DD)",
    }),
    endUTCTimestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Invalid ISO 8601 date format  endUTCTimestamp (YYYY-MM-DD)",
    }),
    spiciness: z.number().optional().default(3),
    subtasks: z.array(
        z.object({
            title: z.string(),
            order: z.number(),
            status: z.enum([TaskStatus.pending, TaskStatus.completed]),
        })
    ).optional(),
});

// Define the task input type based on the schema
type TaskInput = z.infer<typeof schema>;

// Define the return type for the function
interface TaskResponse {
    data: {
        tasks: Task[];
        subtasks: Subtask[];
    } | null;
    error: Error | null;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { errors: result.error.issues },
                { status: 400 }
            );
        }

        // Convert date values to UTC
        const data = result.data;


        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
            console.error("Supabase URL or Key not configured.");
            return NextResponse.json(
                { message: "Supabase not configured" },
                { status: 500 }
            );
        }
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: taskData, error: taskError } = await createTaskAndSubtasks(supabase, data);

        if (taskError) {
            console.debug("Error creating task:", taskError);
            return NextResponse.json(
                { message: "Failed to create task and subtasks" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Task created successfully",
            data: [taskData],
        }, { status: 200 });

    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}


// create a function to create a task and subtasks
async function createTaskAndSubtasks(
    supabase: SupabaseClient<Database>,
    data: TaskInput
): Promise<TaskResponse> {

    const user_id = crypto.randomUUID()
    try {
        const { data: taskData, error: taskError } = await supabase
            .from('tasks')
            .insert([
                {
                    task: data.task,
                    category: data.category,
                    type: data.type,
                    startUTCTimestamp: data.startUTCTimestamp,
                    endUTCTimestamp: data.endUTCTimestamp,
                    spiciness: data.spiciness,
                    user_id// Generating random UUID for user
                },
            ])
            .select();

        if (taskError) {
            console.error("Error inserting data:", taskError);
            return { data: null, error: taskError };
        }

        console.debug("Task created:", taskData);

        if (!data.subtasks?.length) {  //
            return { data: { tasks: taskData, subtasks: [] }, error: null };
        }

        const { data: subtaskData, error: subtaskError } = await supabase
            .from('sub-tasks')
            .insert(data.subtasks.map((subtask) => ({
                task_id: taskData[0].id,
                title: subtask.title,
                order: subtask.order,
                status: subtask.status,
            })))
            .select();

        if (subtaskError) {
            console.error("Error inserting data:", subtaskError);
            return { data: null, error: subtaskError };
        }

        return {
            data: {
                ...taskData[0],
                subtasks: { ...subtaskData[0] }
            },
            error: null
        };
    } catch (error) {
        console.error("Error creating task:", error);
        return { data: null, error: error as Error };
    }
}