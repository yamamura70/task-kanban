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
  /** 期限（`YYYY-MM-DD`）。未設定なら null */
  dueDate: string | null
}

/** フォームやクライアントから受け取る未検証の入力 */
export type TaskInput = {
  title?: unknown
  description?: unknown
  status?: unknown
  dueDate?: unknown
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
  due_date: string | null
}): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: isTaskStatus(row.status) ? row.status : 'todo',
    dueDate: row.due_date,
  }
}

/** 検証済みの入力を DB に書き込む行の形（snake_case）に変換する */
export function toTaskRow(input: ValidTaskInput) {
  return {
    title: input.title,
    description: input.description,
    status: input.status,
    due_date: input.dueDate,
  }
}
