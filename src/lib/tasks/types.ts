export const TASK_STATUSES = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]['value']

export type Task = {
  id: string
  title: string
  description: string
  status: TaskStatus
}

/** フォームやクライアントから受け取る未検証の入力 */
export type TaskInput = {
  title?: unknown
  description?: unknown
  status?: unknown
}

/** 検証済みの入力 */
export type ValidTaskInput = Omit<Task, 'id'>

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.some((status) => status.value === value)
}

/** DB の行をアプリで扱う Task に変換する */
export function toTask(row: {
  id: string
  title: string
  description: string
  status: string
}): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: isTaskStatus(row.status) ? row.status : 'todo',
  }
}
