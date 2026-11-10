import type { TaskStatus } from '@/lib/tasks/types'

/**
 * ステータスごとのアクセント色のクラス。
 * 色そのものは globals.css の `--status-*` 変数で定義する。
 * Tailwind がクラス名を検出できるよう、文字列は組み立てずにそのまま書く。
 */
export const STATUS_STYLES: Record<TaskStatus, { dot: string; accent: string }> = {
  todo: { dot: 'bg-status-todo', accent: 'before:bg-status-todo' },
  in_progress: { dot: 'bg-status-in-progress', accent: 'before:bg-status-in-progress' },
  done: { dot: 'bg-status-done', accent: 'before:bg-status-done' },
}
