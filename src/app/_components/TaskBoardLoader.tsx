import { CircleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
      <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
        <CircleAlertIcon aria-hidden="true" />
        <AlertDescription>
          タスクの読み込みに失敗しました。時間をおいて再読み込みしてください。
        </AlertDescription>
      </Alert>
    )
  }

  return <TaskBoard initialTasks={data.map(toTask)} />
}
