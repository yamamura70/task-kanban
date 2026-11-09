import { isTaskStatus, type TaskInput, type ValidTaskInput } from './types'

export const TITLE_MAX_LENGTH = 100
export const DESCRIPTION_MAX_LENGTH = 1000

export type ValidationResult =
  | { ok: true; data: ValidTaskInput }
  | { ok: false; error: string }

/**
 * タスクの入力値を検証する。クライアントとサーバーの両方で使う。
 * 文字数は DB の制約（tasks テーブルの check 制約）と合わせている。
 */
export function validateTaskInput(input: TaskInput): ValidationResult {
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  if (title === '') {
    return { ok: false, error: 'タイトルを入力してください' }
  }
  if ([...title].length > TITLE_MAX_LENGTH) {
    return { ok: false, error: `タイトルは${TITLE_MAX_LENGTH}文字以内で入力してください` }
  }

  const description = typeof input.description === 'string' ? input.description : ''
  if ([...description].length > DESCRIPTION_MAX_LENGTH) {
    return {
      ok: false,
      error: `説明は${DESCRIPTION_MAX_LENGTH}文字以内で入力してください`,
    }
  }

  const status = input.status ?? 'todo'
  if (!isTaskStatus(status)) {
    return { ok: false, error: 'ステータスが不正です' }
  }

  return { ok: true, data: { title, description, status } }
}
