import { z } from "zod";
import { TaskStatus } from "@/types/taskStatus";

// Base schema for task validation
export const taskBaseSchema = z.object({
    task: z.string(),
    category: z.string(),
    type: z.enum(['planned', 'anytime']),
    startUTCTimestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Invalid ISO 8601 date format startUTCTimestamp (YYYY-MM-DD)",
    }),
    endUTCTimestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Invalid ISO 8601 date format endUTCTimestamp (YYYY-MM-DD)",
    }),
    spiciness: z.number().optional().default(3),
});

// Schema for creating a new task
export const createTaskSchema = taskBaseSchema.extend({
    subtasks: z.array(
        z.object({
            title: z.string(),
            order: z.number(),
            status: z.enum([TaskStatus.pending, TaskStatus.completed]),
        })
    ).optional(),
});

// Schema for updating an existing task
export const updateTaskSchema = taskBaseSchema.partial().extend({
    id: z.string().uuid(),
    subtasks: z.array(
        z.object({
            id: z.string().uuid().optional(),
            title: z.string().optional(),
            order: z.number().optional(),
            status: z.enum([TaskStatus.pending, TaskStatus.completed]).optional(),
            _delete: z.boolean().optional(),
        })
    ).optional(),
});

// Type exports
export type TaskInput = z.infer<typeof createTaskSchema>;
export type TaskUpdateInput = z.infer<typeof updateTaskSchema>; 