import { signal } from '@preact/signals'

export type Route = 'editor' | 'database' | 'menu' | 'settings'

export const currentRoute = signal<Route>('editor')
export const routeReady = signal(false)

const ROUTES: Record<string, Route> = {
  '': 'editor',
  'editor': 'editor',
  'database': 'database',
  'menu': 'menu',
  'settings': 'settings'
}

function getRouteFromHash(): Route {
  const hash = window.location.hash.slice(1).replace(/^\/+/, '')
  return ROUTES[hash] || 'editor'
}

function handleHashChange() {
  currentRoute.value = getRouteFromHash()
}

export function initRouter() {
  window.addEventListener('hashchange', handleHashChange)
  currentRoute.value = getRouteFromHash()
  routeReady.value = true
}

export function navigate(route: Route) {
  window.location.hash = '/' + route
}
