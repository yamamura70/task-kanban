'use client'

import { Modal } from './Modal'

type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** 破壊的な操作の前に表示する確認ダイアログ。誤操作を防ぐため、キャンセルに初期フォーカスを置く。 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} role="alertdialog" onClose={onCancel}>
      <p className="mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          className="rounded border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
