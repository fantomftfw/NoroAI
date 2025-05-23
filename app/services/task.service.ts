import { ITaskRepository } from '@/app/repositories/interfaces/task.repository'
import { TaskInput, TaskUpdateInput } from '@/app/schemas/task.schema'
import { TaskResponse, TaskUpdateResponse } from '@/app/types/api.types'

export class TaskService {
  constructor(private taskRepository: ITaskRepository) {}

  async createTask(data: TaskInput): Promise<TaskResponse> {
    return this.taskRepository.createTask(data)
  }

  async updateTask(data: TaskUpdateInput): Promise<TaskUpdateResponse> {
    // Validate task exists
    const existingTask = await this.taskRepository.getTaskById(data.id)
    if (!existingTask) {
      return {
        data: null,
        error: new Error('Task not found'),
      }
    }

    return this.taskRepository.updateTask(data)
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.taskRepository.deleteTask(id)
  }

  async updateTaskStatus(id: string, isCompleted: boolean): Promise<TaskUpdateResponse> {
    return this.taskRepository.updateTaskStatus(id, isCompleted)
  }
}
