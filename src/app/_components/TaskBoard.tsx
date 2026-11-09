'use client'

import { useCallback, useOptimistic, useState, useTransition } from 'react'
import { createTask, deleteTask, updateTask } from '@/app/actions'
import {
  TASK_STATUSES,
  type ActionResult,
  type Task,
  type ValidTaskInput,
} from '@/lib/tasks/types'
import { ConfirmDialog } from './ConfirmDialog'
import { Modal } from './Modal'
import { TaskCard } from './TaskCard'
import { TaskForm } from './TaskForm'

type TaskChange =
  | { type: 'add'; task: Task }
  | { type: 'update'; task: Task }
  | { type: 'delete'; id: string }

function applyChange(tasks: Task[], change: TaskChange): Task[] {
  switch (change.type) {
    case 'add':
      return [...tasks, change.task]
    case 'update':
      return tasks.map((task) => (task.id === change.task.id ? change.task : task))
    case 'delete':
      return tasks.filter((task) => task.id !== change.id)
  }
}

type TaskBoardProps = {
  initialTasks: Task[]
}

/**
 * カンバンボード。
 * 操作した結果は useOptimistic で即座に表示し、サーバーの処理が成功したら確定する。
 * 失敗した場合は表示を元に戻してエラーを表示する。
 */
export function TaskBoard({ initialTasks }: TaskBoardProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks)
  // サーバーから最新の一覧（refresh 後の props）が届いたら置き換える
  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks)
    setTasks(initialTasks)
  }

  const [optimisticTasks, applyOptimistic] = useOptimistic(tasks, applyChange)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  function mutate<T>(
    optimisticChange: TaskChange,
    request: () => Promise<ActionResult<T>>,
    toConfirmedChange: (data: T) => TaskChange,
  ) {
    setError(null)
    startTransition(async () => {
      applyOptimistic(optimisticChange)
      try {
        const result = await request()
        if (!result.ok) {
          setError(result.error)
          return
        }
        startTransition(() => {
          setTasks((current) => applyChange(current, toConfirmedChange(result.data)))
        })
      } catch {
        setError('通信に失敗しました')
      }
    })
  }

  function handleCreate(input: ValidTaskInput) {
    const temporaryTask: Task = { id: `temp-${Date.now()}`, ...input }
    mutate(
      { type: 'add', task: temporaryTask },
      () => createTask({ title: input.title, description: input.description }),
      (task) => ({ type: 'add', task }),
    )
  }

  function handleUpdate(task: Task, input: ValidTaskInput) {
    setEditingTask(null)
    mutate(
      { type: 'update', task: { ...task, ...input } },
      () => updateTask(task.id, input),
      (updated) => ({ type: 'update', task: updated }),
    )
  }

  function handleDelete(task: Task) {
    setDeletingTask(null)
    mutate(
      { type: 'delete', id: task.id },
      () => deleteTask(task.id),
      () => ({ type: 'delete', id: task.id }),
    )
  }

  const closeEditDialog = useCallback(() => setEditingTask(null), [])
  const closeDeleteDialog = useCallback(() => setDeletingTask(null), [])

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="タスクの追加"
        className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <TaskForm submitLabel="追加" onSubmit={handleCreate} />
      </section>

      {error && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-4 py-2 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((status) => {
          const columnTasks = optimisticTasks.filter((task) => task.status === status.value)
          const headingId = `column-${status.value}`
          return (
            <section
              key={status.value}
              aria-labelledby={headingId}
              className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800"
            >
              <h2 className="mb-3 font-semibold">
                <span id={headingId}>{status.label}</span>
                <span className="ml-2 text-sm text-zinc-500">{columnTasks.length}件</span>
              </h2>
              {columnTasks.length === 0 ? (
                <p className="text-sm text-zinc-500">タスクはありません</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={setEditingTask}
                      onDelete={setDeletingTask}
                    />
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      {editingTask && (
        <Modal title="タスクを編集" onClose={closeEditDialog}>
          <TaskForm
            task={editingTask}
            submitLabel="保存"
            onSubmit={(input) => handleUpdate(editingTask, input)}
            onCancel={closeEditDialog}
          />
        </Modal>
      )}

      {deletingTask && (
        <ConfirmDialog
          title="タスクの削除"
          message={`「${deletingTask.title}」を削除しますか？`}
          confirmLabel="削除する"
          onConfirm={() => handleDelete(deletingTask)}
          onCancel={closeDeleteDialog}
        />
      )}
    </div>
  )
}
