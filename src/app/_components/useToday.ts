import { useSyncExternalStore } from 'react'
import { toLocalDateString } from '@/lib/tasks/dueDate'

/** タブに戻ったときに日付が変わっていれば反映する */
function subscribe(onChange: () => void) {
  window.addEventListener('focus', onChange)
  document.addEventListener('visibilitychange', onChange)
  return () => {
    window.removeEventListener('focus', onChange)
    document.removeEventListener('visibilitychange', onChange)
  }
}

function getSnapshot() {
  return toLocalDateString(new Date())
}

/** サーバーではブラウザのタイムゾーンが分からないため null にし、ハイドレーションの不一致を防ぐ */
function getServerSnapshot() {
  return null
}

/** ブラウザのローカルタイムゾーンでの今日の日付（`YYYY-MM-DD`）。サーバーでの描画中は null */
export function useToday(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
