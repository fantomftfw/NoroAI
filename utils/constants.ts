export const TASK_TYPE = {
  SOMEDAY: 'someday',
  ALLDAY: 'allday',
  PLANNED: 'planned',
} as const

export type TaskType = (typeof TASK_TYPE)[keyof typeof TASK_TYPE]

export const TASK_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const

export type TaskDifficulty = (typeof TASK_DIFFICULTY)[keyof typeof TASK_DIFFICULTY]
