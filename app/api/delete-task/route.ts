import { NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { deleteTaskSchema } from "@/app/schemas/task.schema";
import { TaskService } from "@/app/services/task.service";
import { SupabaseTaskRepository } from "@/app/repositories/supabase/task.repository";

export async function DELETE(request) {
    try {
        const body = await request.json();
        const result = deleteTaskSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { errors: result.error.issues },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();
        const taskRepository = new SupabaseTaskRepository(supabase);
        const taskService = new TaskService(taskRepository);

        const success = await taskService.deleteTask(result.data.id);

        if (!success) {
            return NextResponse.json(
                { message: "Task not found or failed to delete" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Task deleted successfully",
        }, { status: 200 });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
