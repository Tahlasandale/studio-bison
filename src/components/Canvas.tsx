import { useState, useCallback } from 'preact/hooks';
import type { Block, Page } from '../types';
import { BlockTree } from './BlockTree';
import { updateCurrentPage } from '../stores/editor';
import { useKeyboardNavigation } from '../lib/useKeyboardNavigation';

interface CanvasProps {
  page: Page;
}

export function Canvas({ page }: CanvasProps) {
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  const handleBlocksUpdate = (blocks: Block[]) => {
    updateCurrentPage({ blocks });
  };

  const handleUpdateBlock = (id: string, updates: Partial<Block>) => {
    const newBlocks = page.blocks.map(b => 
      b.id === id ? { ...b, ...updates } : b
    );
    handleBlocksUpdate(newBlocks);
  };

  const handleDeleteBlock = (id: string) => {
    const currentIndex = page.blocks.findIndex(b => b.id === id);
    const previousBlock = page.blocks[currentIndex - 1];
    const newBlocks = page.blocks.filter(b => b.id !== id);
    handleBlocksUpdate(newBlocks);
    if (previousBlock) {
      setTimeout(() => focusBlockById(previousBlock.id), 10);
    }
  };

  const handleMergeWithPrevious = (id: string) => {
    const currentIndex = page.blocks.findIndex(b => b.id === id);
    const currentBlock = page.blocks[currentIndex];
    const previousBlock = page.blocks[currentIndex - 1];

    if (!previousBlock || !currentBlock) return;

    const mergedContent = previousBlock.content + currentBlock.content;
    const newBlocks = page.blocks.map(b => 
      b.id === previousBlock.id ? { ...b, content: mergedContent } : b
    ).filter(b => b.id !== id);

    handleBlocksUpdate(newBlocks);
    setTimeout(() => {
      const blockEl = document.querySelector(`[data-block-id="${previousBlock.id}"]`);
      if (blockEl) {
        const textarea = blockEl.querySelector('textarea') as HTMLTextAreaElement;
        const input = blockEl.querySelector('input') as HTMLInputElement;
        const target = textarea || input;
        if (target) {
          target.focus();
          target.setSelectionRange(previousBlock.content.length, previousBlock.content.length);
        }
      }
    }, 10);
  };

  const handleInsertBlock = (afterId: string, block: Block) => {
    const index = page.blocks.findIndex(b => b.id === afterId);
    if (index !== -1) {
      const newBlocks = [
        ...page.blocks.slice(0, index + 1),
        block,
        ...page.blocks.slice(index + 1)
      ];
      handleBlocksUpdate(newBlocks);
      setTimeout(() => focusBlockById(block.id), 10);
    }
  };

  const handleMoveBlock = (fromIndex: number, toIndex: number, position: 'before' | 'after') => {
    const newBlocks = [...page.blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    
    let insertIndex = toIndex;
    if (position === 'after') {
      insertIndex = toIndex + 1;
    }
    
    if (fromIndex < toIndex) {
      insertIndex = toIndex;
    }
    
    newBlocks.splice(insertIndex, 0, movedBlock);
    handleBlocksUpdate(newBlocks);
  };

  const handleFocusBlock = useCallback((id: string, direction: 'up' | 'down') => {
    const currentIndex = page.blocks.findIndex(b => b.id === id);
    let targetIndex: number;
    
    if (direction === 'up') {
      targetIndex = currentIndex - 1;
    } else {
      targetIndex = currentIndex + 1;
    }
    
    if (targetIndex >= 0 && targetIndex < page.blocks.length) {
      focusBlockById(page.blocks[targetIndex].id);
    }
  }, [page.blocks]);

  const focusBlockById = (id: string) => {
    const blockEl = document.querySelector(`[data-block-id="${id}"]`) as HTMLDivElement;
    if (!blockEl) return;
    
    const textarea = blockEl.querySelector('textarea') as HTMLTextAreaElement;
    const input = blockEl.querySelector('input') as HTMLInputElement;
    const fileInput = blockEl.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (textarea) {
      textarea.focus();
    } else if (input) {
      input.focus();
    } else if (fileInput) {
      fileInput.click();
    } else {
      const clickableEl = blockEl.querySelector('[tabindex]') as HTMLElement;
      if (clickableEl) {
        clickableEl.click();
        clickableEl.focus();
      }
    }
  };

  const handleFocusNewBlock = useCallback((id: string) => {
    setFocusedBlockId(id);
    setTimeout(() => focusBlockById(id), 10);
  }, []);

  const handleAppendBlock = (block: Block) => {
    handleBlocksUpdate([...page.blocks, block]);
    setTimeout(() => focusBlockById(block.id), 10);
  };

  const focusNextBlock = useCallback(() => {
    if (!focusedBlockId) {
      if (page.blocks.length > 0) {
        focusBlockById(page.blocks[0].id);
      }
      return;
    }
    const currentIndex = page.blocks.findIndex(b => b.id === focusedBlockId);
    if (currentIndex < page.blocks.length - 1) {
      focusBlockById(page.blocks[currentIndex + 1].id);
    }
  }, [focusedBlockId, page.blocks]);

  const focusPrevBlock = useCallback(() => {
    if (!focusedBlockId) {
      if (page.blocks.length > 0) {
        focusBlockById(page.blocks[page.blocks.length - 1].id);
      }
      return;
    }
    const currentIndex = page.blocks.findIndex(b => b.id === focusedBlockId);
    if (currentIndex > 0) {
      focusBlockById(page.blocks[currentIndex - 1].id);
    }
  }, [focusedBlockId, page.blocks]);

  useKeyboardNavigation({
    onTab: (shift) => {
      if (shift) {
        focusPrevBlock();
      } else {
        focusNextBlock();
      }
    },
    enabled: true,
  });

  return (
    <main class="flex-1 h-screen overflow-y-auto bg-[var(--bg)]">
      <div class="max-w-3xl mx-auto px-16 py-12">
        <input
          type="text"
          class="w-full text-4xl font-bold bg-transparent border-none outline-none text-[var(--text-h)] placeholder:text-[var(--text)]/30 mb-8"
          value={page.title}
          onInput={(e) => updateCurrentPage({ title: (e.target as HTMLInputElement).value })}
          placeholder="Untitled"
        />
        
        <div class="min-h-[50vh]">
          <BlockTree
            blocks={page.blocks}
            onUpdate={handleUpdateBlock}
            onDelete={handleDeleteBlock}
            onInsert={handleInsertBlock}
            onMove={handleMoveBlock}
            onFocusBlock={handleFocusBlock}
            onAppend={handleAppendBlock}
            onFocusNewBlock={handleFocusNewBlock}
            onMergeWithPrevious={handleMergeWithPrevious}
          />
        </div>
      </div>
    </main>
  );
}