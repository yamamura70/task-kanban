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
