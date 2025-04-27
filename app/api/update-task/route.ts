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

import { z } from "zod";
import { TaskStatus } from "../../../types/taskStatus";
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, Task } from "@/types/database.types";

// Define the schema for updating a task where all fields are optional except for id
const updateTaskSchema = z.object({
    id: z.string().uuid(),
    task: z.string().optional(),
    category: z.string().optional(),
    type: z.enum(['planned', 'anytime']).optional().default('planned'),
    startUTCTimestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Invalid ISO 8601 date format startUTCTimestamp (YYYY-MM-DD)",
    }).optional(),
    endUTCTimestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Invalid ISO 8601 date format endUTCTimestamp (YYYY-MM-DD)",
    }).optional(),
    spiciness: z.number().optional(),
    subtasks: z.array(
        z.object({
            id: z.string().uuid().optional(), // For existing subtasks
            title: z.string().optional(),
            order: z.number().optional(),
            status: z.enum([TaskStatus.pending, TaskStatus.completed]).optional(),
            _delete: z.boolean().optional(), // To mark subtasks for deletion
        })
    ).optional(),
});

// Define the task input type based on the schema
type TaskUpdateInput = z.infer<typeof updateTaskSchema>;

// Define the return type for the function
interface TaskUpdateResponse {
    data: Task | null;
    error: Error | null;
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const result = updateTaskSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { errors: result.error.issues },
                { status: 400 }
            );
        }

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

        const { data: taskData, error: taskError } = await updateTask(supabase, data);

        if (taskError) {
            console.debug("Error updating task:", taskError);
            return NextResponse.json(
                { message: "Failed to update task" },
                { status: 500 }
            );
        }

        if (!taskData) {
            return NextResponse.json(
                { message: "Task not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Task updated successfully",
            data: taskData,
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

// Function to update a task and its subtasks
async function updateTask(
    supabase: SupabaseClient<Database>,
    data: TaskUpdateInput
): Promise<TaskUpdateResponse> {
    try {
        // First, fetch all existing subtasks to handle reordering properly
        const { data: existingSubtasks, error: fetchExistingSubtaskError } = await supabase
            .from('sub-tasks')
            .select('*')
            .eq('task_id', data.id)
            .order('order', { ascending: true });

        if (fetchExistingSubtaskError) {
            console.error("Error fetching existing subtasks:", fetchExistingSubtaskError);
            return { data: null, error: fetchExistingSubtaskError };
        }

        // Create a map of existing subtask IDs for easy lookup
        const existingSubtaskMap = new Map();
        existingSubtasks.forEach(subtask => {
            existingSubtaskMap.set(subtask.id, subtask);
        });

        // Track which subtasks to delete
        const subtasksToDelete = new Set<string>();
        const markedForDeletion = new Set<string>();

        // Track new and updated subtasks for reordering
        const updatedSubtasks: { id?: string; order: number; title?: string; status?: string; task_id: string }[] = [];

        // Create an object with only the fields that need to be updated
        const updateData: Record<string, unknown> = {};

        if (data.task !== undefined) updateData.task = data.task;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.startUTCTimestamp !== undefined) updateData.startUTCTimestamp = data.startUTCTimestamp;
        if (data.endUTCTimestamp !== undefined) updateData.endUTCTimestamp = data.endUTCTimestamp;
        if (data.spiciness !== undefined) updateData.spiciness = data.spiciness;

        // Only proceed with task update if there are fields to update
        if (Object.keys(updateData).length > 0) {
            // Update the task
            const { data: taskData, error: taskError } = await supabase
                .from('tasks')
                .update(updateData)
                .eq('id', data.id)
                .select();

            if (taskError) {
                console.error("Error updating task:", taskError);
                return { data: null, error: taskError };
            }

            if (taskData.length === 0) {
                return { data: null, error: new Error("Task not found") };
            }

            console.debug("Task updated:", taskData);
        }

        // Handle subtasks updates if provided
        if (data.subtasks && data.subtasks.length > 0) {
            // Process each subtask
            for (const subtask of data.subtasks) {
                if (subtask._delete && subtask.id) {
                    // Mark subtask for deletion
                    markedForDeletion.add(subtask.id);
                } else if (subtask.id) {
                    // This is an existing subtask being updated
                    if (!existingSubtaskMap.has(subtask.id)) {
                        console.error(`Subtask with ID ${subtask.id} not found`);
                        continue;
                    }

                    const existingSubtask = existingSubtaskMap.get(subtask.id);
                    const updatedSubtask = {
                        id: subtask.id,
                        task_id: data.id,
                        title: subtask.title !== undefined ? subtask.title : existingSubtask.title,
                        order: subtask.order !== undefined ? subtask.order : existingSubtask.order,
                        status: subtask.status !== undefined ? subtask.status : existingSubtask.status
                    };

                    updatedSubtasks.push(updatedSubtask);
                } else {
                    // This is a new subtask being added
                    updatedSubtasks.push({
                        task_id: data.id,
                        title: subtask.title || 'New Subtask',
                        order: subtask.order !== undefined ? subtask.order : existingSubtasks.length,
                        status: subtask.status || TaskStatus.pending
                    });
                }
            }
        }

        // Sort subtasks by order to fix any inconsistencies
        updatedSubtasks.sort((a, b) => a.order - b.order);

        // Reassign orders to ensure they are sequential and don't have duplicates
        updatedSubtasks.forEach((subtask, index) => {
            subtask.order = index;
        });

        // Process deletions
        const idsToDelete = [...Array.from(markedForDeletion), ...Array.from(subtasksToDelete)];
        if (idsToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('sub-tasks')
                .delete()
                .in('id', idsToDelete);
        }

        // Process updates for existing subtasks
        const existingSubtasksToUpdate = updatedSubtasks.filter(subtask => subtask.id);
        for (const subtask of existingSubtasksToUpdate) {
            const { id, ...updateFields } = subtask;
            await supabase
                .from('sub-tasks')
                .update(updateFields)
                .eq('id', id!);
        }

        // Process new subtasks
        const newSubtasks = updatedSubtasks.filter(subtask => !subtask.id);
        if (newSubtasks.length > 0) {
            await supabase
                .from('sub-tasks')
                .insert(newSubtasks);
        }

        // Fetch the updated task with its subtasks
        const { data: updatedTaskData, error: fetchError } = await supabase
            .from('tasks')
            .select(`
                *,
                "sub-tasks" (*)
            `)
            .eq('id', data.id)
            .single();

        if (fetchError) {
            console.error("Error fetching updated task:", fetchError);
            return { data: null, error: fetchError };
        }

        return { data: updatedTaskData, error: null };
    } catch (error) {
        console.error("Error in updateTask function:", error);
        return { data: null, error: error as Error };
    }
}
