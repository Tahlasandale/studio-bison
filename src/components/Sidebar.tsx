import { useSignal } from '@preact/signals'
import type { Page } from '../types';
import { currentPageId, openPage, createNewPage, deleteCurrentPage, updateCurrentPage, pages } from '../stores/editor';
import { Modal, ConfirmModal } from './Modal';

interface SidebarProps {
  pages: Page[];
}

export function Sidebar({ pages: pagesProp }: SidebarProps) {
  const showRenameModal = useSignal(false)
  const showDeleteModal = useSignal(false)
  const renamingPageId = useSignal<string | null>(null)
  const renamingPageName = useSignal('')
  const deletingPageId = useSignal<string | null>(null)

  const handleNewPage = async () => {
    await createNewPage();
  };

  const handleRenameClick = (e: Event, pageId: string, pageName: string) => {
    e.stopPropagation()
    renamingPageId.value = pageId
    renamingPageName.value = pageName || 'Untitled'
    showRenameModal.value = true
  }

  const handleConfirmRename = async () => {
    if (renamingPageId.value && renamingPageName.value.trim()) {
      const page = pages.value.find(p => p.id === renamingPageId.value)
      if (page) {
        await updateCurrentPage({ title: renamingPageName.value.trim() })
      }
    }
    showRenameModal.value = false
    renamingPageId.value = null
  }

  const handleDeleteClick = (e: Event, pageId: string) => {
    e.stopPropagation()
    deletingPageId.value = pageId
    showDeleteModal.value = true
  }

  const handleConfirmDelete = async () => {
    if (deletingPageId.value) {
      if (currentPageId.value === deletingPageId.value) {
        await deleteCurrentPage()
      }
    }
    showDeleteModal.value = false
    deletingPageId.value = null
  }

  return (
    <aside class="w-64 h-screen bg-[var(--bg)] border-r border-[var(--border)] flex flex-col">
      <div class="p-4 border-b border-[var(--border)]">
        <button
          class="w-full py-2 px-4 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          onClick={handleNewPage}
        >
          + New Page
        </button>
      </div>
      
      <nav class="flex-1 overflow-y-auto p-2">
        <div class="text-xs font-medium text-[var(--text)]/50 uppercase tracking-wider px-2 py-1">
          Pages
        </div>
        
        <ul class="mt-1 space-y-0.5">
          {pagesProp.map(page => (
            <li key={page.id}>
              <button
                class={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors group ${
                  currentPageId.value === page.id
                    ? 'bg-[var(--accent-bg)] text-[var(--text-h)]'
                    : 'text-[var(--text)] hover:bg-[var(--code-bg)]'
                }`}
                onClick={() => openPage(page.id)}
              >
                <span class="flex items-center justify-between">
                  <span class="truncate">{page.title || 'Untitled'}</span>
                  <div class="flex items-center gap-1">
                    <button
                      class="p-1 hover:bg-[var(--border)] rounded"
                      onClick={(e) => handleRenameClick(e, page.id, page.title)}
                      title="Renommer"
                    >
                      ✏️
                    </button>
                    <button
                      class="p-1 hover:bg-[var(--border)] rounded text-red-500"
                      onClick={(e) => handleDeleteClick(e, page.id)}
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                </span>
              </button>
            </li>
          ))}
          
          {pagesProp.length === 0 && (
            <li class="px-3 py-4 text-sm text-[var(--text)]/50 text-center">
              No pages yet
            </li>
          )}
        </ul>
      </nav>
      
      <div class="p-4 border-t border-[var(--border)] text-xs text-[var(--text)]/50">
        Studio Bison v3
      </div>

      <Modal
        isOpen={showRenameModal.value}
        onClose={() => showRenameModal.value = false}
        title="Renommer la page"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nouveau nom
            </label>
            <input
              type="text"
              value={renamingPageName.value}
              onInput={(e) => renamingPageName.value = (e.target as HTMLInputElement).value}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename()}
              class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              autoFocus
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              onClick={() => showRenameModal.value = false}
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmRename}
              disabled={!renamingPageName.value.trim()}
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Renommer
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal.value}
        onClose={() => showDeleteModal.value = false}
        onConfirm={handleConfirmDelete}
        title="Supprimer la page"
        message={`Êtes-vous sûr de vouloir supprimer "${pages.value.find(p => p.id === deletingPageId.value)?.title || 'Untitled'}"?`}
        confirmText="Supprimer"
        danger
      />
    </aside>
  );
}