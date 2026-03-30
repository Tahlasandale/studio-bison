import { useState } from 'preact/hooks'
import { clsx } from 'clsx'
import { currentRoute } from '../lib/router'
import { exportProject, downloadProject, loadProjectFromFile, importProject, getDatabases } from '../lib/db'
import { loadPages, pages } from '../stores/editor'
import { loadSchemas, selectSchema, activeSchemaId, schemas } from '../stores/database'
import { siteSettings } from '../stores/settings'
import { generateFullExport, downloadZIP } from '../lib/export'
import { publishProject } from '../lib/publisher'
import { PublishModal } from './PublishModal'

interface NavProps {}

export function NavigationBar({}: NavProps) {
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishLogs, setPublishLogs] = useState<string[]>([])
  const [publishResult, setPublishResult] = useState<{ success: boolean; liveUrl?: string; repoUrl?: string; error?: string } | null>(null)

  const canPublish = siteSettings.value.githubToken && siteSettings.value.vercelToken

  const addLog = (log: string) => {
    setPublishLogs(prev => [...prev, log])
  }

  const handleExportJSON = async () => {
    const projectName = siteSettings.value.projectName || 'project'
    const data = await exportProject()
    downloadProject(data, projectName)
  }

  const handleExportHTML = async () => {
    try {
      const databases = await getDatabases()
      const result = await generateFullExport(
        pages.value,
        schemas.value,
        databases || [],
        siteSettings.value
      )
      await downloadZIP(result, siteSettings.value.projectName)
      alert('Export HTML généré avec succès!')
    } catch (err) {
      alert('Erreur lors de l\'export: ' + (err as Error).message)
    }
  }

  const handlePublish = async () => {
    if (!canPublish) {
      window.location.hash = '/settings'
      return
    }

    setPublishing(true)
    setPublishLogs([])
    setPublishResult(null)
    setPublishModalOpen(true)

    try {
      const databases = await getDatabases()
      const exportResult = await generateFullExport(
        pages.value,
        schemas.value,
        databases || [],
        siteSettings.value
      )
      
      const htmlFiles: Record<string, string> = {}
      for (const file of exportResult.htmlFiles) {
        htmlFiles[file.path] = file.content
      }
      
      const result = await publishProject(
        siteSettings.value.githubToken || '',
        siteSettings.value.vercelToken || '',
        siteSettings.value.projectName || 'mon-projet',
        htmlFiles,
        exportResult.cssContent,
        exportResult.images,
        addLog
      )
      setPublishResult(result)
    } catch (err) {
      setPublishResult({
        success: false,
        error: (err as Error).message
      })
    } finally {
      setPublishing(false)
    }
  }

  const handleImport = async (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    try {
      const data = await loadProjectFromFile(file)
      await importProject(data)
      await loadPages()
      await loadSchemas()
      activeSchemaId.value = null
      
      if (data.pages.length > 0) {
        await selectSchema(data.pages[0].id)
      }
      
      alert('Project imported successfully!')
    } catch (err) {
      alert('Failed to import project: ' + (err as Error).message)
    }
    
    input.value = ''
  }

  return (
    <>
      <div class="flex items-center justify-between p-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-1">
          <a
            href="#/editor"
            class={clsx(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              currentRoute.value === 'editor'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            Editor
          </a>
          <a
            href="#/database"
            class={clsx(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              currentRoute.value === 'database'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            Database
          </a>
          <a
            href="#/menu"
            class={clsx(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              currentRoute.value === 'menu'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            Menu
          </a>
          <a
            href="#/settings"
            class={clsx(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              currentRoute.value === 'settings'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            Paramètres
          </a>
        </div>

        <div class="flex items-center gap-2">
          <label class="px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Ouvrir
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              class="hidden"
            />
          </label>
          <button
            onClick={handleExportJSON}
            class="px-3 py-1.5 text-sm font-medium rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Exporter (JSON)
          </button>
          <button
            onClick={handleExportHTML}
            class="px-3 py-1.5 text-sm font-medium rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Exporter (HTML)
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            class={clsx(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              canPublish
                ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                : 'bg-gray-400 text-white cursor-not-allowed'
            )}
          >
            {publishing ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </div>

      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        logs={publishLogs}
        result={publishResult}
      />
    </>
  )
}
