import { useEffect, useRef } from 'preact/hooks'
import { useSignal } from '@preact/signals'
import type { DatabaseColumn, Database } from '../../types'
import { Modal } from '../Modal'

interface TableViewProps {
  schemaColumns: DatabaseColumn[]
  database: Database
  onAddRow: (row: Record<string, unknown>) => void
  onUpdateRow: (rowId: string, updates: Record<string, unknown>) => void
  onDeleteRow: (rowId: string) => void
  onAddColumn: () => void
  onDeleteColumn: (columnId: string) => void
  onUpdateColumn: (columnId: string, updates: Partial<DatabaseColumn>) => void
}

const TYPE_LABELS: Record<string, string> = {
  text: 'Texte',
  number: 'Nombre',
  date: 'Date',
  select: 'Sélection',
  checkbox: 'Case',
  relation: 'Relation'
}

const COLUMN_TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Sélection' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'relation', label: 'Relation' }
] as const

export function TableView({ schemaColumns, database, onAddRow, onUpdateRow, onDeleteRow, onAddColumn, onDeleteColumn, onUpdateColumn }: TableViewProps) {
  const editingCell = useSignal<{ rowId: string; columnId: string } | null>(null)
  const editingValue = useSignal('')
  const validationErrors = useSignal<Record<string, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const focusRequested = useSignal<{ rowId: string; columnId: string } | null>(null)
  
  const showColumnModal = useSignal(false)
  const editingColumn = useSignal<DatabaseColumn | null>(null)
  const editColumnName = useSignal('')
  const editColumnType = useSignal<DatabaseColumn['type']>('text')
  const editColumnOptions = useSignal('')

  useEffect(() => {
    if (focusRequested.value && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
      focusRequested.value = null
    }
  })

  const handleStartEdit = (rowId: string, columnId: string, currentValue: unknown) => {
    editingCell.value = { rowId, columnId }
    editingValue.value = String(currentValue ?? '')
    validationErrors.value = {}
    focusRequested.value = { rowId, columnId }
  }

  const handleSaveEdit = () => {
    if (!editingCell.value) return
    const { rowId, columnId } = editingCell.value
    const column = schemaColumns.find(c => c.id === columnId)
    
    if (column?.type === 'number' && editingValue.value !== '') {
      const num = Number(editingValue.value)
      if (isNaN(num)) {
        validationErrors.value = { [columnId]: 'Ce champ doit contenir un nombre' }
        return
      }
    }
    
    validationErrors.value = {}
    onUpdateRow(rowId, { [columnId]: editingValue.value })
    editingCell.value = null
  }

  const handleCancelEdit = () => {
    editingCell.value = null
    validationErrors.value = {}
  }

  const handleAddRow = () => {
    const row: Record<string, unknown> = { id: crypto.randomUUID() }
    for (const col of schemaColumns) {
      row[col.id] = col.type === 'checkbox' ? false : ''
    }
    onAddRow(row)
    
    if (schemaColumns.length > 0) {
      const firstColumn = schemaColumns[0]
      setTimeout(() => {
        handleStartEdit(row.id as string, firstColumn.id, row[firstColumn.id])
      }, 50)
    }
  }

  const handleCheckboxChange = (rowId: string, columnId: string, currentValue: unknown) => {
    const newValue = !currentValue
    onUpdateRow(rowId, { [columnId]: newValue })
  }

  const openColumnModal = (column: DatabaseColumn) => {
    editingColumn.value = column
    editColumnName.value = column.name
    editColumnType.value = column.type
    editColumnOptions.value = column.options?.join(', ') || ''
    showColumnModal.value = true
  }

  const saveColumnChanges = () => {
    if (!editingColumn.value || !editColumnName.value.trim()) return
    
    onUpdateColumn(editingColumn.value.id, {
      name: editColumnName.value.trim(),
      type: editColumnType.value,
      options: editColumnType.value === 'select' 
        ? editColumnOptions.value.split(',').map(o => o.trim()).filter(Boolean)
        : undefined
    })
    showColumnModal.value = false
  }

  const deleteColumnFromModal = () => {
    if (!editingColumn.value) return
    if (confirm('Supprimer cette colonne et toutes ses données?')) {
      onDeleteColumn(editingColumn.value.id)
      showColumnModal.value = false
    }
  }

  const renderCell = (column: DatabaseColumn, row: Record<string, unknown>) => {
    const value = row[column.id]
    const isEditing = editingCell.value?.rowId === row.id && editingCell.value?.columnId === column.id
    const hasError = validationErrors.value[column.id]

    if (column.type === 'checkbox') {
      return (
        <div class="flex justify-center">
          <input
            type="checkbox"
            checked={!!value}
            onChange={() => handleCheckboxChange(row.id as string, column.id, value)}
            class="w-4 h-4 cursor-pointer accent-blue-600"
          />
        </div>
      )
    }

    if (column.type === 'select' && column.options) {
      return (
        <select
          value={String(value ?? '')}
          onChange={(e) => onUpdateRow(row.id as string, { [column.id]: (e.target as HTMLSelectElement).value })}
          class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 bg-transparent"
        >
          <option value="">-</option>
          {column.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
    }

    if (column.type === 'date') {
      const dateVal = value ? new Date(value as number).toISOString().split('T')[0] : ''
      return (
        <input
          type="date"
          value={dateVal}
          onChange={(e) => onUpdateRow(row.id as string, { [column.id]: (e.target as HTMLInputElement).value ? new Date((e.target as HTMLInputElement).value).getTime() : null })}
          class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 bg-transparent"
        />
      )
    }

    if (isEditing) {
      return (
        <div>
          <input
            ref={inputRef}
            type={column.type === 'number' ? 'number' : 'text'}
            value={editingValue.value}
            onInput={(e) => editingValue.value = (e.target as HTMLInputElement).value}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit()
              if (e.key === 'Escape') handleCancelEdit()
            }}
            class="w-full px-1 py-0.5 text-sm border rounded dark:bg-gray-700 bg-transparent"
          />
          {hasError && (
            <p class="text-xs text-red-500 mt-1">{hasError}</p>
          )}
        </div>
      )
    }

    return (
      <div
        onClick={() => handleStartEdit(row.id as string, column.id, value)}
        class="cursor-text min-h-[24px] text-sm truncate"
        title={String(value ?? '')}
      >
        {column.type === 'number' && value !== '' && value !== null && value !== undefined
          ? String(value)
          : value || '-'}
      </div>
    )
  }

  return (
    <div class="flex-1 min-w-0 p-4">
      {schemaColumns.length === 0 ? (
        <div class="flex flex-col items-center justify-center h-full text-gray-500">
          <p class="mb-4">Aucune colonne</p>
          <button
            onClick={onAddColumn}
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Ajouter une colonne
          </button>
        </div>
      ) : (
        <div class="h-full flex flex-col min-w-0">
          <div class="flex-1 overflow-auto border rounded-lg dark:border-gray-700">
            <table class="w-full border-collapse">
              <thead class="sticky top-0 z-10">
                <tr class="bg-gray-100 dark:bg-gray-800">
                  {schemaColumns.map(col => (
                    <th key={col.id} class="border p-2 text-left group relative">
                      <div class="flex items-center justify-between">
                        <div class="cursor-pointer" onClick={() => openColumnModal(col)}>
                          <div class="font-medium text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600">{col.name}</div>
                          <div class="text-xs text-gray-400 font-normal">{TYPE_LABELS[col.type] || col.type}</div>
                        </div>
                        <button
                          onClick={() => openColumnModal(col)}
                          class="text-gray-400 hover:text-blue-600 text-sm px-1"
                          title="Modifier la colonne"
                        >
                          ⚙
                        </button>
                      </div>
                    </th>
                  ))}
                  <th class="border p-2 w-12">
                    <button
                      onClick={onAddColumn}
                      class="w-full h-full flex items-center justify-center text-gray-400 hover:text-blue-600 text-lg"
                      title="Ajouter une colonne"
                    >
                      +
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {database.data.length === 0 ? (
                  <tr>
                    <td colSpan={schemaColumns.length + 1} class="border p-8 text-center text-gray-500">
                      Aucune donnée
                    </td>
                  </tr>
                ) : (
                  database.data.map(row => (
                    <tr key={row.id as string} class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      {schemaColumns.map(col => (
                        <td key={col.id} class="border p-2">
                          {renderCell(col, row)}
                        </td>
                      ))}
                      <td class="border p-2">
                        <button
                          onClick={() => onDeleteRow(row.id as string)}
                          class="text-gray-400 hover:text-red-500 text-lg leading-none"
                          title="Supprimer la ligne"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                <tr class="bg-gray-50 dark:bg-gray-800/30">
                  <td colSpan={schemaColumns.length + 1} class="border p-2">
                    <button
                      onClick={handleAddRow}
                      class="w-full py-1 text-sm text-gray-500 hover:text-blue-600 flex items-center justify-center gap-1"
                    >
                      <span>+</span>
                      <span>Ajouter une ligne</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showColumnModal.value}
        onClose={() => showColumnModal.value = false}
        title="Modifier la colonne"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom de la colonne
            </label>
            <input
              type="text"
              value={editColumnName.value}
              onInput={(e) => editColumnName.value = (e.target as HTMLInputElement).value}
              class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={editColumnType.value}
              onChange={(e) => editColumnType.value = (e.target as HTMLSelectElement).value as DatabaseColumn['type']}
              class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              {COLUMN_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          {editColumnType.value === 'select' && (
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Options (séparées par des virgules)
              </label>
              <input
                type="text"
                value={editColumnOptions.value}
                onInput={(e) => editColumnOptions.value = (e.target as HTMLInputElement).value}
                class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="ex: Option1, Option2, Option3"
              />
            </div>
          )}
          <div class="flex justify-between pt-2">
            <button
              onClick={deleteColumnFromModal}
              class="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              Supprimer
            </button>
            <div class="flex gap-2">
              <button
                onClick={() => showColumnModal.value = false}
                class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Annuler
              </button>
              <button
                onClick={saveColumnChanges}
                disabled={!editColumnName.value.trim()}
                class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}