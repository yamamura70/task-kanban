import { createClient } from '@/lib/supabase/server'
import { toTask } from '@/lib/tasks/types'
import { TaskBoard } from './TaskBoard'

/** Supabase からタスク一覧を取得してボードに渡す（リクエストごとに取得する） */
export async function TaskBoardLoader() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, description, status')
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <p role="alert" className="text-red-600">
        タスクの読み込みに失敗しました。時間をおいて再読み込みしてください。
      </p>
    )
  }

  return <TaskBoard initialTasks={data.map(toTask)} />
}
