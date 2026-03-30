import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import type { Block as BlockType } from '../types';
import { createBlock, pages } from '../stores/editor';
import { startDrag, endDrag, dragState } from '../lib/drag';
import { navigate } from '../lib/router';
import { schemas, loadSchemas, getDatabaseById, getSchemaById, selectSchema } from '../stores/database';
import type { DatabaseSchema, Database, DatabaseColumn } from '../types';

interface BlockProps {
  block: BlockType;
  index: number;
  isDragging?: boolean;
  onUpdate: (id: string, updates: Partial<BlockType>) => void;
  onDelete: (id: string, focusPreviousId?: string) => void;
  onInsert: (afterId: string, block: BlockType) => void;
  onMove: (fromIndex: number, toIndex: number, position: 'before' | 'after') => void;
  onFocusBlock: (id: string, direction: 'up' | 'down') => void;
  onFocusNewBlock?: (id: string) => void;
  onNewline?: () => void;
  onMergeWithPrevious?: (id: string) => void;
}

export function Block({ block, index, onUpdate, onDelete, onInsert, onMove, onFocusBlock, onFocusNewBlock, onNewline, onMergeWithPrevious }: BlockProps) {
  const [slashQuery, setSlashQuery] = useState('');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [dbSchema, setDbSchema] = useState<DatabaseSchema | null>(null);
  const [dbData, setDbData] = useState<Database | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [sortColumnId, setSortColumnId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputElRef = useRef<HTMLInputElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSchemas();
  }, []);

  useEffect(() => {
    if (block.type === 'database' && block.properties?.schemaId) {
      const loadDb = async () => {
        const schema = await getSchemaById(block.properties!.schemaId as string);
        const db = await getDatabaseById(block.properties!.schemaId as string);
        setDbSchema(schema || null);
        setDbData(db || null);
        
        if (block.properties!.sortColumn) {
          setSortColumnId(block.properties!.sortColumn as string);
          setSortDirection((block.properties!.sortDirection as 'asc' | 'desc') || 'asc');
        }
        if (block.properties!.hiddenColumns) {
          // Hidden columns loaded from properties
        }
      };
      loadDb();
    }
  }, [block.type, block.properties?.schemaId]);

  const getHiddenColumns = (): string[] => {
    return (block.properties?.hiddenColumns as string[]) || [];
  }

  const toggleColumnVisibility = (columnId: string) => {
    const hidden = getHiddenColumns();
    const newHidden = hidden.includes(columnId)
      ? hidden.filter(id => id !== columnId)
      : [...hidden, columnId];
    onUpdate(block.id, { properties: { ...block.properties, hiddenColumns: newHidden } });
  }

  const setSort = (columnId: string) => {
    let newDirection: 'asc' | 'desc' = 'asc';
    if (sortColumnId === columnId) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    setSortColumnId(columnId);
    setSortDirection(newDirection);
    onUpdate(block.id, { 
      properties: { 
        ...block.properties, 
        sortColumn: columnId, 
        sortDirection: newDirection 
      } 
    });
  }

  const getSortedAndFilteredData = () => {
    if (!dbData?.data) return [];
    
    let data = [...dbData.data];
    const hiddenColumns = getHiddenColumns();
    
    // Filter hidden columns
    const visibleColumns = dbSchema?.columns.filter(col => !hiddenColumns.includes(col.id)) || [];
    
    // Sort data
    if (sortColumnId && visibleColumns.find(col => col.id === sortColumnId)) {
      const column = dbSchema?.columns.find(col => col.id === sortColumnId);
      if (column) {
        data.sort((a, b) => {
          const valA = a[sortColumnId];
          const valB = b[sortColumnId];
          let comparison = 0;
          
          if (column.type === 'checkbox') {
            comparison = (valA ? 1 : 0) - (valB ? 1 : 0);
          } else if (column.type === 'number') {
            comparison = (Number(valA) || 0) - (Number(valB) || 0);
          } else if (column.type === 'date') {
            comparison = (Number(valA) || 0) - (Number(valB) || 0);
          } else {
            comparison = String(valA ?? '').localeCompare(String(valB ?? ''));
          }
          
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }
    
    return data;
  }

  const focusBlockInput = useCallback(() => {
    setTimeout(() => {
      const blockEl = document.querySelector(`[data-block-id="${block.id}"]`);
      if (!blockEl) return;
      
      const isHeading = ['heading1', 'heading2', 'heading3', 'database'].includes(block.type);
      
      if (isHeading) {
        const input = blockEl.querySelector('input:not([type="file"])') as HTMLInputElement;
        if (input) input.focus();
      } else if (block.type === 'divider' || block.type === 'image') {
        return;
      } else {
        const textarea = blockEl.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
      }
    }, 0);
  }, [block.id, block.type]);

  useEffect(() => {
    focusBlockInput();
  }, [block.type]);

  useEffect(() => {
    if (inputRef.current && block.content) {
      const textarea = inputRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [block.content, block.type]);

  const updateTextareaHeight = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }, []);

  const handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    const value = target.value;
    onUpdate(block.id, { content: value });
    updateTextareaHeight(target);
    
    if (value.startsWith('/')) {
      const rect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeight = 350;
      let top = rect.bottom;
      if (top + menuHeight > viewportHeight) {
        top = Math.max(10, rect.top - menuHeight);
      }
      setSlashMenuPos({ x: rect.left, y: top });
      setSlashQuery(value.slice(1));
      setShowSlashMenu(true);
      setSelectedIndex(0);
    } else {
      setShowSlashMenu(false);
      setSlashQuery('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (showSlashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredOptions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredOptions[selectedIndex];
        if (selected) {
          handleSlashSelect(selected.type);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      const newBlock = createBlock('text');
      onInsert(block.id, newBlock);
      setTimeout(() => {
        onFocusNewBlock?.(newBlock.id);
      }, 0);
      return;
    }

    const isCtrl = e.ctrlKey || e.metaKey;
    if (isCtrl && e.key === 'Enter') {
      e.preventDefault();
      onNewline?.();
      return;
    }

    if (isCtrl && e.key === 'a') {
      return;
    }

    const target = e.target as HTMLTextAreaElement | HTMLInputElement;
    const value = target.value;
    const cursorPos = target.selectionStart ?? 0;
    const isInput = target.tagName === 'INPUT';
    const isAtStart = cursorPos === 0;
    const isAtEnd = cursorPos === value.length;
    const hasTextSelection = target.selectionStart !== target.selectionEnd;

    if ((e.key === 'Delete' || e.key === 'Backspace') && hasTextSelection) {
      e.preventDefault();
      onUpdate(block.id, { content: '' });
      return;
    }

    if (e.key === 'Backspace' && !showSlashMenu) {
      if (value === '') {
        e.preventDefault();
        onDelete(block.id);
        return;
      }

      if (isAtStart) {
        e.preventDefault();
        onMergeWithPrevious?.(block.id);
        return;
      }
    }

    if (e.key === 'ArrowUp' && !showSlashMenu) {
      if (isAtStart || isInput) {
        e.preventDefault();
        onFocusBlock(block.id, 'up');
        return;
      }
    }

    if (e.key === 'ArrowDown' && !showSlashMenu) {
      if (isAtEnd || isInput) {
        e.preventDefault();
        onFocusBlock(block.id, 'down');
        return;
      }
    }

    if (e.key === 'ArrowLeft' && !showSlashMenu && isAtStart) {
      e.preventDefault();
      onFocusBlock(block.id, 'up');
      return;
    }

    if (e.key === 'ArrowRight' && !showSlashMenu && isAtEnd) {
      e.preventDefault();
      onFocusBlock(block.id, 'down');
      return;
    }
  };

  const handleSlashSelect = (type: BlockType['type']) => {
    let newContent = block.content.replace(/^\/.*/, '');
    onUpdate(block.id, { type, content: newContent });
    setShowSlashMenu(false);
    setSlashQuery('');
    setTimeout(() => {
      const blockEl = document.querySelector(`[data-block-id="${block.id}"]`);
      if (blockEl) {
        const textarea = blockEl.querySelector('textarea') as HTMLTextAreaElement;
        const input = blockEl.querySelector('input') as HTMLInputElement;
        if (textarea) textarea.focus();
        else if (input) input.focus();
      }
    }, 0);
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleDragStart = (e: DragEvent) => {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'move';
    startDrag(block.id, index, { x: e.clientX, y: e.clientY });
  };

  const handleDragOver = (e: DragEvent) => {
    if (!e.dataTransfer) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    if (!e.dataTransfer) return;
    e.preventDefault();
    setIsDragOver(false);
    
    const state = dragState.value;
    
    if (state.dragIndex !== -1 && state.dragIndex !== index) {
      const blockRect = blockRef.current?.getBoundingClientRect();
      const midY = blockRect ? blockRect.top + blockRect.height / 2 : 0;
      const position = e.clientY < midY ? 'before' : 'after';
      onMove(state.dragIndex, index, position);
    }
    endDrag();
  };

  const filteredOptions = blockOptions.filter(opt => 
    opt.label.toLowerCase().includes(slashQuery.toLowerCase())
  );

  const renderBlockContent = () => {
    const baseProps = {};
    
    switch (block.type) {
      case 'heading1':
        return (
          <input
            ref={inputElRef}
            type="text"
            class="w-full bg-transparent border-none outline-none text-4xl font-bold text-[var(--text-h)] placeholder:text-[var(--text)]/30"
            value={block.content}
            onInput={(e) => onUpdate(block.id, { content: (e.target as HTMLInputElement).value })}
            onKeyDown={handleKeyDown}
            {...baseProps}
            placeholder="Heading 1"
          />
        );
      case 'heading2':
        return (
          <input
            ref={inputElRef}
            type="text"
            class="w-full bg-transparent border-none outline-none text-2xl font-semibold text-[var(--text-h)] placeholder:text-[var(--text)]/30"
            value={block.content}
            onInput={(e) => onUpdate(block.id, { content: (e.target as HTMLInputElement).value })}
            onKeyDown={handleKeyDown}
            {...baseProps}
            placeholder="Heading 2"
          />
        );
      case 'heading3':
        return (
          <input
            ref={inputElRef}
            type="text"
            class="w-full bg-transparent border-none outline-none text-xl font-medium text-[var(--text-h)] placeholder:text-[var(--text)]/30"
            value={block.content}
            onInput={(e) => onUpdate(block.id, { content: (e.target as HTMLInputElement).value })}
            onKeyDown={handleKeyDown}
            {...baseProps}
            placeholder="Heading 3"
          />
        );
      case 'code':
        return (
          <div class="relative">
            <select
              class="absolute top-2 right-2 text-xs bg-[var(--code-bg)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text)] z-10"
              value={(block.properties?.language as string) || 'plaintext'}
              onChange={(e) => onUpdate(block.id, { properties: { ...block.properties, language: (e.target as HTMLSelectElement).value } })}
            >
              <option value="plaintext">Plain text</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="bash">Bash</option>
              <option value="sql">SQL</option>
            </select>
            <textarea
              ref={inputRef}
              class="w-full bg-[var(--code-bg)] border border-[var(--border)] rounded-lg p-4 pt-10 font-mono text-sm text-[var(--text)] outline-none resize-none min-h-[100px]"
              value={block.content}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              {...baseProps}
              placeholder="Enter code..."
              spellcheck={false}
              style={{ height: 'auto', minHeight: '100px' }}
            />
          </div>
        );
      case 'quote':
        return (
          <div class="border-l-4 border-[var(--accent)] pl-4">
            <textarea
              ref={inputRef}
              class="w-full bg-transparent border-none outline-none resize-none text-[var(--text)] italic placeholder:text-[var(--text)]/50"
              value={block.content}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              {...baseProps}
              placeholder="Quote..."
              style={{ height: 'auto', minHeight: '24px' }}
            />
          </div>
        );
      case 'callout':
        return (
          <div class="bg-[var(--accent-bg)] border border-[var(--accent-border)] rounded-lg p-4">
            <textarea
              ref={inputRef}
              class="w-full bg-transparent border-none outline-none resize-none text-[var(--text)] placeholder:text-[var(--text)]/50"
              value={block.content}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              {...baseProps}
              placeholder="Callout..."
              style={{ height: 'auto', minHeight: '24px' }}
            />
          </div>
        );
      case 'divider':
        return <hr class="border-[var(--border)] border-t-2 my-2" />;
      case 'image':
        return (
          <div class="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center">
            {block.content ? (
              <div class="relative">
                <img src={block.content} alt="" class="max-w-full rounded-lg" />
                <button
                  class="absolute top-2 right-2 bg-[var(--bg)] p-2 rounded-lg border border-[var(--border)]"
                  onClick={() => onUpdate(block.id, { content: '' })}
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ) : (
              <label class="cursor-pointer">
                <input
                  type="file"
                  class="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => onUpdate(block.id, { content: reader.result as string });
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div class="text-[var(--text)]/50 hover:text-[var(--text)]">
                  <svg class="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                  Click to upload image
                </div>
              </label>
            )}
          </div>
        );
      case 'database': {
        const currentSchemaId = block.properties?.schemaId as string || '';
        
        const handleSchemaChange = (e: Event) => {
          const newSchemaId = (e.target as HTMLSelectElement).value;
          onUpdate(block.id, { properties: { ...block.properties, schemaId: newSchemaId } });
        };

        const handleEditTable = () => {
          if (currentSchemaId) {
            navigate('database');
            selectSchema(currentSchemaId);
          }
        };

        const renderCellValue = (column: DatabaseColumn, value: unknown) => {
          if (column.type === 'checkbox') {
            return value ? '✓' : '-';
          }
          if (column.type === 'select' && column.options) {
            return value || '-';
          }
          return value ?? '-';
        };

        const hiddenColumns = getHiddenColumns();
        const visibleColumns = dbSchema?.columns.filter(col => !hiddenColumns.includes(col.id)) || [];
        const sortedData = getSortedAndFilteredData();

        return (
          <div class="bg-[var(--code-bg)] border border-[var(--border)] rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2 flex-1">
                <label class="text-sm text-[var(--text)]">Table:</label>
                <select
                  value={currentSchemaId}
                  onChange={handleSchemaChange}
                  class="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                >
                  <option value="">Sélectionner une table...</option>
                  {schemas.value.map(schema => (
                    <option key={schema.id} value={schema.id}>{schema.name}</option>
                  ))}
                </select>
              </div>
              <div class="flex items-center gap-2">
                {dbSchema && (
                  <button
                    onClick={() => setShowColumnSettings(!showColumnSettings)}
                    class="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--border)] text-[var(--text)]"
                    title="Afficher/masquer les colonnes"
                  >
                    ☰
                  </button>
                )}
                <button
                  onClick={handleEditTable}
                  disabled={!currentSchemaId}
                  class="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:opacity-90 disabled:opacity-50"
                >
                  Modifier la table
                </button>
              </div>
            </div>

            {showColumnSettings && dbSchema && (
              <div class="mb-3 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                <div class="text-xs font-medium text-[var(--text)]/70 mb-2">Colonnes affichées:</div>
                <div class="flex flex-wrap gap-2">
                  {dbSchema.columns.map(col => (
                    <label key={col.id} class="flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.includes(col.id)}
                        onChange={() => toggleColumnVisibility(col.id)}
                        class="w-4 h-4"
                      />
                      {col.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {dbSchema && visibleColumns.length > 0 && sortedData.length > 0 ? (
              <div class="overflow-x-auto">
                <table class="w-full border-collapse text-sm">
                  <thead>
                    <tr class="border-b border-[var(--border)]">
                      {visibleColumns.map(col => (
                        <th key={col.id} class="p-2 text-left text-[var(--text)]/70 font-medium relative">
                          <button
                            onClick={() => setSort(col.id)}
                            class="flex items-center gap-1 hover:text-[var(--text)]"
                          >
                            {col.name}
                            {sortColumnId === col.id && (
                              <span class="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((row: Record<string, unknown>) => (
                      <tr key={row.id as string} class="border-b border-[var(--border)]/50">
                        {visibleColumns.map(col => (
                          <td key={col.id} class="p-2 text-[var(--text)]">
                            {renderCellValue(col, row[col.id])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : dbSchema ? (
              <div class="text-sm text-[var(--text)]/50 py-4 text-center">
                {visibleColumns.length === 0 ? 'Aucune colonne affichée' : 'Aucune donnée dans cette table'}
              </div>
            ) : currentSchemaId ? (
              <div class="text-sm text-[var(--text)]/50 py-4 text-center">
                Table non trouvée
              </div>
            ) : (
              <div class="text-sm text-[var(--text)]/50 py-4 text-center">
                Sélectionnez une table dans l'éditeur de base de données
              </div>
              )}
            </div>
          );
      }
      case 'button': {
        const currentLinkType = block.properties?.linkType as string || 'none';
        const currentPageId = block.properties?.pageId as string || '';
        const currentUrl = block.properties?.url as string || '';
        
        const handleLinkTypeChange = (e: Event) => {
          const newLinkType = (e.target as HTMLSelectElement).value as 'none' | 'page' | 'external';
          onUpdate(block.id, { 
            properties: { 
              ...block.properties, 
              linkType: newLinkType,
              pageId: newLinkType === 'page' ? '' : undefined,
              url: newLinkType === 'external' ? '' : undefined
            } 
          });
        };
        
        const handlePageChange = (e: Event) => {
          const newPageId = (e.target as HTMLSelectElement).value;
          onUpdate(block.id, { properties: { ...block.properties, pageId: newPageId } });
        };
        
        const handleUrlChange = (e: Event) => {
          const newUrl = (e.target as HTMLInputElement).value;
          onUpdate(block.id, { properties: { ...block.properties, url: newUrl } });
        };
        
        const handleButtonTextChange = (e: Event) => {
          const newText = (e.target as HTMLInputElement).value;
          onUpdate(block.id, { content: newText });
        };
        
        return (
          <div class="bg-[var(--code-bg)] border border-[var(--border)] rounded-lg p-4">
            <div class="mb-3">
              <label class="text-sm text-[var(--text)] block mb-1">Texte du bouton:</label>
              <input
                type="text"
                value={block.content || ''}
                onInput={handleButtonTextChange}
                placeholder="Cliquez ici"
                class="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
              />
            </div>
            <div class="mb-3">
              <label class="text-sm text-[var(--text)] block mb-1">Action au clic:</label>
              <select
                value={currentLinkType}
                onChange={handleLinkTypeChange}
                class="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
              >
                <option value="none">Aucune action</option>
                <option value="page">Aller vers une page</option>
                <option value="external">Lien externe</option>
              </select>
            </div>
            {currentLinkType === 'page' && (
              <div class="mb-3">
                <label class="text-sm text-[var(--text)] block mb-1">Page:</label>
                <select
                  value={currentPageId}
                  onChange={handlePageChange}
                  class="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                >
                  <option value="">Sélectionner une page...</option>
                  {pages.value.map(page => (
                    <option key={page.id} value={page.id}>{page.title || 'Sans titre'}</option>
                  ))}
                </select>
              </div>
            )}
            {currentLinkType === 'external' && (
              <div class="mb-3">
                <label class="text-sm text-[var(--text)] block mb-1">URL:</label>
                <input
                  type="text"
                  value={currentUrl}
                  onInput={handleUrlChange}
                  placeholder="https://..."
                  class="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                />
              </div>
            )}
            <div class="text-center py-2">
              <button 
                class="px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50" 
                disabled={currentLinkType === 'none'}
              >
                {block.content || 'Cliquez ici'}
              </button>
            </div>
          </div>
        );
      }
      default:
        return (
          <textarea
            ref={inputRef}
            class="w-full bg-transparent border-none outline-none resize-none text-[var(--text)] placeholder:text-[var(--text)]/50"
            value={block.content}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            {...baseProps}
            placeholder="Type '/' for commands..."
            style={{ height: 'auto', minHeight: '24px' }}
          />
        );
    }
  };

  return (
    <div 
      ref={blockRef}
      data-block-id={block.id}
      class={`group relative flex items-start gap-2 py-1 -ml-8 pl-8 ${isDragOver ? 'bg-[var(--accent-bg)]' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
    >
      <div
        draggable={true}
        class="opacity-60 hover:opacity-100 cursor-grab p-1 hover:bg-[var(--accent-bg)] rounded transition-opacity"
        onDragStart={handleDragStart as any}
        title="Drag to move"
      >
        <svg class="w-4 h-4 text-[var(--text)]" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5"/>
          <circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/>
          <circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/>
          <circle cx="15" cy="18" r="1.5"/>
        </svg>
      </div>
      
      <div class="flex-1 min-w-0">
        {renderBlockContent()}
        
        {showSlashMenu && (
          <SlashMenu
            position={slashMenuPos}
            options={filteredOptions}
            selectedIndex={selectedIndex}
            onSelect={handleSlashSelect}
          />
        )}
        
        {showContextMenu && (
          <div 
            class="fixed z-50 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-lg py-2 min-w-[160px]"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          >
            <button
              class="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--accent-bg)]"
              onClick={() => {
                onDelete(block.id);
                setShowContextMenu(false);
              }}
            >
              Delete block
            </button>
            <button
              class="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--accent-bg)]"
              onClick={() => {
                const newBlock = createBlock('text');
                onInsert(block.id, newBlock);
                setTimeout(() => {
                  onFocusNewBlock?.(newBlock.id);
                }, 0);
                setShowContextMenu(false);
              }}
            >
              Add block below
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface SlashMenuProps {
  position: { x: number; y: number };
  options: typeof blockOptions;
  selectedIndex: number;
  onSelect: (type: BlockType['type']) => void;
}

const blockOptions = [
  { type: 'heading1' as const, label: 'Heading 1', icon: 'H1', description: 'Large section heading' },
  { type: 'heading2' as const, label: 'Heading 2', icon: 'H2', description: 'Medium section heading' },
  { type: 'heading3' as const, label: 'Heading 3', icon: 'H3', description: 'Small section heading' },
  { type: 'text' as const, label: 'Text', icon: 'T', description: 'Plain text paragraph' },
  { type: 'quote' as const, label: 'Quote', icon: '"', description: 'Quotation block' },
  { type: 'code' as const, label: 'Code', icon: '<>', description: 'Code with syntax highlighting' },
  { type: 'callout' as const, label: 'Callout', icon: '!', description: 'Highlighted callout box' },
  { type: 'divider' as const, label: 'Divider', icon: '—', description: 'Horizontal divider line' },
  { type: 'image' as const, label: 'Image', icon: '[]', description: 'Upload or embed image' },
  { type: 'database' as const, label: 'Database', icon: '#', description: 'Database view block' },
  { type: 'button' as const, label: 'Button', icon: 'B', description: 'Execute a flow on click' },
];

function SlashMenu({ position, options, selectedIndex, onSelect }: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (menuRef.current) {
      const selected = menuRef.current.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <div 
      ref={menuRef}
      class="fixed z-50 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-lg py-2 min-w-[280px] max-h-[350px] overflow-y-auto outline-none"
      style={{ left: position.x, top: position.y }}
    >
      {options.length === 0 ? (
        <div class="px-3 py-2 text-sm text-[var(--text)]/50">No results</div>
      ) : (
        options.map((opt, i) => (
          <button
            key={opt.type}
            class={`w-full px-3 py-2 text-left flex items-center gap-3 text-[var(--text)] outline-none ${
              i === selectedIndex ? 'bg-[var(--accent-bg)]' : 'hover:bg-[var(--accent-bg)]'
            }`}
            onClick={() => onSelect(opt.type)}
            data-selected={i === selectedIndex}
          >
            <span class="w-8 h-8 flex items-center justify-center bg-[var(--code-bg)] rounded text-sm font-mono shrink-0">
              {opt.icon}
            </span>
            <div class="min-w-0">
              <div class="font-medium truncate">{opt.label}</div>
              <div class="text-xs text-[var(--text)]/50 truncate">{opt.description}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}