import { describe, expect, test } from 'vitest'
import { formatDueDate, sortByDueDate } from '@/lib/tasks/dueDate'

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
