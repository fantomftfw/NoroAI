import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Task, Subtask } from '@/types/database.types'
import { ITaskRepository } from '../interfaces/task.repository'
import { TaskInput, TaskReorderInput, TaskUpdateInput } from '@/app/schemas/task.schema'
import { TaskResponse, TaskUpdateResponse } from '@/app/types/api.types'
import { auth } from '@clerk/nextjs/server'

export class SupabaseTaskRepository implements ITaskRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async createTask({ subtasks: incomingSubtask, ...taskData }: TaskInput): Promise<TaskResponse> {
    try {
      const { userId } = await auth()

      const date = taskData.startUTCTimestamp?.split('T')[0]
      const startDate = date + 'T00:00:00Z'
      const endDate = date + 'T23:59:59Z'

      if (taskData.type !== 'someday' && !date) {
        throw new Error('Date is required for allday and planned tasks')
        // this error is being thrown but not being handled
      }

      /*
       *  todo : add the test on type and date relation
       *   use factory pattern
       *
       */

      // Calculate the order based on task type and existing tasks
      const { data: existingTasks, error: fetchError } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('startUTCTimestamp', startDate)
        .lte('startUTCTimestamp', endDate)
        .order('order', { ascending: true })

      if (fetchError) {
        return { data: null, error: fetchError }
      }

      let newOrder = 0

      // shift the order of existing tasks if needed
      if (existingTasks && existingTasks.length > 0) {
        if (taskData.type === 'allday') {
          // For all-day tasks, find the last all-day task or place at the beginning
          const lastAllDayTask = existingTasks.filter((t) => t.type === 'allday').pop()
          newOrder = lastAllDayTask ? lastAllDayTask.order + 1 : 0

          // Shift planned tasks down
          await Promise.all(
            existingTasks
              .filter((t) => t.type !== 'allday' && t.order >= newOrder)
              .map((t) =>
                this.supabase
                  .from('tasks')
                  .update({ order: t.order + 1 })
                  .eq('id', t.id)
              )
          )
        } else if (taskData.type === 'planned' && taskData.startUTCTimestamp) {
          // For planned tasks, insert based on timestamp

          const insertIndex = existingTasks.findIndex(
            (t) =>
              t.type === 'planned' &&
              t.startUTCTimestamp &&
              t.startUTCTimestamp > taskData.startUTCTimestamp!
          )

          if (insertIndex === -1) {
            // Add to the end if no later tasks found
            newOrder = existingTasks.length
          } else {
            newOrder = insertIndex
            // Shift later tasks down
            await Promise.all(
              existingTasks.slice(insertIndex).map((t) =>
                this.supabase
                  .from('tasks')
                  .update({ order: t.order + 1 })
                  .eq('id', t.id)
              )
            )
          }
        } else {
          // For tasks without timestamp, add to the end
          if (taskData.type === 'someday') {
            newOrder = 0
          }
        }
      }

      // Insert the new task after changing the order of existing tasks
      const { data: task, error: taskError } = await this.supabase
        .from('tasks')
        .insert([
          {
            ...taskData,
            user_id: userId,
            order: newOrder
          },
        ])
        .select()
        .single()

      if (taskError) {
        return { data: null, error: taskError }
      }

      const subtasksSaved: Subtask[] = []
      if (incomingSubtask && incomingSubtask.length > 0) {
        const { data: subtaskData, error: subtaskError } = await this.supabase
          .from('sub-tasks')
          .insert(
            incomingSubtask.map((subtask) => ({
              task_id: task.id,
              title: subtask.title,
              order: subtask.order,
              isCompleted: subtask.isCompleted || false,
              estimatedTime: subtask.estimatedTime,
            }))
          )
          .select()

        if (subtaskError) {
          return { data: null, error: subtaskError }
        }

        subtasksSaved.push(...(subtaskData as Subtask[]))
      }

      return {
        data: {
          ...task,
          subtasks: subtasksSaved,
        },
        error: null,
      }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async rearrangeTasks(
    tasks: TaskReorderInput
  ): Promise<{ data: Task[]; error: null } | { data: null; error: Error }> {
    const { userId } = await auth()

    if (!userId) {
      throw new Error('User not found')
    }

    try {
      const updatePromises = tasks.map(({ id, order }) =>
        this.supabase
          .from('tasks')
          .update({ order: order })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
      )

      // Execute all updates in a transaction
      const results = await Promise.all(updatePromises)

      // Check for any errors in the results
      const hasError = results.some(({ error }) => error)
      if (hasError) {
        return { data: null, error: new Error('Failed to update task orders') }
      }

      // Fetch the updated tasks to return
      return { data: results.flatMap(({ data }) => data || []), error: null }
    } catch (error) {
      console.error('Error rearranging task:', error)
      return { data: null, error: error as Error }
    }
  }

  async updateTask({ id,subtasks, deleteSubtasksIds ,...data }: TaskUpdateInput): Promise<TaskUpdateResponse> {
    try {
      const { data: updatedTaskData, error: updateError } = await this.supabase
        .from('tasks')
        .update(data)
        .eq('id', id)
        .select() // to get the updated value
        .single()  // get the object

        if (updateError || !updatedTaskData) {
          throw new Error(updateError?.message ?? 'Failed to update task');
        }
  
        // delete existing tasks
         const deleteSubtaskOps = deleteSubtasksIds?.map((id:string) =>
              this.supabase.from('sub-tasks').delete().eq('id', id).select()
            ) ?? []

        // update the  subtasks
        const updateSubtaskOps = subtasks?.map((update) =>
              this.supabase.from('sub-tasks').upsert(update ,{onConflict:'id'}).select().single()
            ) ?? []


        const results = await Promise.allSettled([...deleteSubtaskOps, ...updateSubtaskOps])
  
        const errors = results.filter((r) => r.status === 'rejected')
        if (errors.length) throw new Error('updates failed')


          const updatedSubtasks = results
          .slice(deleteSubtaskOps.length) // only upserts have result data so remove the delete ops
          .map((r) => {
            if (r.status === 'fulfilled') {
             return r.value.data
            } 
          })
          
          return {
            data: { ...updatedTaskData, subtasks: updatedSubtasks },
            error: null,
          };
          
        
      } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
    const { data, error } = await this.supabase.from('tasks').select('*').eq('id', id).single()

    if (error) return null
    return data
  }

  async getSubtasksByTaskId(taskId: string): Promise<Subtask[]> {
    const { data, error } = await this.supabase
      .from('sub-tasks')
      .select('*')
      .eq('task_id', taskId)
      .order('order', { ascending: true })

    if (error) return []
    return data
  }

  async deleteTask(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('tasks').delete().eq('id', id)
    return !error
  }

  async updateTaskStatus(id: string, isCompleted: boolean): Promise<TaskUpdateResponse> {
    try {
      const { data, error } = await this.supabase
        .from('tasks')
        .update({ isCompleted: isCompleted, completedAt: isCompleted ? new Date().toISOString() : '' })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error }
      }

      if (!data) {
        return { data: null, error: new Error('Task not found') }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
  async updateSubtaskStatus(
    id: string,
    isCompleted: boolean
  ): Promise<{ data: Subtask | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('sub-tasks')
        .update({ isCompleted: isCompleted })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error }
      }

      if (!data) {
        return { data: null, error: new Error('Subtask not found') }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}
