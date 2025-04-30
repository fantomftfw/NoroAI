import { Task, Subtask } from "@/types/database.types";

export interface ApiResponse<T> {
    message: string;
    data?: T;
    errors?: Error[];
}

export interface TaskResponse {
    data: {
        tasks: Task[];
        subtasks: Subtask[];
    } | null;
    error: Error | null;
}

export interface TaskUpdateResponse {
    data: Task | null;
    error: Error | null;
} 