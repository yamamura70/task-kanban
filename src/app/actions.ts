'use server'

import { refresh } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { toTask, toTaskRow, type ActionResult, type Task, type TaskInput } from '@/lib/tasks/types'
import { validateTaskInput } from '@/lib/tasks/validation'

const missingIdError = 'タスクが指定されていません'

export async function createTask(input: TaskInput): Promise<ActionResult<Task>> {
  const validated = validateTaskInput(input)
  if (!validated.ok) return validated

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert(toTaskRow(validated.data))
    .select()
    .single()
  if (error || !data) return { ok: false, error: 'タスクの追加に失敗しました' }

  refresh()
  return { ok: true, data: toTask(data) }
}

export async function updateTask(
  id: string,
  input: TaskInput,
): Promise<ActionResult<Task>> {
  if (!id) return { ok: false, error: missingIdError }
  const validated = validateTaskInput(input)
  if (!validated.ok) return validated

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .update(toTaskRow(validated.data))
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return { ok: false, error: 'タスクの更新に失敗しました' }

  refresh()
  return { ok: true, data: toTask(data) }
}

export async function deleteTask(id: string): Promise<ActionResult<null>> {
  if (!id) return { ok: false, error: missingIdError }

  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return { ok: false, error: 'タスクの削除に失敗しました' }

  refresh()
  return { ok: true, data: null }
}
