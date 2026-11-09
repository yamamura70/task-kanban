import { Suspense } from 'react'
import { TaskBoardLoader } from './_components/TaskBoardLoader'

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">タスクカンバン</h1>
      <Suspense fallback={<p className="text-zinc-500">読み込み中...</p>}>
        <TaskBoardLoader />
      </Suspense>
    </main>
  )
}
