import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page from '@/app/page'

// 非同期の Server Component（Supabase からの読み込み）は Vitest で描画できないため差し替える
vi.mock('@/app/_components/TaskBoardLoader', () => ({
  TaskBoardLoader: () => <div>タスク一覧</div>,
}))

test('トップページに見出しが表示される', () => {
  render(<Page />)
  expect(
    screen.getByRole('heading', { level: 1, name: 'タスクカンバン' }),
  ).toBeDefined()
})
