'use client'

import { useEffect, useId, type ReactNode } from 'react'

type ModalProps = {
  title: string
  role?: 'dialog' | 'alertdialog'
  onClose: () => void
  children: ReactNode
}

/** 画面中央に表示するモーダル。Esc キーまたは背景クリックで閉じる。 */
export function Modal({ title, role = 'dialog', onClose, children }: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900"
      >
        <h2 id={titleId} className="mb-4 text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
