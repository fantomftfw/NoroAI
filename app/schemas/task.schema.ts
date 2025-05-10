import { z } from "zod";
import { TASK_STATUS } from "@/utils/constants";
import { TASK_TYPE } from "@/utils/constants";

// Base schema for task validation
export const taskBaseSchema = z.object({
    task: z.string(),
    category: z.string(),
    type: z.enum([TASK_TYPE.PLANNED, TASK_TYPE.ALLDAY, TASK_TYPE.SOMEDAY]),
    startUTCTimestamp: z.string().datetime({ message: "Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)" })
        .optional()
        .nullable(),
    endUTCTimestamp: z.string().datetime({ message: "Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)" })
        .optional()
        .nullable(),
    spiciness: z.number().optional().default(3),
    is_completed: z.boolean().optional().default(false)
});

// Schema for creating a new task
export const createTaskSchema = taskBaseSchema.extend({
    subtasks: z.array(
        z.object({
            title: z.string(),
            order: z.number(),
            status: z.enum([TASK_STATUS.PENDING, TASK_STATUS.COMPLETED]),
        })
    ).optional(),
});

// Schema for updating an existing task
export const updateTaskSchema = taskBaseSchema.partial().extend({
    id: z.string().uuid(),
    status: z.enum([TASK_STATUS.PENDING, TASK_STATUS.COMPLETED]).optional(),
    subtasks: z.array(
        z.object({
            id: z.string().uuid().optional(),
            title: z.string().optional(),
            order: z.number().optional(),
            status: z.enum([TASK_STATUS.PENDING, TASK_STATUS.COMPLETED]).optional(),
            _delete: z.boolean().optional().default(false),
        })
    ).optional(),
});

// Schema for deleting a task
export const deleteTaskSchema = z.object({
    id: z.string().uuid(),
});

// Type exports
export type TaskInput = z.infer<typeof createTaskSchema>;
export type TaskUpdateInput = z.infer<typeof updateTaskSchema>; 