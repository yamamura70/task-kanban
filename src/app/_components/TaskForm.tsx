'use client'

import { useId, useState, type FormEvent } from 'react'
import { TASK_STATUSES, type Task, type ValidTaskInput } from '@/lib/tasks/types'
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  validateTaskInput,
} from '@/lib/tasks/validation'

type TaskFormProps = {
  /** 指定すると編集モードになり、ステータスを選択できる */
  task?: Task
  submitLabel: string
  onSubmit: (input: ValidTaskInput) => void
  onCancel?: () => void
}

/** タスクの追加・編集で共通のフォーム */
export function TaskForm({ task, submitLabel, onSubmit, onCancel }: TaskFormProps) {
  const id = useId()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const result = validateTaskInput({
      title: formData.get('title'),
      description: formData.get('description'),
      status: formData.get('status') ?? undefined,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    onSubmit(result.data)
    if (!task) form.reset()
  }

  const inputClass =
    'w-full rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950'

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-title`} className="text-sm font-medium">
          タイトル
        </label>
        <input
          id={`${id}-title`}
          name="title"
          defaultValue={task?.title}
          maxLength={TITLE_MAX_LENGTH}
          required
          autoFocus={Boolean(task)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-description`} className="text-sm font-medium">
          説明
        </label>
        <textarea
          id={`${id}-description`}
          name="description"
          defaultValue={task?.description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          rows={task ? 4 : 2}
          className={inputClass}
        />
      </div>
      {task && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-status`} className="text-sm font-medium">
            ステータス
          </label>
          <select
            id={`${id}-status`}
            name="status"
            defaultValue={task.status}
            className={inputClass}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
