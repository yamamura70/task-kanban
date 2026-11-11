/** 期限（`YYYY-MM-DD`）を画面表示用の `YYYY/MM/DD` に整形する。タイムゾーンの影響を受けないよう文字列だけで変換する */
export function formatDueDate(dueDate: string): string {
  return dueDate.replaceAll('-', '/')
}
