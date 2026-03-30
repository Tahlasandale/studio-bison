import { useEffect } from 'preact/hooks'
import { useSignal } from '@preact/signals'
import type { DatabaseColumn } from '../types'
import { schemas, activeSchema, activeDatabase, loadSchemas, addSchema, selectSchema, removeSchema, renameSchema, addDatabase, addColumnToSchema, updateColumnInSchema, deleteColumnFromSchema, addRowToDatabase, updateRowInDatabase, deleteRowFromDatabase } from '../stores/database'
import { TableView } from './Database/TableView'
import { Modal, ConfirmModal } from './Modal'

const COLUMN_TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Sélection' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'relation', label: 'Relation' }
] as const

export function DatabasePanel() {
  useEffect(() => {
    loadSchemas()
  }, [])

  const showAddColumnModal = useSignal(false)
  const showDeleteSchemaModal = useSignal(false)
  const deletingSchemaId = useSignal<string | null>(null)
  const showRenameSchemaModal = useSignal(false)
  const renamingSchemaId = useSignal<string | null>(null)
  const renamingSchemaName = useSignal('')
  const newColumnName = useSignal('')
  const newColumnType = useSignal<DatabaseColumn['type']>('text')
  const newColumnOptions = useSignal('')

  const handleAddSchema = async () => {
    const name = prompt('Nom de la table:')
    if (name) {
      await addSchema(name)
    }
  }

  const handleDeleteSchemaClick = (e: Event, id: string) => {
    e.stopPropagation()
    deletingSchemaId.value = id
    showDeleteSchemaModal.value = true
  }

  const handleConfirmDeleteSchema = async () => {
    if (deletingSchemaId.value) {
      await removeSchema(deletingSchemaId.value)
      deletingSchemaId.value = null
    }
  }

  const handleRenameSchemaClick = (e: Event, id: string, name: string) => {
    e.stopPropagation()
    renamingSchemaId.value = id
    renamingSchemaName.value = name
    showRenameSchemaModal.value = true
  }

  const handleConfirmRenameSchema = async () => {
    if (renamingSchemaId.value && renamingSchemaName.value.trim()) {
      await renameSchema(renamingSchemaId.value, renamingSchemaName.value.trim())
    }
    showRenameSchemaModal.value = false
    renamingSchemaId.value = null
  }

  const handleCreateDatabase = () => {
    addDatabase()
    selectSchema(activeSchema.value!.id)
  }

  const handleAddRow = (row: Record<string, unknown>) => {
    addRowToDatabase(row)
  }

  const handleUpdateRow = (rowId: string, updates: Record<string, unknown>) => {
    updateRowInDatabase(rowId, updates)
  }

  const handleDeleteRow = (rowId: string) => {
    deleteRowFromDatabase(rowId)
  }

  const openAddColumnModal = () => {
    newColumnName.value = ''
    newColumnType.value = 'text'
    newColumnOptions.value = ''
    showAddColumnModal.value = true
  }

  const handleAddColumn = () => {
    if (!newColumnName.value.trim()) return

    const column: DatabaseColumn = {
      id: crypto.randomUUID(),
      name: newColumnName.value.trim(),
      type: newColumnType.value,
      options: newColumnType.value === 'select'
        ? newColumnOptions.value.split(',').map(o => o.trim()).filter(Boolean)
        : undefined
    }

    addColumnToSchema(column)
    showAddColumnModal.value = false
  }

  const handleDeleteColumn = (columnId: string) => {
    if (confirm('Supprimer cette colonne?')) {
      deleteColumnFromSchema(columnId)
    }
  }

  const handleUpdateColumn = (columnId: string, updates: Partial<DatabaseColumn>) => {
    updateColumnInSchema(columnId, updates)
  }

  return (
    <div class="flex h-full min-w-0">
      <div class="w-64 h-screen bg-[var(--bg)] border-r border-[var(--border)] flex flex-col">
        <div class="p-4 border-b border-[var(--border)]">
          <button
            onClick={handleAddSchema}
            class="w-full py-2 px-4 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            + Nouvelle table
          </button>
        </div>
        
        <nav class="flex-1 overflow-y-auto p-2">
          <div class="text-xs font-medium text-[var(--text)]/50 uppercase tracking-wider px-2 py-1">
            Tables
          </div>
          
          <ul class="mt-1 space-y-0.5">
            {schemas.value.length === 0 ? (
              <li class="px-3 py-4 text-sm text-[var(--text)]/50 text-center">
                Aucune table
              </li>
            ) : (
              schemas.value.map(schema => (
                <li key={schema.id}>
                  <button
                    onClick={() => selectSchema(schema.id)}
                    class={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeSchema.value?.id === schema.id
                        ? 'bg-[var(--accent-bg)] text-[var(--text-h)]'
                        : 'text-[var(--text)] hover:bg-[var(--code-bg)]'
                    }`}
                  >
                    <span class="flex items-center justify-between">
                      <span class="truncate">{schema.name}</span>
                      <div class="flex items-center gap-1">
                        <button
                          onClick={(e) => handleRenameSchemaClick(e, schema.id, schema.name)}
                          class="p-1 hover:bg-[var(--border)] rounded"
                          title="Renommer"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleDeleteSchemaClick(e, schema.id)}
                          class="p-1 hover:bg-[var(--border)] rounded text-red-500"
                          title="Supprimer"
                        >
                          ×
                        </button>
                      </div>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </nav>
      </div>

      <div class="flex-1 flex flex-col min-w-0">
        {activeSchema.value ? (
          <>
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 class="text-lg font-semibold truncate">{activeSchema.value.name}</h3>
              {!activeDatabase.value && (
                <button
                  onClick={handleCreateDatabase}
                  class="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                >
                  Créer la table
                </button>
              )}
            </div>

            {activeDatabase.value ? (
              <TableView
                schemaColumns={activeSchema.value.columns}
                database={activeDatabase.value}
                onAddRow={handleAddRow}
                onUpdateRow={handleUpdateRow}
                onDeleteRow={handleDeleteRow}
                onAddColumn={openAddColumnModal}
                onDeleteColumn={handleDeleteColumn}
                onUpdateColumn={handleUpdateColumn}
              />
            ) : (
              <div class="flex-1 flex flex-col items-center justify-center text-gray-500">
                <p class="mb-4">Aucune table créée</p>
                <button
                  onClick={handleCreateDatabase}
                  class="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Créer la table
                </button>
              </div>
            )}
          </>
        ) : (
          <div class="flex-1 flex flex-col items-center justify-center text-gray-500">
            <p>Sélectionnez une table pour voir ses données</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showAddColumnModal.value}
        onClose={() => showAddColumnModal.value = false}
        title="Ajouter une colonne"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom de la colonne
            </label>
            <input
              type="text"
              value={newColumnName.value}
              onInput={(e) => newColumnName.value = (e.target as HTMLInputElement).value}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="ex: Nom, Prix, Date..."
              autoFocus
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={newColumnType.value}
              onChange={(e) => newColumnType.value = (e.target as HTMLSelectElement).value as DatabaseColumn['type']}
              class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              {COLUMN_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          {newColumnType.value === 'select' && (
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Options (séparées par des virgules)
              </label>
              <input
                type="text"
                value={newColumnOptions.value}
                onInput={(e) => newColumnOptions.value = (e.target as HTMLInputElement).value}
                class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="ex: Option1, Option2, Option3"
              />
            </div>
          )}
          <div class="flex justify-end gap-2 pt-2">
            <button
              onClick={() => showAddColumnModal.value = false}
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Annuler
            </button>
            <button
              onClick={handleAddColumn}
              disabled={!newColumnName.value.trim()}
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteSchemaModal.value}
        onClose={() => showDeleteSchemaModal.value = false}
        onConfirm={handleConfirmDeleteSchema}
        title="Supprimer la table"
        message={`Êtes-vous sûr de vouloir supprimer "${schemas.value.find(s => s.id === deletingSchemaId.value)?.name}"? Toutes les données seront perdues.`}
        confirmText="Supprimer"
        danger
      />

      <Modal
        isOpen={showRenameSchemaModal.value}
        onClose={() => showRenameSchemaModal.value = false}
        title="Renommer la table"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nouveau nom
            </label>
            <input
              type="text"
              value={renamingSchemaName.value}
              onInput={(e) => renamingSchemaName.value = (e.target as HTMLInputElement).value}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmRenameSchema()}
              class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              autoFocus
            />
          </div>
          <div class="flex justify-end gap-2">
            <button
              onClick={() => showRenameSchemaModal.value = false}
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmRenameSchema}
              disabled={!renamingSchemaName.value.trim()}
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Renommer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}