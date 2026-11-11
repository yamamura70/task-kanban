import { describe, expect, test } from 'vitest'
import { validateTaskInput } from '@/lib/tasks/validation'

describe('validateTaskInput', () => {
  test('タイトル・説明・ステータスが正しければ前後の空白を除いた値を返す', () => {
    const result = validateTaskInput({
      title: '  買い物  ',
      description: '牛乳を買う',
      status: 'in_progress',
    })

    expect(result).toEqual({
      ok: true,
      data: {
        title: '買い物',
        description: '牛乳を買う',
        status: 'in_progress',
        dueDate: null,
      },
    })
  })

  test('ステータス・説明・期限を省略すると Todo・空文字・期限なしになる', () => {
    const result = validateTaskInput({ title: '買い物' })

    expect(result).toEqual({
      ok: true,
      data: { title: '買い物', description: '', status: 'todo', dueDate: null },
    })
  })

  test('タイトルが空だとエラーになる', () => {
    const result = validateTaskInput({ title: '' })

    expect(result).toEqual({ ok: false, error: 'タイトルを入力してください' })
  })

  test('タイトルが空白のみだとエラーになる', () => {
    const result = validateTaskInput({ title: '   ' })

    expect(result).toEqual({ ok: false, error: 'タイトルを入力してください' })
  })

  test('タイトルが文字列でないとエラーになる', () => {
    const result = validateTaskInput({ title: 123 })

    expect(result).toEqual({ ok: false, error: 'タイトルを入力してください' })
  })

  test('タイトルがちょうど100文字なら有効になる', () => {
    const result = validateTaskInput({ title: 'あ'.repeat(100) })

    expect(result.ok).toBe(true)
  })

  test('タイトルが101文字だとエラーになる', () => {
    const result = validateTaskInput({ title: 'あ'.repeat(101) })

    expect(result).toEqual({
      ok: false,
      error: 'タイトルは100文字以内で入力してください',
    })
  })

  test('説明がちょうど1000文字なら有効になる', () => {
    const result = validateTaskInput({ title: 'a', description: 'あ'.repeat(1000) })

    expect(result.ok).toBe(true)
  })

  test('説明が1001文字だとエラーになる', () => {
    const result = validateTaskInput({ title: 'a', description: 'あ'.repeat(1001) })

    expect(result).toEqual({
      ok: false,
      error: '説明は1000文字以内で入力してください',
    })
  })

  test('定義されていないステータスだとエラーになる', () => {
    const result = validateTaskInput({ title: 'a', status: 'archived' })

    expect(result).toEqual({ ok: false, error: 'ステータスが不正です' })
  })

  test('期限が正しい日付ならその日付を返す', () => {
    const result = validateTaskInput({ title: 'a', dueDate: '2026-11-20' })

    expect(result).toMatchObject({ ok: true, data: { dueDate: '2026-11-20' } })
  })

  test.each([
    ['空文字', ''],
    ['null', null],
  ])('期限が%sなら期限なしになる', (_, dueDate) => {
    const result = validateTaskInput({ title: 'a', dueDate })

    expect(result).toMatchObject({ ok: true, data: { dueDate: null } })
  })

  test('期限がうるう年の2月29日なら有効になる', () => {
    const result = validateTaskInput({ title: 'a', dueDate: '2028-02-29' })

    expect(result).toMatchObject({ ok: true, data: { dueDate: '2028-02-29' } })
  })

  test.each([
    ['うるう年でない年の2月29日', '2027-02-29'],
    ['実在しない日付', '2026-02-30'],
    ['13月', '2026-13-01'],
    ['スラッシュ区切り', '2026/11/20'],
    ['ゼロ埋めなし', '2026-1-5'],
    ['日時を含む文字列', '2026-11-20T00:00:00Z'],
    ['日付でない文字列', 'あした'],
    ['文字列以外', 20261120],
  ])('期限が%sだとエラーになる', (_, dueDate) => {
    const result = validateTaskInput({ title: 'a', dueDate })

    expect(result).toEqual({ ok: false, error: '期限の日付が正しくありません' })
  })
})
