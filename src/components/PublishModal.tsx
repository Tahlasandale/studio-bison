import { useRef, useEffect } from 'preact/hooks'

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  logs: string[]
  result: { success: boolean; liveUrl?: string; repoUrl?: string; error?: string } | null
}

export function PublishModal({ isOpen, onClose, logs, result }: PublishModalProps) {
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  if (!isOpen) return null

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        class="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div class="relative bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 class="text-lg font-bold text-[var(--text)]">Publication du site</h2>
          <button 
            onClick={onClose}
            class="text-[var(--text)]/50 hover:text-[var(--text)] text-xl"
          >
            ×
          </button>
        </div>

        <div class="flex-1 overflow-auto p-4">
          <div class="bg-[var(--code-bg)] border border-[var(--border)] rounded-lg p-3 font-mono text-xs text-[var(--text)] overflow-auto max-h-48">
            {logs.length === 0 ? (
              <span class="text-[var(--text)]/50">En attente...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} class="whitespace-pre-wrap">{log}</div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>

          {result && (
            <div class="mt-4">
              {result.success ? (
                <div class="space-y-4">
                  <div class="flex items-center gap-2 text-green-500">
                    <span class="text-xl">✓</span>
                    <span class="font-semibold">Publication réussie !</span>
                  </div>
                  
                  <div class="space-y-2">
                    <div class="text-sm">
                      <span class="text-[var(--text)]/70">URL de production: </span>
                      <a 
                        href={result.liveUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="text-[var(--accent)] hover:underline"
                      >
                        {result.liveUrl}
                      </a>
                    </div>
                    <div class="text-sm">
                      <span class="text-[var(--text)]/70">Dépôt: </span>
                      <a 
                        href={result.repoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="text-[var(--accent)] hover:underline"
                      >
                        {result.repoUrl}
                      </a>
                    </div>
                  </div>

                  <div class="flex gap-2 pt-2">
                    <a
                      href={result.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex-1 text-center py-2 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90"
                    >
                      Ouvrir le site
                    </a>
                    <a
                      href={result.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex-1 text-center py-2 bg-[var(--code-bg)] text-[var(--text)] border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--border)]"
                    >
                      Voir le dépôt
                    </a>
                  </div>
                </div>
              ) : (
                <div class="flex items-center gap-2 text-red-500">
                  <span class="text-xl">✕</span>
                  <span class="font-semibold">Erreur: {result.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
