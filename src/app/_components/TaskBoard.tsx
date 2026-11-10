'use client'

import { useCallback, useOptimistic, useRef, useState, useTransition } from 'react'
import { CircleAlertIcon, InboxIcon, PlusCircleIcon, Trash2Icon } from 'lucide-react'
import { createTask, deleteTask, updateTask } from '@/app/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  TASK_STATUSES,
  type ActionResult,
  type Task,
  type ValidTaskInput,
} from '@/lib/tasks/types'
import { cn } from '@/lib/utils'
import { STATUS_STYLES } from './statusStyles'
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
  // 閉じるアニメーションの間も内容を表示し続けるため、最後に開いた対象を保持する
  const [lastEditingTask, setLastEditingTask] = useState<Task | null>(null)
  const [lastDeletingTask, setLastDeletingTask] = useState<Task | null>(null)
  if (editingTask && editingTask !== lastEditingTask) setLastEditingTask(editingTask)
  if (deletingTask && deletingTask !== lastDeletingTask) setLastDeletingTask(deletingTask)
  // 誤操作を防ぐため、削除確認ではキャンセルに初期フォーカスを置く
  const cancelDeleteRef = useRef<HTMLButtonElement>(null)

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
      <section aria-label="タスクの追加">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircleIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              新しいタスク
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm submitLabel="追加" onSubmit={handleCreate} />
          </CardContent>
        </Card>
      </section>

      {error && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <CircleAlertIcon aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((status) => {
          const columnTasks = optimisticTasks.filter((task) => task.status === status.value)
          const headingId = `column-${status.value}`
          return (
            <section
              key={status.value}
              aria-labelledby={headingId}
              className="flex flex-col gap-3 rounded-xl border bg-muted/50 p-3"
            >
              <h2 className="flex items-center gap-2 px-1 text-sm font-semibold">
                <span
                  aria-hidden="true"
                  className={cn('size-2 rounded-full', STATUS_STYLES[status.value].dot)}
                />
                <span id={headingId}>{status.label}</span>
                <Badge variant="secondary" className="ml-auto tabular-nums">
                  {columnTasks.length}件
                </Badge>
              </h2>
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center text-muted-foreground">
                  <InboxIcon className="size-5" aria-hidden="true" />
                  <p className="text-sm">タスクはありません</p>
                </div>
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

      <Dialog
        open={editingTask !== null}
        onOpenChange={(open) => {
          if (!open) closeEditDialog()
        }}
      >
        <DialogContent className="gap-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>タスクを編集</DialogTitle>
          </DialogHeader>
          {lastEditingTask && (
            <TaskForm
              key={lastEditingTask.id}
              task={lastEditingTask}
              submitLabel="保存"
              onSubmit={(input) => handleUpdate(lastEditingTask, input)}
              onCancel={closeEditDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingTask !== null}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog()
        }}
      >
        <AlertDialogContent initialFocus={cancelDeleteRef}>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2Icon aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>タスクの削除</AlertDialogTitle>
            <AlertDialogDescription>
              {lastDeletingTask && `「${lastDeletingTask.title}」を削除しますか？`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={cancelDeleteRef}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60"
              onClick={() => lastDeletingTask && handleDelete(lastDeletingTask)}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
