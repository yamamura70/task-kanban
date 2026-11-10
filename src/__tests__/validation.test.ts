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
      data: { title: '買い物', description: '牛乳を買う', status: 'in_progress' },
    })
  })

  test('ステータスと説明を省略すると Todo と空文字になる', () => {
    const result = validateTaskInput({ title: '買い物' })

    expect(result).toEqual({
      ok: true,
      data: { title: '買い物', description: '', status: 'todo' },
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
})
