import { NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

import { SupabaseTaskRepository } from "@/app/repositories/supabase/task.repository";

// Define a schema for the request body
const rearrangeTasks = z.object({
    tasks: z.array(z.string().uuid("Invalid task ID format"))
});

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const result = rearrangeTasks.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { errors: result.error.issues },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();

        const taskRepository = new SupabaseTaskRepository(supabase);

        const { data, error } = await taskRepository.rearrangeTasks(result.data.tasks);

        if (error) {
            if (error.message === 'Subtask not found') {
                return NextResponse.json(
                    { message: "Subtask not found" },
                    { status: 404 }
                );
            }

            console.error("Error updating subtask status:", error);
            return NextResponse.json(
                { message: "Failed to update subtask status" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Subtask status updated successfully",
            data,
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating subtask status:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}