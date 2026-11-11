/** 期限（`YYYY-MM-DD`）を画面表示用の `YYYY/MM/DD` に整形する。タイムゾーンの影響を受けないよう文字列だけで変換する */
export function formatDueDate(dueDate: string): string {
  return dueDate.replaceAll('-', '/')
}

/**
 * 期限が近い順に並べた新しい配列を返す。期限のないタスクは末尾に置く。
 * 期限が同じ（または両方とも期限なし）のときは元の順番（作成順）を保つ。
 */
export function sortByDueDate<T extends { dueDate: string | null }>(tasks: readonly T[]): T[] {
  return [...tasks].sort((a, b) => {
    if (a.dueDate === b.dueDate) return 0
    if (a.dueDate === null) return 1
    if (b.dueDate === null) return -1
    return a.dueDate < b.dueDate ? -1 : 1
  })
}

/** 日時をローカルタイムゾーンの `YYYY-MM-DD` に変換する */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 期限切れかどうか。完了していないタスクで、期限が今日（`YYYY-MM-DD`）より前なら期限切れ。
 * 今日が期限のタスクは期限切れにしない。today が null（まだ分からない）のときは false。
 */
export function isOverdue(
  task: { status: string; dueDate: string | null },
  today: string | null,
): boolean {
  if (today === null || task.dueDate === null || task.status === 'done') return false
  return task.dueDate < today
}
