import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Task, Subtask } from "@/types/database.types";
import { ITaskRepository } from '../interfaces/task.repository';
import { TaskInput, TaskUpdateInput } from '@/app/schemas/task.schema';
import { TaskResponse, TaskUpdateResponse } from '@/app/types/api.types';

export class SupabaseTaskRepository implements ITaskRepository {
    constructor(private supabase: SupabaseClient<Database>) { }

    async createTask(data: TaskInput): Promise<TaskResponse> {
        try {
            const { data: { user }, error: userError } = await this.supabase.auth.getUser();

            if (userError) {
                return { data: null, error: userError };
            }

            if (!user) {
                return { data: null, error: new Error('User not authenticated') };
            }

            const { data: task, error: taskError } = await this.supabase
                .from('tasks')
                .insert([
                    {
                        task: data.task,
                        category: data.category,
                        type: data.type,
                        startUTCTimestamp: data.startUTCTimestamp,
                        endUTCTimestamp: data.endUTCTimestamp,
                        spiciness: data.spiciness,
                        user_id: user.id,
                    },
                ])
                .select()
                .single();

            if (taskError) {
                return { data: null, error: taskError };
            }

            const subtasks: Subtask[] = [];
            if (data.subtasks && data.subtasks.length > 0) {
                const { data: subtaskData, error: subtaskError } = await this.supabase
                    .from('sub-tasks')
                    .insert(
                        data.subtasks.map((subtask) => ({
                            task_id: task.id,
                            title: subtask.title,
                            order: subtask.order,
                            status: subtask.status,
                        }))
                    )
                    .select();

                if (subtaskError) {
                    return { data: null, error: subtaskError };
                }

                subtasks.push(...(subtaskData as Subtask[]));
            }

            return {
                data: {
                    tasks: [task],
                    subtasks,
                },
                error: null,
            };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    async updateTask(data: TaskUpdateInput): Promise<TaskUpdateResponse> {
        try {
            // First, fetch all existing subtasks to handle reordering properly
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { data: existingSubtasks, error: fetchExistingSubtaskError } = await this.supabase
                .from('sub-tasks')
                .select('*')
                .eq('task_id', data.id)
                .order('order', { ascending: true });

            if (fetchExistingSubtaskError) {
                return { data: null, error: fetchExistingSubtaskError };
            }

            // Update task
            const updateData: Partial<Task> = {};
            if (data.task) updateData.task = data.task;
            if (data.category) updateData.category = data.category;
            if (data.type) updateData.type = data.type;
            if (data.startUTCTimestamp) updateData.startUTCTimestamp = data.startUTCTimestamp;
            if (data.endUTCTimestamp) updateData.endUTCTimestamp = data.endUTCTimestamp;
            if (data.spiciness) updateData.spiciness = data.spiciness;

            const { data: updatedTask, error: updateError } = await this.supabase
                .from('tasks')
                .update(updateData)
                .eq('id', data.id)
                .select()
                .single();

            if (updateError) {
                return { data: null, error: updateError };
            }

            // Handle subtasks if provided
            if (data.subtasks && data.subtasks.length > 0) {
                for (const subtask of data.subtasks) {
                    if (subtask._delete && subtask.id) {
                        await this.supabase
                            .from('sub-tasks')
                            .delete()
                            .eq('id', subtask.id);
                    } else if (subtask.id) {
                        // Update existing subtask
                        await this.supabase
                            .from('sub-tasks')
                            .update({
                                title: subtask.title,
                                order: subtask.order,
                                status: subtask.status,
                            })
                            .eq('id', subtask.id);
                    } else {
                        // Create new subtask
                        await this.supabase
                            .from('sub-tasks')
                            .insert({
                                task_id: data.id,
                                title: subtask.title,
                                order: subtask.order,
                                status: subtask.status,
                            });
                    }
                }
            }

            return { data: updatedTask, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    async getTaskById(id: string): Promise<Task | null> {
        const { data, error } = await this.supabase
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    }

    async getSubtasksByTaskId(taskId: string): Promise<Subtask[]> {
        const { data, error } = await this.supabase
            .from('sub-tasks')
            .select('*')
            .eq('task_id', taskId)
            .order('order', { ascending: true });

        if (error) return [];
        return data;
    }

    async deleteTask(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        return !error;
    }
} 