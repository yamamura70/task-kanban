import { describe, expect, test } from 'vitest'
import {
  formatDueDate,
  isOverdue,
  sortByDueDate,
  toLocalDateString,
} from '@/lib/tasks/dueDate'

describe('formatDueDate', () => {
  test('YYYY-MM-DD を YYYY/MM/DD に整形する', () => {
    expect(formatDueDate('2026-01-05')).toBe('2026/01/05')
  })
})

describe('sortByDueDate', () => {
  test('期限が近い順に並び、期限のないタスクは末尾になる', () => {
    const tasks = [
      { id: 'a', dueDate: null },
      { id: 'b', dueDate: '2026-12-01' },
      { id: 'c', dueDate: '2026-11-20' },
    ]

    expect(sortByDueDate(tasks).map((task) => task.id)).toEqual(['c', 'b', 'a'])
  })

  test('期限が同じタスクと期限のないタスク同士は元の順番を保つ', () => {
    const tasks = [
      { id: 'a', dueDate: null },
      { id: 'b', dueDate: '2026-11-20' },
      { id: 'c', dueDate: null },
      { id: 'd', dueDate: '2026-11-20' },
    ]

    expect(sortByDueDate(tasks).map((task) => task.id)).toEqual(['b', 'd', 'a', 'c'])
  })

  test('年をまたぐ期限も日付の順に並ぶ', () => {
    const tasks = [
      { id: 'a', dueDate: '2027-01-01' },
      { id: 'b', dueDate: '2026-12-31' },
    ]

    expect(sortByDueDate(tasks).map((task) => task.id)).toEqual(['b', 'a'])
  })

  test('元の配列は並べ替えない', () => {
    const tasks = [
      { id: 'a', dueDate: null },
      { id: 'b', dueDate: '2026-11-20' },
    ]

    sortByDueDate(tasks)

    expect(tasks.map((task) => task.id)).toEqual(['a', 'b'])
  })
})

describe('toLocalDateString', () => {
  test('ローカルタイムゾーンの日付を YYYY-MM-DD で返す', () => {
    expect(toLocalDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('isOverdue', () => {
  const today = '2026-11-11'

  test('未完了で期限が昨日なら期限切れになる', () => {
    expect(isOverdue({ status: 'todo', dueDate: '2026-11-10' }, today)).toBe(true)
  })

  test('進行中で期限が過ぎていれば期限切れになる', () => {
    expect(isOverdue({ status: 'in_progress', dueDate: '2025-12-31' }, today)).toBe(true)
  })

  test('期限が今日なら期限切れにならない', () => {
    expect(isOverdue({ status: 'todo', dueDate: '2026-11-11' }, today)).toBe(false)
  })

  test('期限が明日なら期限切れにならない', () => {
    expect(isOverdue({ status: 'todo', dueDate: '2026-11-12' }, today)).toBe(false)
  })

  test('完了したタスクは期限が過ぎていても期限切れにならない', () => {
    expect(isOverdue({ status: 'done', dueDate: '2026-11-10' }, today)).toBe(false)
  })

  test('期限がなければ期限切れにならない', () => {
    expect(isOverdue({ status: 'todo', dueDate: null }, today)).toBe(false)
  })

  test('今日の日付が分からなければ期限切れにしない', () => {
    expect(isOverdue({ status: 'todo', dueDate: '2026-11-10' }, null)).toBe(false)
  })
})
