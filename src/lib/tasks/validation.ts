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

  const dueDate = parseDueDate(input.dueDate)
  if (dueDate === undefined) {
    return { ok: false, error: '期限の日付が正しくありません' }
  }

  return { ok: true, data: { title, description, status, dueDate } }
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * 期限を `YYYY-MM-DD` の文字列か null に変換する。未入力（空文字・null・undefined）は null。
 * 形式が違う・実在しない日付のときは undefined を返す。
 */
function parseDueDate(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return undefined

  const match = DATE_PATTERN.exec(value)
  if (!match) return undefined
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const exists =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  return exists ? value : undefined
}
