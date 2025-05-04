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
 * /api/update-task:
 *   patch:
 *     summary: Update an existing task with optional fields
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
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
 *               subtasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     order:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [pending, completed]
 *     responses:
 *       200:
 *         description: Task updated successfully
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
 *                     updated_at:
 *                       type: string
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */

import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { updateTaskSchema } from "@/app/schemas/task.schema";
import { TaskService } from "@/app/services/task.service";
import { SupabaseTaskRepository } from "@/app/repositories/supabase/task.repository";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const result = updateTaskSchema.safeParse(body);

        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            return NextResponse.json({ error: 'Authorization header missing or malformed' }, { status: 401 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser(token);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        if (!result.success) {
            return NextResponse.json(
                { errors: result.error.issues },
                { status: 400 }
            );
        }

        const taskRepository = new SupabaseTaskRepository(supabase);
        const taskService = new TaskService(taskRepository);

        const { data, error } = await taskService.updateTask(result.data);

        if (error) {
            if (error.message === 'Task not found') {
                return NextResponse.json(
                    { message: "Task not found" },
                    { status: 404 }
                );
            }

            console.debug("Error updating task:", error);
            return NextResponse.json(
                { message: "Failed to update task" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Task updated successfully",
            data,
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
