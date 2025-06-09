import { z } from 'zod'
import { TASK_TYPE, TASK_DIFFICULTY } from '@/utils/constants'

// Base schema for task validation
export const taskBaseSchema = z.object({
  title: z.string(),
  type: z.enum([TASK_TYPE.PLANNED, TASK_TYPE.ALLDAY, TASK_TYPE.SOMEDAY]).optional(),
  tag: z.string().optional(),
  startUTCTimestamp: z
    .string()
    .datetime({ message: 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)' })
    .optional()
    .nullable(),
  spiciness: z.number().optional().default(3),
  isCompleted: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
  totalEstimatedTime: z.number().optional().default(0),
  note: z.string().optional().default(''),
  goalDifficulty: z
    .enum([TASK_DIFFICULTY.EASY, TASK_DIFFICULTY.MEDIUM, TASK_DIFFICULTY.HARD])
    .optional()
    .default(TASK_DIFFICULTY.MEDIUM),
  reminderEnabled: z.boolean().default(false),
  reminderTime: z.string().optional().default(''),
})

// Schema for creating a new task
export const createTaskSchema = taskBaseSchema.extend({
  subtasks: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        title: z.string(),
        order: z.number(),
        task_id: z.string().uuid(),
        isCompleted: z.boolean().optional().default(false),
        estimatedTime: z.number().default(0),
      })
    )
    .optional(),
})

// Schema for updating an existing task
export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
  deleteSubtasksIds: z.array(z.string().uuid()).optional(),
})

export const taskReorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    order: z.number(),
  })
)

// Schema for deleting a task
export const deleteTaskSchema = z.object({
  id: z.string().uuid(),
})

// Type exports
export type TaskInput = z.infer<typeof createTaskSchema>
export type TaskUpdateInput = z.infer<typeof updateTaskSchema>
export type TaskReorderInput = z.infer<typeof taskReorderSchema>
