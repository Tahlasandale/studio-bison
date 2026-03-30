import { useEffect, useCallback } from 'preact/hooks';
import { canUndo, canRedo, undo, redo } from '../stores/history';
import { updateCurrentPage, currentPageId } from '../stores/editor';

type KeyboardMode = 'editor' | 'slash-menu' | 'context-menu';

interface UseKeyboardNavigationOptions {
  mode?: KeyboardMode;
  onNewline?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onEscape?: () => void;
  onEnter?: () => void;
  onTab?: (shift: boolean) => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  mode = 'editor',
  onNewline,
  onArrowUp,
  onArrowDown,
  onEscape,
  onEnter,
  onTab,
  enabled = true,
}: UseKeyboardNavigationOptions = {}) {
  const handleUndo = useCallback(() => {
    if (!canUndo()) return;
    const entry = undo();
    if (entry && currentPageId.value) {
      updateCurrentPage({ blocks: entry.blocks, title: entry.title });
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (!canRedo()) return;
    const entry = redo();
    if (entry && currentPageId.value) {
      updateCurrentPage({ blocks: entry.blocks, title: entry.title });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (mode === 'editor') {
        if (isCtrl && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
          return;
        }
        if (isCtrl && e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          handleRedo();
          return;
        }
        if (isCtrl && e.key === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      if (mode === 'slash-menu' || mode === 'context-menu') {
        if (e.key === 'Escape') {
          e.preventDefault();
          onEscape?.();
          return;
        }
      }

      if (mode === 'editor') {
        if (isCtrl && e.key === 'Enter') {
          e.preventDefault();
          onNewline?.();
          return;
        }

        if (e.key === 'Tab') {
          e.preventDefault();
          onTab?.(e.shiftKey);
          return;
        }

        if (e.key === 'ArrowUp' && onArrowUp) {
          e.preventDefault();
          onArrowUp();
          return;
        }

        if (e.key === 'ArrowDown' && onArrowDown) {
          e.preventDefault();
          onArrowDown();
          return;
        }

        if (e.key === 'Enter' && onEnter) {
          e.preventDefault();
          onEnter();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode, enabled, handleUndo, handleRedo, onNewline, onArrowUp, onArrowDown, onEscape, onEnter, onTab]);
}
