import { siteSettings, updateSettings } from '../stores/settings'

export function SettingsEditor() {
  const settings = siteSettings.value

  const handleGithubTokenChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value
    updateSettings({ githubToken: value })
  }

  const handleVercelTokenChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value
    updateSettings({ vercelToken: value })
  }

  return (
    <div class="flex-1 p-6 overflow-auto">
      <h1 class="text-2xl font-bold text-[var(--text)] mb-6">Paramètres</h1>

      <div class="space-y-8">
        <section class="bg-[var(--code-bg)] border border-[var(--border)] rounded-lg p-4">
          <h2 class="text-lg font-semibold text-[var(--text)] mb-4">Déploiement</h2>
          <p class="text-sm text-[var(--text)]/50 mb-4">
            Configurez vos tokens pour publier votre site sur GitHub et Vercel.
          </p>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--text)] mb-2">
                <span class="flex items-center gap-2">
                  GitHub Token
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo" 
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs text-[var(--accent)] hover:underline"
                  >
                    Obtenir un token
                  </a>
                </span>
              </label>
              <input
                type="password"
                value={settings.githubToken || ''}
                onInput={handleGithubTokenChange}
                class="w-full px-3 py-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                placeholder="ghp_..."
              />
              <p class="text-xs text-[var(--text)]/50 mt-1">
                Token avec permission repo (pour créer/pousser vers un dépôt)
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-[var(--text)] mb-2">
                <span class="flex items-center gap-2">
                  Vercel Token
                  <a 
                    href="https://vercel.com/account/tokens" 
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs text-[var(--accent)] hover:underline"
                  >
                    Obtenir un token
                  </a>
                </span>
              </label>
              <input
                type="password"
                value={settings.vercelToken || ''}
                onInput={handleVercelTokenChange}
                class="w-full px-3 py-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)]"
                placeholder="vrc_..."
              />
            </div>
          </div>
        </section>

        <section class="bg-[var(--code-bg)] border border-[var(--border)] rounded-lg p-4">
          <h2 class="text-lg font-semibold text-[var(--text)] mb-4">Statut</h2>
          
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class={`w-2 h-2 rounded-full ${settings.githubToken ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span class="text-sm text-[var(--text)]">
                GitHub: {settings.githubToken ? 'Configuré' : 'Non configuré'}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class={`w-2 h-2 rounded-full ${settings.vercelToken ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span class="text-sm text-[var(--text)]">
                Vercel: {settings.vercelToken ? 'Configuré' : 'Non configuré'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
