import { signal } from '@preact/signals'
import type { SiteSettings, MenuItem, SiteSettingsData } from '../types'
import * as db from '../lib/db'

const defaultSettings: SiteSettings = {
  projectName: 'Mon Site',
  defaultPageId: null,
  menuItems: [],
  githubToken: '',
  vercelToken: '',
  deployProjectName: ''
}

export const siteSettings = signal<SiteSettings>(defaultSettings)

export async function loadSettings() {
  const settingsData: SiteSettingsData = await db.getSettings()
  siteSettings.value = {
    projectName: settingsData.projectName,
    defaultPageId: settingsData.defaultPageId,
    menuItems: JSON.parse(settingsData.menuItemsJson || '[]'),
    githubToken: settingsData.githubToken || '',
    vercelToken: settingsData.vercelToken || '',
    deployProjectName: settingsData.deployProjectName || ''
  }
}

export async function updateProjectName(name: string) {
  await db.updateSettings({ projectName: name })
  siteSettings.value = { ...siteSettings.value, projectName: name }
}

export async function updateDefaultPage(pageId: string | null) {
  await db.updateSettings({ defaultPageId: pageId })
  siteSettings.value = { ...siteSettings.value, defaultPageId: pageId }
}

export async function updateMenuItems(items: MenuItem[]) {
  await db.updateSettings({ menuItemsJson: JSON.stringify(items) })
  siteSettings.value = { ...siteSettings.value, menuItems: items }
}

export async function addMenuItem(item: MenuItem) {
  const items = [...siteSettings.value.menuItems, item]
  await updateMenuItems(items)
}

export async function removeMenuItem(id: string) {
  const items = siteSettings.value.menuItems.filter(item => item.id !== id)
  await updateMenuItems(items)
}

export async function reorderMenuItems(items: MenuItem[]) {
  await updateMenuItems(items)
}

export async function updateSettings(updates: Partial<SiteSettings>) {
  const dbUpdates: Partial<SiteSettingsData> = {}
  if (updates.projectName !== undefined) dbUpdates.projectName = updates.projectName
  if (updates.defaultPageId !== undefined) dbUpdates.defaultPageId = updates.defaultPageId
  if (updates.menuItems !== undefined) dbUpdates.menuItemsJson = JSON.stringify(updates.menuItems)
  if (updates.githubToken !== undefined) dbUpdates.githubToken = updates.githubToken
  if (updates.vercelToken !== undefined) dbUpdates.vercelToken = updates.vercelToken
  if (updates.deployProjectName !== undefined) dbUpdates.deployProjectName = updates.deployProjectName
  
  await db.updateSettings(dbUpdates)
  siteSettings.value = { ...siteSettings.value, ...updates }
}
