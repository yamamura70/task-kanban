import { Suspense } from 'react'
import { SquareKanbanIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { TaskBoardLoader } from './_components/TaskBoardLoader'

function TaskBoardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <p className="sr-only">読み込み中...</p>
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <SquareKanbanIcon className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg leading-tight font-semibold">タスクカンバン</h1>
            <p className="text-sm text-muted-foreground">Todo / In Progress / Done でタスクを管理</p>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
        <Suspense fallback={<TaskBoardSkeleton />}>
          <TaskBoardLoader />
        </Suspense>
      </main>
    </div>
  )
}
