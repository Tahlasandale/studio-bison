import type { ComponentChildren } from 'preact'
import { clsx } from 'clsx'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ComponentChildren
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        class="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  danger?: boolean
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = 'Confirm',
  danger = false
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p class="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
      <div class="flex justify-end gap-3">
        <button
          onClick={onClose}
          class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          class={clsx(
            'px-4 py-2 text-sm text-white rounded',
            danger 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}