import { signal } from '@preact/signals';

export const focusNewBlockId = signal<string | null>(null);
export const focusPreviousBlockId = signal<string | null>(null);

export function setFocusNewBlock(id: string | null) {
  focusNewBlockId.value = id;
}

export function setFocusPreviousBlock(id: string | null) {
  focusPreviousBlockId.value = id;
}