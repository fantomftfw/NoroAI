import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Task, Subtask } from "@/types/database.types";
import { ITaskRepository } from '../interfaces/task.repository';
import { TaskInput, TaskUpdateInput } from '@/app/schemas/task.schema';
import { TaskResponse, TaskUpdateResponse } from '@/app/types/api.types';


export class SupabaseTaskRepository implements ITaskRepository {
    constructor(private supabase: SupabaseClient<Database>, private token?: string) { }

    async createTask(data: TaskInput): Promise<TaskResponse> {
        try {
            const { data: { user }, error: userError } = await this.supabase.auth.getUser(this.token);

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

    private async reorderSubtasks(
        taskId: string,
        existingSubtasks: Subtask[],
        updatedSubtasks: TaskUpdateInput['subtasks']
    ) {
        console.log("🚀 ~ SupabaseTaskRepository ~ updatedSubtasks:", updatedSubtasks)
        console.log("🚀 ~ SupabaseTaskRepository ~ existingSubtasks:", existingSubtasks)
        console.log("🚀 ~ SupabaseTaskRepository ~ taskId:", taskId)



        if (!updatedSubtasks) return;

        // Create a map of existing subtasks for easy lookup
        const existingSubtasksMap = new Map(existingSubtasks.map(st => [st.id, st]));

        // Create a map of updated subtasks for easy lookup
        const updatedSubtasksMap = new Map(updatedSubtasks.filter(st => st.id).map(st => [st.id!, st]));

        // Calculate the maximum order value
        let maxOrder = Math.max(...existingSubtasks.map(st => st.order), 0);

        // Process each subtask
        for (const subtask of updatedSubtasks) {
            if (subtask._delete && subtask.id) {
                // Delete the subtask
                await this.supabase
                    .from('sub-tasks')
                    .delete()
                    .eq('id', subtask.id);

                existingSubtasksMap.delete(subtask.id);
            } else if (subtask.id && existingSubtasksMap.has(subtask.id)) {
                // Update existing subtask
                const currentSubtask = existingSubtasksMap.get(subtask.id)!;
                const newOrder = subtask.order ?? currentSubtask.order;

                await this.supabase
                    .from('sub-tasks')
                    .update({
                        title: subtask.title ?? currentSubtask.title,
                        order: newOrder,
                        status: subtask.status ?? currentSubtask.status,
                    })
                    .eq('id', subtask.id);
            } else if (!subtask.id) {
                // Create new subtask with order at the end
                maxOrder++;
                await this.supabase
                    .from('sub-tasks')
                    .insert({
                        task_id: taskId,
                        title: subtask.title,
                        order: subtask.order ?? maxOrder,
                        status: subtask.status,
                    });
            }
        }

        // Reorder remaining subtasks that weren't in the update
        const remainingSubtasks = Array.from(existingSubtasksMap.values())
            .filter(st => !updatedSubtasksMap.has(st.id))
            .sort((a, b) => a.order - b.order);

        for (const subtask of remainingSubtasks) {
            maxOrder++;
            await this.supabase
                .from('sub-tasks')
                .update({ order: maxOrder })
                .eq('id', subtask.id);
        }
    }

    async updateTask(data: TaskUpdateInput): Promise<TaskUpdateResponse> {

        console.log("data to update - inside update task  ", data)
        try {
            // First, fetch all existing subtasks to handle reordering properly
            const { data: existingSubtasks, error: fetchExistingSubtaskError } = await this.supabase
                .from('sub-tasks')
                .select('*')
                .eq('task_id', data.id)
                .order('order', { ascending: true });

            console.log("🚀 ~ SupabaseTaskRepository ~ updateTask ~ existingSubtasks:", existingSubtasks)
            if (fetchExistingSubtaskError) {
                return { data: null, error: fetchExistingSubtaskError };
            }

            // Update task - creating update object from info provided
            const updateData: Partial<Task> = {};
            if (data.task) updateData.task = data.task;
            if (data.category) updateData.category = data.category;
            if (data.type) updateData.type = data.type;
            if (data.startUTCTimestamp) updateData.startUTCTimestamp = data.startUTCTimestamp;
            if (data.endUTCTimestamp) updateData.endUTCTimestamp = data.endUTCTimestamp;
            if (data.spiciness) updateData.spiciness = data.spiciness;


            let updatedTask = undefined;
            if (Object.keys(updateData).length > 0) {
                console.log("🚀 ~ SupabaseTaskRepository ~ updateTask ~ updateData:", updateData)

                const { data: updatedTaskData, error: updateError } = await this.supabase
                    .from('tasks')
                    .update(updateData)
                    .eq('id', data.id)
                    .select()
                    .single();

                updatedTask = updatedTaskData

                if (updateError) {
                    return { data: null, error: updateError };
                }
            }

            // Handle subtasks reordering and updates
            if (data.subtasks) {
                await this.reorderSubtasks(data.id, existingSubtasks || [], data.subtasks);
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