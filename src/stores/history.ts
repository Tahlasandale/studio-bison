import { signal } from '@preact/signals';
import type { Page } from '../types';

interface HistoryEntry {
  blocks: Page['blocks'];
  title: string;
}

const MAX_HISTORY = 50;

export const history = signal<HistoryEntry[]>([]);
export const historyIndex = signal(0);

export function canUndo() {
  return historyIndex.value > 0;
}

export function canRedo() {
  return historyIndex.value < history.value.length - 1;
}

export function initHistory(entry: HistoryEntry) {
  history.value = [entry];
  historyIndex.value = 0;
}

export function pushHistory(entry: HistoryEntry) {
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }
  
  history.value.push(entry);
  
  if (history.value.length > MAX_HISTORY) {
    history.value = history.value.slice(-MAX_HISTORY);
  }
  
  historyIndex.value = history.value.length - 1;
}

export function undo(): HistoryEntry | null {
  if (!canUndo()) return null;
  historyIndex.value--;
  return history.value[historyIndex.value];
}

export function redo(): HistoryEntry | null {
  if (!canRedo()) return null;
  historyIndex.value++;
  return history.value[historyIndex.value];
}

export function clearHistory() {
  history.value = [];
  historyIndex.value = 0;
}
