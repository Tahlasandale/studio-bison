import { pages } from '../stores/editor'
import { siteSettings, updateProjectName, updateDefaultPage, updateMenuItems, removeMenuItem } from '../stores/settings'
import type { MenuItem } from '../types'

export function MenuEditor() {
  const settings = siteSettings.value

  const handleProjectNameChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value
    updateProjectName(value)
  }

  const handleDefaultPageChange = (e: Event) => {
    const value = (e.target as HTMLSelectElement).value || null
    updateDefaultPage(value)
  }

  const handleAddPage = (pageId: string) => {
    if (!pageId) return
    const page = pages.value.find(p => p.id === pageId)
    if (!page) return
    
    const newItem: MenuItem = {
      id: crypto.randomUUID(),
      type: 'page',
      label: page.title || 'Sans titre',
      pageId: page.id,
      order: settings.menuItems.length,
      children: []
    }
    updateMenuItems([...settings.menuItems, newItem])
  }

  const handleAddExternalLink = () => {
    const newItem: MenuItem = {
      id: crypto.randomUUID(),
      type: 'external',
      label: 'Nouveau lien',
      url: 'https://',
      order: settings.menuItems.length,
      children: []
    }
    updateMenuItems([...settings.menuItems, newItem])
  }

  const handleItemChange = (id: string, updates: Partial<MenuItem>) => {
    const newItems = settings.menuItems.map(item => {
      if (item.id === id) {
        return { ...item, ...updates }
      }
      return item
    })
    updateMenuItems(newItems)
  }

  const handleRemoveItem = (id: string) => {
    removeMenuItem(id)
  }

  const handleAddSubmenuPage = (parentId: string) => {
    const parentItem = settings.menuItems.find(item => item.id === parentId)
    if (!parentItem || !parentItem.children || parentItem.children.length >= 10) return
    
    const newItems = settings.menuItems.map(item => {
      if (item.id === parentId) {
        return { 
          ...item, 
          children: [
            ...item.children,
            {
              id: crypto.randomUUID(),
              type: 'page' as const,
              label: 'Nouvelle page',
              pageId: '',
              order: item.children.length,
              children: []
            }
          ]
        }
      }
      return item
    })
    updateMenuItems(newItems)
  }

  const handleAddSubmenuExternal = (parentId: string) => {
    const parentItem = settings.menuItems.find(item => item.id === parentId)
    if (!parentItem || !parentItem.children || parentItem.children.length >= 10) return
    
    const newItems = settings.menuItems.map(item => {
      if (item.id === parentId) {
        return { 
          ...item, 
          children: [
            ...item.children,
            {
              id: crypto.randomUUID(),
              type: 'external' as const,
              label: 'Nouveau lien',
              url: 'https://',
              order: item.children.length,
              children: []
            }
          ]
        }
      }
      return item
    })
    updateMenuItems(newItems)
  }

  const handleRemoveSubmenuItem = (parentId: string, childId: string) => {
    const newItems = settings.menuItems.map(item => {
      if (item.id === parentId && item.children) {
        return {
          ...item,
          children: item.children.filter(child => child.id !== childId)
        }
      }
      return item
    })
    updateMenuItems(newItems)
  }

  const handleSubmenuItemChange = (parentId: string, childId: string, updates: Partial<MenuItem>) => {
    const newItems = settings.menuItems.map(item => {
      if (item.id === parentId && item.children) {
        return {
          ...item,
          children: item.children.map(child => 
            child.id === childId ? { ...child, ...updates } : child
          )
        }
      }
      return item
    })
    updateMenuItems(newItems)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newItems = [...settings.menuItems]
    const temp = newItems[index]
    newItems[index] = newItems[index - 1]
    newItems[index - 1] = temp
    newItems.forEach((item, i) => item.order = i)
    updateMenuItems(newItems)
  }

  const handleMoveDown = (index: number) => {
    if (index === settings.menuItems.length - 1) return
    const newItems = [...settings.menuItems]
    const temp = newItems[index]
    newItems[index] = newItems[index + 1]
    newItems[index + 1] = temp
    newItems.forEach((item, i) => item.order = i)
    updateMenuItems(newItems)
  }

  const availablePages = pages.value.filter(
    page => !settings.menuItems.some(item => item.type === 'page' && item.pageId === page.id)
  )

  return (
    <div class="flex-1 p-6 overflow-auto">
      <h1 class="text-2xl font-bold text-[var(--text)] mb-6">Menu</h1>

      <div class="space-y-8">
        <section class="bg-[var(--code-bg)] border border-[var(--border)] rounded-lg p-4">
          <h2 class="text-lg font-semibold text-[var(--text)] mb-4">Paramètres du site</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--text)] mb-2">
                Nom du projet
              </label>
              <input
                type="text"
                value={settings.projectName}
                onInput={handleProjectNameChange}
                class="w-full px-3 py-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                placeholder="Mon Site"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-[var(--text)] mb-2">
                Page d'accueil (index)
              </label>
              <select
                value={settings.defaultPageId || ''}
                onChange={handleDefaultPageChange}
                class="w-full px-3 py-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
              >
                <option value="">Sélectionner une page...</option>
                {pages.value.map(page => (
                  <option key={page.id} value={page.id}>
                    {page.title || 'Sans titre'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section class="bg-[var(--code-bg)] border border-[var(--border)] rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-[var(--text)]">Navigation</h2>
            <div class="flex gap-2">
              <select
                onChange={(e) => handleAddPage((e.target as HTMLSelectElement).value)}
                class="px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                value=""
              >
                <option value="">+ Ajouter une page</option>
                {availablePages.map(page => (
                  <option key={page.id} value={page.id}>
                    {page.title || 'Sans titre'}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddExternalLink}
                class="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded"
              >
                + Lien externe
              </button>
            </div>
          </div>

          {settings.menuItems.length === 0 ? (
            <p class="text-[var(--text)]/50 text-center py-8">
              Ajoutez des éléments au menu ci-dessus
            </p>
          ) : (
            <div class="space-y-2">
              {settings.menuItems.map((item, index) => (
                <div key={item.id} class="flex items-center gap-2 p-3 bg-[var(--bg)] border border-[var(--border)] rounded">
                  <div class="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      class="text-[var(--text)]/50 hover:text-[var(--text)] disabled:opacity-30"
                      title="Monter"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === settings.menuItems.length - 1}
                      class="text-[var(--text)]/50 hover:text-[var(--text)] disabled:opacity-30"
                      title="Descendre"
                    >
                      ▼
                    </button>
                  </div>

                  <div class="flex-1 flex items-center gap-2">
                    {item.type === 'page' ? (
                      <span class="text-sm text-[var(--text)]">📄 {item.label}</span>
                    ) : (
                      <input
                        type="text"
                        value={item.label}
                        onInput={(e) => handleItemChange(item.id, { label: (e.target as HTMLInputElement).value })}
                        class="px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--code-bg)] text-[var(--text)]"
                        placeholder="Label du lien"
                      />
                    )}
                    
                    {item.type === 'external' && (
                      <input
                        type="text"
                        value={item.url || ''}
                        onInput={(e) => handleItemChange(item.id, { url: (e.target as HTMLInputElement).value })}
                        class="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--code-bg)] text-[var(--text)]"
                        placeholder="https://..."
                      />
                    )}

                    {item.type === 'page' && item.children && item.children.length > 0 && (
                      <div class="ml-4 p-2 bg-[var(--code-bg)] border border-[var(--border)] rounded">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-xs text-[var(--text)]/50">Sous-menu ({item.children.length}/10):</span>
                          {item.children.length < 10 && (
                            <div class="flex gap-1">
                              <button
                                onClick={() => handleAddSubmenuPage(item.id)}
                                class="px-2 py-0.5 text-xs bg-[var(--accent)]/20 text-[var(--accent)] rounded hover:bg-[var(--accent)]/30"
                              >
                                + Page
                              </button>
                              <button
                                onClick={() => handleAddSubmenuExternal(item.id)}
                                class="px-2 py-0.5 text-xs bg-[var(--accent)]/20 text-[var(--accent)] rounded hover:bg-[var(--accent)]/30"
                              >
                                + Lien
                              </button>
                            </div>
                          )}
                        </div>
                        <div class="space-y-1">
                          {item.children.map((child) => (
                            <div key={child.id} class="flex items-center gap-1">
                              {child.type === 'page' ? (
                                <>
                                  <select
                                    value={(child as MenuItem)?.pageId || ''}
                                    onChange={(e) => handleSubmenuItemChange(item.id, child.id, { 
                                      pageId: (e.target as HTMLSelectElement).value,
                                      type: 'page',
                                      label: pages.value.find(p => p.id === (e.target as HTMLSelectElement).value)?.title || 'Page'
                                    })}
                                    class="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                                  >
                                    <option value="">Sélectionner une page...</option>
                                    {pages.value.map(page => (
                                      <option key={page.id} value={page.id}>
                                        {page.title || 'Sans titre'}
                                      </option>
                                    ))}
                                  </select>
                                </>
                              ) : (
                                <>
                                  <input
                                    type="text"
                                    value={child.label || ''}
                                    onInput={(e) => handleSubmenuItemChange(item.id, child.id, { 
                                      label: (e.target as HTMLInputElement).value
                                    })}
                                    class="w-24 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                                    placeholder="Label"
                                  />
                                  <input
                                    type="text"
                                    value={child.url || ''}
                                    onInput={(e) => handleSubmenuItemChange(item.id, child.id, { 
                                      url: (e.target as HTMLInputElement).value
                                    })}
                                    class="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                                    placeholder="https://..."
                                  />
                                </>
                              )}
                              <button
                                onClick={() => handleRemoveSubmenuItem(item.id, child.id)}
                                class="text-red-500 hover:text-red-600 text-xs"
                                title="Supprimer"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {(!item.children || item.children.length === 0) && item.type === 'page' && (
                    <div class="flex gap-1">
                      <button
                        onClick={() => handleAddSubmenuPage(item.id)}
                        class="px-2 py-1 text-xs bg-[var(--accent)]/20 text-[var(--accent)] rounded hover:bg-[var(--accent)]/30"
                        title="Ajouter une page"
                      >
                        + Page
                      </button>
                      <button
                        onClick={() => handleAddSubmenuExternal(item.id)}
                        class="px-2 py-1 text-xs bg-[var(--accent)]/20 text-[var(--accent)] rounded hover:bg-[var(--accent)]/30"
                        title="Ajouter un lien externe"
                      >
                        + Lien
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    class="text-red-500 hover:text-red-600 p-1"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section class="bg-[var(--code-bg)] border border-[var(--border)] rounded-lg p-4">
          <h2 class="text-lg font-semibold text-[var(--text)] mb-2">Aperçu</h2>
          <p class="text-sm text-[var(--text)]/50 mb-4">
            Voici comment votre menu apparaîtra sur le site exporté :
          </p>
          <div class="border border-[var(--border)] rounded p-4 bg-[var(--bg)]">
            <nav class="flex items-center gap-4">
              <a href="#" class="font-bold text-[var(--text)]">{settings.projectName}</a>
              <ul class="flex gap-4">
                {settings.menuItems.map(item => (
                  <li key={item.id} class="relative">
                    {item.type === 'page' ? (
                      <span class="text-[var(--text)]">{item.label}</span>
                    ) : (
                      <a href={item.url} class="text-[var(--text)]">{item.label}</a>
                    )}
                    {item.children && item.children.length > 0 && (
                      <ul class="absolute top-full left-0 mt-1 bg-[var(--bg)] border border-[var(--border)] rounded shadow-lg min-w-[150px]">
                        {item.children.map(child => (
                          <li key={child.id} class="px-3 py-2 text-[var(--text)] hover:bg-[var(--code-bg)]">
                            {child.type === 'page' 
                              ? (pages.value.find(p => p.id === child.pageId)?.title || 'Page')
                              : child.label
                            }
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>
      </div>
    </div>
  )
}
