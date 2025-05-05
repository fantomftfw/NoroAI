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

import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { createTaskSchema } from "@/app/schemas/task.schema";
import { TaskService } from "@/app/services/task.service";
import { SupabaseTaskRepository } from "@/app/repositories/supabase/task.repository";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = createTaskSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { errors: result.error.issues },
                { status: 400 }
            );
        }


        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            return NextResponse.json({ error: 'Authorization header missing or malformed' }, { status: 401 });
        }

        const supabase = await createClient();

        const taskRepository = new SupabaseTaskRepository(supabase, token);
        const taskService = new TaskService(taskRepository);

        const { data, error } = await taskService.createTask(result.data);

        if (error) {
            console.log("Error creating task:", JSON.stringify(error, null, 2));
            return NextResponse.json(
                { message: "Failed to create task and subtasks" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Task created successfully",
            data,
        }, { status: 200 });

    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}