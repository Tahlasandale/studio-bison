import { signal, computed } from '@preact/signals';
import type { Page, Block } from '../types';
import * as db from '../lib/db';
import { pushHistory } from './history';

export const pages = signal<Page[]>([]);
export const currentPageId = signal<string | null>(null);
export const isLoading = signal(false);

export const currentPage = computed(() => 
  pages.value.find(p => p.id === currentPageId.value)
);

export async function loadPages() {
  isLoading.value = true;
  try {
    pages.value = await db.getPageTree();
  } finally {
    isLoading.value = false;
  }
}

export async function createNewPage(title?: string, parentId?: string) {
  const page = await db.createPage(title, parentId);
  pages.value = [page, ...pages.value];
  currentPageId.value = page.id;
  return page;
}

export async function openPage(id: string) {
  const page = await db.getPage(id);
  if (page) {
    const existing = pages.value.find(p => p.id === id);
    if (existing) {
      pages.value = pages.value.map(p => p.id === id ? page : p);
    } else {
      pages.value = [page, ...pages.value];
    }
    currentPageId.value = id;
  }
}

export async function updateCurrentPage(updates: Partial<Page>) {
  if (!currentPageId.value) return;
  
  const currentPage = pages.value.find(p => p.id === currentPageId.value);
  if (currentPage && ('blocks' in updates || 'title' in updates)) {
    pushHistory({
      blocks: currentPage.blocks,
      title: currentPage.title
    });
  }
  
  await db.updatePage(currentPageId.value, updates);
  pages.value = pages.value.map(p => 
    p.id === currentPageId.value ? { ...p, ...updates } : p
  );
}

export async function deleteCurrentPage() {
  if (!currentPageId.value) return;
  await db.deletePage(currentPageId.value);
  pages.value = pages.value.filter(p => p.id !== currentPageId.value);
  currentPageId.value = pages.value[0]?.id ?? null;
}

export function generateBlockId(): string {
  return crypto.randomUUID();
}

export function createBlock(type: Block['type'], content = ''): Block {
  return {
    id: generateBlockId(),
    type,
    content,
    children: []
  };
}