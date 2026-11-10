import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskBoard } from '@/app/_components/TaskBoard'
import { createTask, deleteTask, updateTask } from '@/app/actions'
import type { Task } from '@/lib/tasks/types'

// Server Actions はサーバーとの通信（外部依存）なのでモックする
vi.mock('@/app/actions', () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))

const tasks: Task[] = [
  { id: '1', title: '買い物', description: '牛乳を買う', status: 'todo' },
  { id: '2', title: '資料作成', description: '', status: 'in_progress' },
]

function column(name: string) {
  return screen.getByRole('region', { name })
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('一覧表示', () => {
  test('タスクがステータスごとの列に表示される', () => {
    render(<TaskBoard initialTasks={tasks} />)

    expect(within(column('Todo')).getByText('買い物')).toBeDefined()
    expect(within(column('Todo')).getByText('牛乳を買う')).toBeDefined()
    expect(within(column('In Progress')).getByText('資料作成')).toBeDefined()
  })

  test('タスクがない列には空であることが表示される', () => {
    render(<TaskBoard initialTasks={tasks} />)

    expect(within(column('Done')).getByText('タスクはありません')).toBeDefined()
    expect(within(column('Todo')).queryByText('タスクはありません')).toBeNull()
  })

  test('タスクが0件なら全ての列が空表示になる', () => {
    render(<TaskBoard initialTasks={[]} />)

    expect(screen.getAllByText('タスクはありません')).toHaveLength(3)
  })
})

describe('追加', () => {
  test('タイトルを入力して追加するとTodo列に表示され、フォームが空に戻る', async () => {
    const user = userEvent.setup()
    vi.mocked(createTask).mockResolvedValue({
      ok: true,
      data: { id: '3', title: '掃除', description: '部屋', status: 'todo' },
    })
    render(<TaskBoard initialTasks={tasks} />)

    await user.type(screen.getByLabelText('タイトル'), '掃除')
    await user.type(screen.getByLabelText('説明'), '部屋')
    await user.click(screen.getByRole('button', { name: '追加' }))

    expect(await within(column('Todo')).findByText('掃除')).toBeDefined()
    expect(createTask).toHaveBeenCalledWith({ title: '掃除', description: '部屋' })
    expect((screen.getByLabelText('タイトル') as HTMLInputElement).value).toBe('')
  })

  test('サーバーの応答を待たずに追加したタスクが表示される', async () => {
    const user = userEvent.setup()
    let respond: (result: Awaited<ReturnType<typeof createTask>>) => void = () => {}
    vi.mocked(createTask).mockReturnValue(
      new Promise((resolve) => {
        respond = resolve
      }),
    )
    render(<TaskBoard initialTasks={tasks} />)

    await user.type(screen.getByLabelText('タイトル'), '掃除')
    await user.click(screen.getByRole('button', { name: '追加' }))

    expect(await within(column('Todo')).findByText('掃除')).toBeDefined()

    // 実行中のアクションを残すと他のテストに影響するため、応答を返して完了させる
    respond({ ok: true, data: { id: '3', title: '掃除', description: '', status: 'todo' } })
    expect(await within(column('Todo')).findByText('掃除')).toBeDefined()
  })

  test('タイトルが空のまま追加するとエラーが表示され、保存されない', async () => {
    const user = userEvent.setup()
    render(<TaskBoard initialTasks={tasks} />)

    await user.click(screen.getByRole('button', { name: '追加' }))

    expect(screen.getByRole('alert').textContent).toBe('タイトルを入力してください')
    expect(createTask).not.toHaveBeenCalled()
  })

  test('保存に失敗するとエラーが表示され、タスクは一覧に残らない', async () => {
    const user = userEvent.setup()
    vi.mocked(createTask).mockResolvedValue({
      ok: false,
      error: 'タスクの追加に失敗しました',
    })
    render(<TaskBoard initialTasks={tasks} />)

    await user.type(screen.getByLabelText('タイトル'), '掃除')
    await user.click(screen.getByRole('button', { name: '追加' }))

    expect(await screen.findByText('タスクの追加に失敗しました')).toBeDefined()
    await waitFor(() => expect(within(column('Todo')).queryByText('掃除')).toBeNull())
  })

  test('通信エラーが起きるとエラーが表示される', async () => {
    const user = userEvent.setup()
    vi.mocked(createTask).mockRejectedValue(new Error('network'))
    render(<TaskBoard initialTasks={tasks} />)

    await user.type(screen.getByLabelText('タイトル'), '掃除')
    await user.click(screen.getByRole('button', { name: '追加' }))

    expect(await screen.findByText('通信に失敗しました')).toBeDefined()
    await waitFor(() => expect(within(column('Todo')).queryByText('掃除')).toBeNull())
  })
})

describe('編集', () => {
  test('編集ボタンを押すと現在の内容が入った編集ダイアログが開く', async () => {
    const user = userEvent.setup()
    render(<TaskBoard initialTasks={tasks} />)

    await user.click(screen.getByRole('button', { name: '「買い物」を編集' }))

    const dialog = screen.getByRole('dialog', { name: 'タスクを編集' })
    expect((within(dialog).getByLabelText('タイトル') as HTMLInputElement).value).toBe('買い物')
    expect((within(dialog).getByLabelText('説明') as HTMLTextAreaElement).value).toBe(
      '牛乳を買う',
    )
    expect((within(dialog).getByLabelText('ステータス') as HTMLSelectElement).value).toBe(
      'todo',
    )
  })

  test('タイトルとステータスを変更して保存すると、変更後の列に表示される', async () => {
    const user = userEvent.setup()
    vi.mocked(updateTask).mockResolvedValue({
      ok: true,
      data: { id: '1', title: '買い物（済）', description: '牛乳を買う', status: 'done' },
    })
    render(<TaskBoard initialTasks={tasks} />)

    await user.click(screen.getByRole('button', { name: '「買い物」を編集' }))
    const dialog = screen.getByRole('dialog', { name: 'タスクを編集' })
    const titleInput = within(dialog).getByLabelText('タイトル')
    await user.clear(titleInput)
    await user.type(titleInput, '買い物（済）')
    await user.selectOptions(within(dialog).getByLabelText('ステータス'), 'done')
    await user.click(within(dialog).getByRole('button', { name: '保存' }))

    expect(await within(column('Done')).findByText('買い物（済）')).toBeDefined()
    expect(within(column('Todo')).queryByText('買い物')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(updateTask).toHaveBeenCalledWith('1', {
      title: '買い物（済）',
      description: '牛乳を買う',
      status: 'done',
    })
  })

  test('キャンセルするとダイアログが閉じ、タスクは変更されない', async () => {
    const user = userEvent.setup()
    render(<TaskBoard initialTasks={tasks} />)

    await user.click(screen.getByRole('button', { name: '「買い物」を編集' }))
    const dialog = screen.getByRole('dialog', { name: 'タスクを編集' })
    await user.clear(within(dialog).getByLabelText('タイトル'))
    await user.click(within(dialog).getByRole('button', { name: 'キャンセル' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(within(column('Todo')).getByText('買い物')).toBeDefined()
    expect(updateTask).not.toHaveBeenCalled()
  })

  test('タイトルを空にして保存するとエラーが表示され、ダイアログは開いたままになる', async () => {
    const user = userEvent.setup()
    render(<TaskBoard initialTasks={tasks} />)

    await user.click(screen.getByRole('button', { name: '「買い物」を編集' }))
    const dialog = screen.getByRole('dialog', { name: 'タスクを編集' })
    await user.clear(within(dialog).getByLabelText('タイトル'))
    await user.click(within(dialog).getByRole('button', { name: '保存' }))

    expect(within(dialog).getByRole('alert').textContent).toBe('タイトルを入力してください')
    expect(screen.getByRole('dialog', { name: 'タスクを編集' })).toBeDefined()
    expect(updateTask).not.toHaveBeenCalled()
  })

  test('更新に失敗するとエラーが表示され、元の内容に戻る', async () => {
    const user = userEvent.setup()
    vi.mocked(updateTask).mockResolvedValue({
      ok: false,
      error: 'タスクの更新に失敗しました',
    })
    render(<TaskBoard initialTasks={tasks} />)

    await user.click(screen.getByRole('button', { name: '「買い物」を編集' }))
    const dialog = screen.getByRole('dialog', { name: 'タスクを編集' })
    await user.selectOptions(within(dialog).getByLabelText('ステータス'), 'done')
    await user.click(within(dialog).getByRole('button', { name: '保存' }))

    expect(await screen.findByText('タスクの更新に失敗しました')).toBeDefined()
    expect(await within(column('Todo')).findByText('買い物')).toBeDefined()
    expect(within(column('Done')).queryByText('買い物')).toBeNull()
  })
})

describe('削除', () => {
  test('削除ボタンを押すと確認ダイアログが表示される', async () => {
    const user = userEvent.setup()
    render(<TaskBoard initialTasks={tasks} />)

    await user.click(screen.getByRole('button', { name: '「買い物」を削除' }))

    const dialog = screen.getByRole('alertdialog', { name: 'タスクの削除' })
    expect(within(dialog).getByText('「買い物」を削除しますか？')).toBeDefined()
    expect(deleteTask).not.toHaveBeenCalled()
  })

  test('確認ダイアログで削除するとタスクが一覧から消える', async () => {
    const user = userEvent.setup()
    vi.mocked(deleteTask).mockResolvedValue({ ok: true, data: null })
    render(<TaskBoard initialTasks={tasks} />)

    await user.click(screen.getByRole('button', { name: '「買い物」を削除' }))
    await user.click(screen.getByRole('button', { name: '削除する' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.queryByText('買い物')).toBeNull()
    expect(deleteTask).toHaveBeenCalledWith('1')
  })

  test('確認ダイアログでキャンセルするとダイアログが閉じ、タスクは残る', async () => {
    const user = userEvent.setup()
    render(<TaskBoard initialTasks={tasks} />)

    await user.click(screen.getByRole('button', { name: '「買い物」を削除' }))
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(within(column('Todo')).getByText('買い物')).toBeDefined()
    expect(deleteTask).not.toHaveBeenCalled()
  })

  test('確認ダイアログでEscキーを押すとダイアログが閉じ、タスクは残る', async () => {
    const user = userEvent.setup()
    render(<TaskBoard initialTasks={tasks} />)

    await user.click(screen.getByRole('button', { name: '「買い物」を削除' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(within(column('Todo')).getByText('買い物')).toBeDefined()
    expect(deleteTask).not.toHaveBeenCalled()
  })

  test('削除に失敗するとエラーが表示され、タスクは一覧に戻る', async () => {
    const user = userEvent.setup()
    vi.mocked(deleteTask).mockResolvedValue({
      ok: false,
      error: 'タスクの削除に失敗しました',
    })
    render(<TaskBoard initialTasks={tasks} />)

    await user.click(screen.getByRole('button', { name: '「買い物」を削除' }))
    await user.click(screen.getByRole('button', { name: '削除する' }))

    expect(await screen.findByText('タスクの削除に失敗しました')).toBeDefined()
    expect(await within(column('Todo')).findByText('買い物')).toBeDefined()
  })
})
