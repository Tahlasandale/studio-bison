import Dexie, { type Table } from 'dexie';
import type { Page, DatabaseSchema, Database, Block, SiteSettingsData } from '../types';

interface PageMeta {
  id: string;
  title: string;
  icon?: string;
  cover?: string;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
}

interface PageBlocks {
  pageId: string;
  blocks: Block[];
}

export class BisonDB extends Dexie {
  pages!: Table<PageMeta>;
  pageBlocks!: Table<PageBlocks>;
  databases!: Table<Database>;
  schemas!: Table<DatabaseSchema>;
  settings!: Table<SiteSettingsData>;

  constructor() {
    super('studio-bison-v3');
    
    this.version(1).stores({
      pages: 'id, parentId, updatedAt',
      pageBlocks: 'pageId',
      databases: 'id, schemaId',
      schemas: 'id'
    });
    
    this.version(2).stores({
      pages: 'id, parentId, updatedAt',
      pageBlocks: 'pageId',
      databases: 'id, schemaId',
      schemas: 'id',
      settings: 'id'
    }).upgrade(tx => {
      return tx.table('settings').add({
        id: 'site',
        projectName: 'Mon Site',
        defaultPageId: null,
        menuItemsJson: '[]'
      });
    });
    
    this.version(3).stores({
      pages: 'id, parentId, updatedAt',
      pageBlocks: 'pageId',
      databases: 'id, schemaId',
      schemas: 'id',
      settings: 'id'
    }).upgrade(tx => {
      return tx.table('settings').where('id').equals('site').modify(s => {
        s.githubToken = '';
        s.vercelToken = '';
        s.deployProjectName = '';
      });
    });
  }
}

export const db = new BisonDB();

export async function createPage(title: string = 'Untitled', parentId?: string): Promise<Page> {
  const now = Date.now();
  const id = crypto.randomUUID();
  
  const pageMeta: PageMeta = {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    parentId
  };
  
  await db.pages.add(pageMeta);
  await db.pageBlocks.add({ pageId: id, blocks: [] });
  
  return { ...pageMeta, blocks: [] };
}

export async function getPage(id: string): Promise<Page | undefined> {
  const meta = await db.pages.get(id);
  const blocks = await db.pageBlocks.get(id);
  if (!meta) return undefined;
  return { ...meta, blocks: blocks?.blocks ?? [] };
}

export async function updatePage(id: string, updates: Partial<Page>): Promise<void> {
  const metaUpdates: Partial<PageMeta> = {};
  if (updates.title !== undefined) metaUpdates.title = updates.title;
  if (updates.icon !== undefined) metaUpdates.icon = updates.icon;
  if (updates.cover !== undefined) metaUpdates.cover = updates.cover;
  if (updates.parentId !== undefined) metaUpdates.parentId = updates.parentId;
  
  if (Object.keys(metaUpdates).length > 0) {
    await db.pages.update(id, { ...metaUpdates, updatedAt: Date.now() });
  }
  
  if (updates.blocks !== undefined) {
    await db.pageBlocks.update(id, { blocks: updates.blocks });
  }
}

export async function deletePage(id: string): Promise<void> {
  const children = await db.pages.where('parentId').equals(id).toArray();
  for (const child of children) {
    await deletePage(child.id);
  }
  await db.pages.delete(id);
  await db.pageBlocks.delete(id);
}

export async function getPageTree(): Promise<Page[]> {
  const pages = await db.pages.orderBy('updatedAt').reverse().toArray();
  const result: Page[] = [];
  for (const meta of pages) {
    const blocks = await db.pageBlocks.get(meta.id);
    result.push({ ...meta, blocks: (blocks?.blocks ?? []) as Block[] });
  }
  return result;
}

// ==================== DATABASE FUNCTIONS ====================

export async function createSchema(name: string): Promise<DatabaseSchema> {
  const schema: DatabaseSchema = {
    id: crypto.randomUUID(),
    name,
    columns: [],
    relations: []
  };
  await db.schemas.add(schema);
  return schema;
}

export async function getSchemas(): Promise<DatabaseSchema[]> {
  return db.schemas.toArray();
}

export async function getSchema(id: string): Promise<DatabaseSchema | undefined> {
  return db.schemas.get(id);
}

export async function updateSchema(id: string, updates: Partial<DatabaseSchema>): Promise<void> {
  await db.schemas.update(id, updates);
}

export async function deleteSchema(id: string): Promise<void> {
  await db.schemas.delete(id);
  await db.databases.where('schemaId').equals(id).delete();
}

export async function createDatabase(schemaId: string): Promise<Database> {
  const database: Database = {
    id: crypto.randomUUID(),
    schemaId,
    data: []
  };
  await db.databases.add(database);
  return database;
}

export async function getDatabases(): Promise<Database[]> {
  return db.databases.toArray();
}

export async function getDatabaseBySchema(schemaId: string): Promise<Database | undefined> {
  return db.databases.where('schemaId').equals(schemaId).first();
}

export async function getDatabase(id: string): Promise<Database | undefined> {
  return db.databases.get(id);
}

export async function updateDatabase(id: string, data: Record<string, unknown>[]): Promise<void> {
  await db.databases.update(id, { data });
}

export async function addDatabaseRow(databaseId: string, row: Record<string, unknown>): Promise<void> {
  const dbEntry = await db.databases.get(databaseId);
  if (dbEntry) {
    const newData = [...dbEntry.data, { ...row, id: crypto.randomUUID(), createdAt: Date.now() }];
    await db.databases.update(databaseId, { data: newData });
  }
}

export async function updateDatabaseRow(databaseId: string, rowId: string, updates: Record<string, unknown>): Promise<void> {
  const dbEntry = await db.databases.get(databaseId);
  if (dbEntry) {
    const newData = dbEntry.data.map(row => 
      row.id === rowId ? { ...row, ...updates, updatedAt: Date.now() } : row
    );
    await db.databases.update(databaseId, { data: newData });
  }
}

export async function deleteDatabaseRow(databaseId: string, rowId: string): Promise<void> {
  const dbEntry = await db.databases.get(databaseId);
  if (dbEntry) {
    const newData = dbEntry.data.filter(row => row.id !== rowId);
    await db.databases.update(databaseId, { data: newData });
  }
}

// ==================== EXPORT/IMPORT ====================

export interface ProjectData {
  version: string;
  exportedAt: number;
  pages: Page[];
  schemas: DatabaseSchema[];
  databases: Database[];
}

export async function exportProject(): Promise<ProjectData> {
  const pages = await getPageTree();
  const schemas = await getSchemas();
  const databases = await getDatabases();

  return {
    version: '1.0',
    exportedAt: Date.now(),
    pages,
    schemas,
    databases
  };
}

export async function importProject(data: ProjectData): Promise<void> {
  await db.pages.clear();
  await db.pageBlocks.clear();
  await db.schemas.clear();
  await db.databases.clear();

  for (const page of data.pages) {
    const { blocks, ...meta } = page;
    await db.pages.add(meta);
    await db.pageBlocks.add({ pageId: page.id, blocks: blocks || [] });
  }

  for (const schema of data.schemas) {
    await db.schemas.add(schema);
  }

  for (const database of data.databases) {
    await db.databases.add(database);
  }
}

export function downloadProject(data: ProjectData, projectName?: string): void {
  const name = projectName || 'project'
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function loadProjectFromFile(file: File): Promise<ProjectData> {
  const text = await file.text();
  const data = JSON.parse(text) as ProjectData;
  return data;
}

// ==================== SETTINGS FUNCTIONS ====================

const DEFAULT_SETTINGS: SiteSettingsData = {
  id: 'site',
  projectName: 'Mon Site',
  defaultPageId: null,
  menuItemsJson: '[]',
  githubToken: '',
  vercelToken: '',
  deployProjectName: ''
};

export async function getSettings(): Promise<SiteSettingsData> {
  const settings = await db.settings.get('site');
  if (!settings) {
    await db.settings.add(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return settings;
}

export async function updateSettings(updates: Partial<Omit<SiteSettingsData, 'id'>>): Promise<void> {
  const current = await getSettings();
  const { id, ...currentData } = current;
  await db.settings.update('site', { ...currentData, ...updates });
}
