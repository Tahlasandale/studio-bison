export interface PublishResult {
  success: boolean;
  liveUrl?: string;
  repoUrl?: string;
  error?: string;
}

export interface ImageAsset {
  filename: string;
  data: string;
  mimeType: string;
}

function slugify(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project'
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<unknown> {
  const response = await fetch(url, options)
  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { message: text }
  }
  if (!response.ok) {
    const msg = data && typeof data === 'object' && 'message' in data 
      ? (data as { message: string }).message 
      : `HTTP ${response.status}`
    throw new Error(msg)
  }
  return data
}

async function getShaIfExists(url: string, token: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: { 'Authorization': `token ${token}` }
  })
  if (res.status === 200) {
    const data = await res.json() as { sha: string }
    return data.sha
  }
  return null
}

async function createOrUpdateFile(
  token: string, 
  owner: string, 
  repo: string, 
  path: string, 
  content: string, 
  message: string,
  existingSha?: string | null
): Promise<void> {
  const body: Record<string, unknown> = {
    message,
    content: btoa(unescape(encodeURIComponent(content)))
  }
  if (existingSha) {
    body.sha = existingSha
  }
  
  await apiFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
}

async function waitForDeployment(
  vercelToken: string,
  projectName: string,
  onLog: (log: string) => void,
  maxWaitMs: number = 120000
): Promise<string> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitMs) {
    const deployments = await apiFetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectName}&limit=1`,
      { headers: { 'Authorization': `Bearer ${vercelToken}` } }
    ) as { deployments?: { url: string; readyState: string }[] }
    
    const latest = deployments.deployments?.[0]
    
    if (latest?.readyState === 'READY') {
      const url = latest.url
      return url.startsWith('https://') ? url : `https://${url}`
    }
    
    if (latest?.readyState === 'ERROR') {
      throw new Error('Le déploiement a échoué')
    }
    
    onLog('> En attente du déploiement...')
    await new Promise(r => setTimeout(r, 3000))
  }
  
  throw new Error('Timeout: le déploiement prend trop de temps')
}

export async function publishProject(
  githubToken: string,
  vercelToken: string,
  projectName: string,
  htmlFiles: Record<string, string>,
  cssContent: string,
  images: ImageAsset[],
  onLog: (log: string) => void
): Promise<PublishResult> {
  const slug = slugify(projectName)

  onLog('> [1/6] Connexion à GitHub...')
  
  const ghUser = await apiFetch('https://api.github.com/user', {
    headers: { 
      'Authorization': `token ${githubToken}`, 
      'Accept': 'application/vnd.github.v3+json' 
    }
  }) as { login: string }

  onLog(`> [2/6] Utilisateur GitHub: ${ghUser.login}`)

  onLog(`> [3/6] Préparation du dépôt "${slug}"...`)
  
  let repoData: { full_name: string; html_url: string; default_branch: string }
  const checkRes = await fetch(`https://api.github.com/repos/${ghUser.login}/${slug}`, { 
    headers: { 'Authorization': `token ${githubToken}` } 
  })
  
  if (checkRes.status === 200) {
    repoData = await checkRes.json() as { full_name: string; html_url: string; default_branch: string }
    onLog('> Dépôt existant')
  } else {
    repoData = await apiFetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: { 
        'Authorization': `token ${githubToken}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        name: slug, 
        private: false, 
        auto_init: true,
        description: `Site generated with Studio Bison - ${projectName}`
      })
    }) as { full_name: string; html_url: string; default_branch: string }
    onLog('> Dépôt créé')
  }

  onLog('> [4/6] Vérification/configuration Vercel...')

  const projectsRes = await fetch(`https://api.vercel.com/v6/projects?name=${slug}`, {
    headers: { 'Authorization': `Bearer ${vercelToken}` }
  })
  const projectsData = await projectsRes.json() as { 
    projects?: { 
      id: string
      name: string
      link?: { org: string; repo: string }
    }[] 
  }
  
  let vercelProjectName = slug
  const existingProject = projectsData.projects?.find(p => p.name === slug)
  const isLinked = existingProject?.link?.org === ghUser.login && existingProject?.link?.repo === slug

  if (existingProject && isLinked) {
    vercelProjectName = existingProject.name
    onLog('> Projet Vercel déjà lié à GitHub')
  } else if (existingProject && !isLinked) {
    onLog('> Lien du projet Vercel vers GitHub...')
    const updateRes = await apiFetch(`https://api.vercel.com/v9/projects/${slug}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${vercelToken}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        gitRepository: {
          type: 'github',
          repo: `${ghUser.login}/${slug}`
        }
      })
    }) as { name: string }
    vercelProjectName = updateRes.name
    onLog('> Projet lié')
  } else {
    onLog('> Création du projet Vercel avec lien GitHub...')
    const createRes = await apiFetch('https://api.vercel.com/v11/projects', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${vercelToken}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        name: slug,
        gitRepository: {
          type: 'github',
          repo: `${ghUser.login}/${slug}`
        }
      })
    }) as { name: string }
    vercelProjectName = createRes.name
    onLog('> Projet créé et lié')
  }

  onLog('> [5/6] Import des fichiers dans le dépôt GitHub...')

  const filesToCommit: { path: string; content: string }[] = []
  filesToCommit.push({ path: 'styles.css', content: cssContent })
  
  for (const [path, content] of Object.entries(htmlFiles)) {
    filesToCommit.push({ path, content })
  }

  for (const image of images) {
    const binary = atob(image.data)
    let content = ''
    for (let i = 0; i < binary.length; i++) {
      content += String.fromCharCode(binary.charCodeAt(i) & 0xff)
    }
    filesToCommit.push({ path: `assets/${image.filename}`, content })
  }

  for (const file of filesToCommit) {
    const sha = await getShaIfExists(
      `https://api.github.com/repos/${ghUser.login}/${slug}/contents/${file.path}`,
      githubToken
    )
    await createOrUpdateFile(
      githubToken,
      ghUser.login,
      slug,
      file.path,
      file.content,
      `Add ${file.path}`,
      sha
    )
    onLog(`>   - ${file.path}`)
  }

  onLog('> [6/6] Déploiement en cours...')

  const liveUrl = await waitForDeployment(vercelToken, vercelProjectName, onLog)

  onLog('> Terminé !')
  onLog(`> URL: ${liveUrl}`)

  return {
    success: true,
    liveUrl,
    repoUrl: repoData.html_url
  }
}
