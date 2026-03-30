export type BlockType = 
  | 'text' 
  | 'heading1' 
  | 'heading2' 
  | 'heading3' 
  | 'image' 
  | 'code' 
  | 'divider' 
  | 'quote' 
  | 'callout' 
  | 'database'
  | 'button'
  | 'embed';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  properties?: Record<string, unknown> & {
    linkType?: 'none' | 'page' | 'external';
    pageId?: string;
    url?: string;
    language?: string;
    schemaId?: string;
    hiddenColumns?: string[];
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
  };
  children: unknown[];
  collapsed?: boolean;
}

export interface Page {
  id: string;
  title: string;
  icon?: string;
  cover?: string;
  parentId?: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
}

export interface DatabaseSchema {
  id: string;
  name: string;
  columns: DatabaseColumn[];
  relations: DatabaseRelation[];
}

export interface DatabaseColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'relation' | 'checkbox';
  options?: string[];
}

export interface DatabaseRelation {
  id: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: '1:1' | '1:N' | 'N:N';
}

export interface Database {
  id: string;
  schemaId: string;
  data: Record<string, unknown>[];
}

export interface MenuItem {
  id: string;
  type: 'page' | 'external';
  label: string;
  pageId?: string;
  url?: string;
  order: number;
  children: MenuItem[];
}

export interface SiteSettings {
  projectName: string;
  defaultPageId: string | null;
  menuItems: MenuItem[];
  githubToken?: string;
  vercelToken?: string;
  deployProjectName?: string;
}

export interface SiteSettingsData {
  id: string;
  projectName: string;
  defaultPageId: string | null;
  menuItemsJson: string;
  githubToken?: string;
  vercelToken?: string;
  deployProjectName?: string;
}