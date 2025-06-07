import { Task, Subtask } from '@/types/database.types'

import { TaskInput, TaskUpdateInput,TaskReorderInput } from '@/app/schemas/task.schema'
import { TaskResponse, TaskUpdateResponse } from '@/app/types/api.types'

export interface ITaskRepository {
  createTask(data: TaskInput): Promise<TaskResponse>
  updateTask(data: TaskUpdateInput): Promise<TaskUpdateResponse>
  getTaskById(id: string): Promise<Task | null>
  getSubtasksByTaskId(taskId: string): Promise<Subtask[]>
  deleteTask(id: string): Promise<boolean>
  updateTaskStatus(id: string, isCompleted: boolean): Promise<TaskUpdateResponse>
  rearrangeTasks(tasks: TaskReorderInput): Promise<{ data: Task[]; error: null } | { data: null; error: Error }>
}
