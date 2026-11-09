import type { Task } from '@/lib/tasks/types'

type TaskCardProps = {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <li className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="font-medium break-words">{task.title}</h3>
      {task.description && (
        <p className="mt-1 text-sm whitespace-pre-wrap break-words text-zinc-600 dark:text-zinc-400">
          {task.description}
        </p>
      )}
      <div className="mt-3 flex justify-end gap-2 text-sm">
        <button
          type="button"
          aria-label={`「${task.title}」を編集`}
          onClick={() => onEdit(task)}
          className="rounded px-2 py-1 text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-zinc-800"
        >
          編集
        </button>
        <button
          type="button"
          aria-label={`「${task.title}」を削除`}
          onClick={() => onDelete(task)}
          className="rounded px-2 py-1 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-zinc-800"
        >
          削除
        </button>
      </div>
    </li>
  )
}
