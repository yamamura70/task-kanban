'use client'

import { useId, useState, type FormEvent } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { TASK_STATUSES, type Task, type ValidTaskInput } from '@/lib/tasks/types'
import { cn } from '@/lib/utils'
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
  const isEdit = Boolean(task)
  const errorId = `${id}-error`

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

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className={cn('grid gap-4', !isEdit && 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')}>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-title`}>タイトル</Label>
          <Input
            id={`${id}-title`}
            name="title"
            defaultValue={task?.title}
            maxLength={TITLE_MAX_LENGTH}
            required
            autoFocus={isEdit}
            placeholder="例: 企画書を仕上げる"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-description`}>説明</Label>
          <Textarea
            id={`${id}-description`}
            name="description"
            defaultValue={task?.description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            rows={isEdit ? 4 : 1}
            placeholder="詳細やメモ（任意）"
            className={cn(!isEdit && 'min-h-9')}
          />
        </div>
      </div>
      {task && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-status`}>ステータス</Label>
          <NativeSelect
            id={`${id}-status`}
            name="status"
            defaultValue={task.status}
            className="w-full"
          >
            {TASK_STATUSES.map((status) => (
              <NativeSelectOption key={status.value} value={status.value}>
                {status.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <p id={errorId} role={error ? 'alert' : undefined} className="flex-1 text-sm text-destructive">
          {error}
        </p>
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>
              キャンセル
            </Button>
          )}
          <Button type="submit" size="lg" className="px-4">
            {!isEdit && <PlusIcon data-icon="inline-start" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
