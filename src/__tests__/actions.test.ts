import { afterEach, describe, expect, test, vi } from 'vitest'
import { refresh } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createTask, deleteTask, updateTask } from '@/app/actions'

vi.mock('next/cache', () => ({ refresh: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

type QueryResult = { data: unknown; error: { message: string } | null }

/**
 * Supabase クライアントのクエリビルダーを模したオブジェクトを作る。
 * どのメソッドをチェーンしても、最後に await すると result を返す。
 */
function mockSupabase(result: QueryResult) {
  const builder = {
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: vi.fn(() => builder),
    then: (resolve: (value: QueryResult) => unknown) => resolve(result),
  }
  const client = { from: vi.fn(() => builder) }
  vi.mocked(createClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createClient>>,
  )
  return { client, builder }
}

const row = {
  id: 'task-1',
  title: '買い物',
  description: '牛乳',
  status: 'todo',
  created_at: '2026-11-09T00:00:00Z',
  updated_at: '2026-11-09T00:00:00Z',
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('createTask', () => {
  test('正しい入力なら tasks に追加し、作成したタスクを返して画面を更新する', async () => {
    const { client, builder } = mockSupabase({ data: row, error: null })

    const result = await createTask({ title: ' 買い物 ', description: '牛乳' })

    expect(client.from).toHaveBeenCalledWith('tasks')
    expect(builder.insert).toHaveBeenCalledWith({
      title: '買い物',
      description: '牛乳',
      status: 'todo',
    })
    expect(result).toEqual({
      ok: true,
      data: { id: 'task-1', title: '買い物', description: '牛乳', status: 'todo' },
    })
    expect(refresh).toHaveBeenCalled()
  })

  test('タイトルが空ならDBに書き込まずエラーを返す', async () => {
    const { client } = mockSupabase({ data: row, error: null })

    const result = await createTask({ title: '' })

    expect(result).toEqual({ ok: false, error: 'タイトルを入力してください' })
    expect(client.from).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })

  test('DBエラーが起きたら失敗メッセージを返し画面を更新しない', async () => {
    mockSupabase({ data: null, error: { message: 'db error' } })

    const result = await createTask({ title: '買い物' })

    expect(result).toEqual({ ok: false, error: 'タスクの追加に失敗しました' })
    expect(refresh).not.toHaveBeenCalled()
  })
})

describe('updateTask', () => {
  test('正しい入力なら指定したIDのタスクを更新して返す', async () => {
    const updated = { ...row, title: '買い物（済）', status: 'done' }
    const { builder } = mockSupabase({ data: updated, error: null })

    const result = await updateTask('task-1', {
      title: '買い物（済）',
      description: '牛乳',
      status: 'done',
    })

    expect(builder.update).toHaveBeenCalledWith({
      title: '買い物（済）',
      description: '牛乳',
      status: 'done',
    })
    expect(builder.eq).toHaveBeenCalledWith('id', 'task-1')
    expect(result).toEqual({
      ok: true,
      data: { id: 'task-1', title: '買い物（済）', description: '牛乳', status: 'done' },
    })
    expect(refresh).toHaveBeenCalled()
  })

  test('不正なステータスならDBに書き込まずエラーを返す', async () => {
    const { client } = mockSupabase({ data: row, error: null })

    const result = await updateTask('task-1', { title: '買い物', status: 'archived' })

    expect(result).toEqual({ ok: false, error: 'ステータスが不正です' })
    expect(client.from).not.toHaveBeenCalled()
  })

  test('IDが空ならDBに書き込まずエラーを返す', async () => {
    const { client } = mockSupabase({ data: row, error: null })

    const result = await updateTask('', { title: '買い物' })

    expect(result).toEqual({ ok: false, error: 'タスクが指定されていません' })
    expect(client.from).not.toHaveBeenCalled()
  })

  test('DBエラーが起きたら失敗メッセージを返す', async () => {
    mockSupabase({ data: null, error: { message: 'db error' } })

    const result = await updateTask('task-1', { title: '買い物' })

    expect(result).toEqual({ ok: false, error: 'タスクの更新に失敗しました' })
    expect(refresh).not.toHaveBeenCalled()
  })
})

describe('deleteTask', () => {
  test('指定したIDのタスクを削除して画面を更新する', async () => {
    const { builder } = mockSupabase({ data: null, error: null })

    const result = await deleteTask('task-1')

    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', 'task-1')
    expect(result).toEqual({ ok: true, data: null })
    expect(refresh).toHaveBeenCalled()
  })

  test('IDが空ならDBに書き込まずエラーを返す', async () => {
    const { client } = mockSupabase({ data: null, error: null })

    const result = await deleteTask('')

    expect(result).toEqual({ ok: false, error: 'タスクが指定されていません' })
    expect(client.from).not.toHaveBeenCalled()
  })

  test('DBエラーが起きたら失敗メッセージを返す', async () => {
    mockSupabase({ data: null, error: { message: 'db error' } })

    const result = await deleteTask('task-1')

    expect(result).toEqual({ ok: false, error: 'タスクの削除に失敗しました' })
    expect(refresh).not.toHaveBeenCalled()
  })
})
