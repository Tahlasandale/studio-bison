import { useState } from 'preact/hooks';
import type { Block as BlockType } from '../types';
import { Block } from './Block';
import { createBlock } from '../stores/editor';
import { dragState } from '../lib/drag';

interface BlockTreeProps {
  blocks: BlockType[];
  onUpdate: (id: string, updates: Partial<BlockType>) => void;
  onDelete: (id: string, focusPreviousId?: string) => void;
  onInsert: (afterId: string, block: BlockType) => void;
  onMove: (fromIndex: number, toIndex: number, position: 'before' | 'after') => void;
  onFocusBlock: (id: string, direction: 'up' | 'down') => void;
  onAppend?: (block: BlockType) => void;
  onFocusNewBlock?: (id: string) => void;
  onMergeWithPrevious?: (id: string) => void;
}

function DropZone({ isActive, position, onDragOver, onDrop, onDragLeave }: {
  isActive: boolean;
  position: 'top' | 'between-before' | 'between-after' | 'bottom';
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragLeave: () => void;
}) {
  const heightClass = (position === 'top' || position === 'bottom') ? 'h-4' : 'h-2';
  const marginClass = (position === 'between-before' || position === 'between-after') ? '-ml-2' : '';
  
  return (
    <div
      class={`${heightClass} ${marginClass} border-2 border-dashed border-transparent transition-all duration-150 flex items-center justify-center ${
        isActive 
          ? 'border-[var(--accent)] bg-[var(--accent-bg)]' 
          : 'hover:border-[var(--accent)]/50 hover:bg-[var(--accent-bg)]/30'
      }`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
    >
      {isActive && <div class="w-16 h-1 bg-[var(--accent)] rounded-full" />}
    </div>
  );
}

export function BlockTree({ blocks, onUpdate, onDelete, onInsert, onMove, onFocusBlock, onAppend, onFocusNewBlock, onMergeWithPrevious }: BlockTreeProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [dragOverTop, setDragOverTop] = useState(false);
  const [dragOverBottom, setDragOverBottom] = useState(false);
  
  const isDragging = dragState.value.isDragging;
  const dragIndex = dragState.value.dragIndex;

  const handleInsert = (afterId: string, block: BlockType) => {
    onInsert(afterId, block);
  };

  const handleDelete = (id: string, focusPreviousId?: string) => {
    onDelete(id, focusPreviousId);
  };

  const handleMove = (fromIndex: number, toIndex: number, position: 'before' | 'after') => {
    onMove(fromIndex, toIndex, position);
  };

  const handleInsertBetween = (beforeIndex: number) => {
    const newBlock = createBlock('text');
    const beforeBlock = blocks[beforeIndex];
    if (beforeBlock) {
      onInsert(beforeBlock.id, newBlock);
    } else if (blocks.length > 0) {
      onInsert(blocks[blocks.length - 1].id, newBlock);
    }
  };

  const handleTopDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (isDragging && dragIndex !== 0) {
      setDragOverTop(true);
    }
  };

  const handleTopDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOverTop(false);
    if (isDragging && dragIndex !== 0) {
      onMove(dragIndex, 0, 'before');
    }
  };

  const handleBottomDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (isDragging && dragIndex !== blocks.length - 1) {
      setDragOverBottom(true);
    }
  };

  const handleBottomDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOverBottom(false);
    if (isDragging && dragIndex !== blocks.length - 1) {
      onMove(dragIndex, blocks.length - 1, 'after');
    }
  };

  const handleDropZoneDragOver = (e: DragEvent, index: number, position: 'before' | 'after') => {
    e.preventDefault();
    if (isDragging && dragIndex !== -1 && dragIndex !== index) {
      setDragOverIndex(index);
      setDragOverPosition(position);
    }
  };

  const handleDropZoneDrop = (e: DragEvent, index: number, position: 'before' | 'after') => {
    e.preventDefault();
    setDragOverIndex(null);
    setDragOverPosition(null);
    if (isDragging && dragIndex !== -1 && dragIndex !== index) {
      onMove(dragIndex, index, position);
    }
  };

  const handleDropZoneDragLeave = () => {
    setDragOverIndex(null);
    setDragOverPosition(null);
  };

  return (
    <div class="space-y-0">
      <DropZone
        isActive={dragOverTop}
        position="top"
        onDragOver={handleTopDragOver}
        onDrop={handleTopDrop}
        onDragLeave={() => setDragOverTop(false)}
      />
      
      {blocks.map((block, index) => {
        const isDropTargetBefore = dragOverIndex === index && dragOverPosition === 'before';
        const isDropTargetAfter = dragOverIndex === index && dragOverPosition === 'after';
        
        return (
          <div key={block.id} class="relative group">
            <DropZone
              isActive={isDropTargetBefore}
              position="between-before"
              onDragOver={(e) => handleDropZoneDragOver(e, index, 'before')}
              onDrop={(e) => handleDropZoneDrop(e, index, 'before')}
              onDragLeave={handleDropZoneDragLeave}
            />
            
            <div 
              class={`absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer ${isDropTargetBefore ? 'opacity-100' : ''}`}
              onClick={() => handleInsertBetween(index)}
              title="Insert block here"
            >
              <svg class="w-4 h-4 text-[var(--text)]/30 hover:text-[var(--accent)]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            
            <Block
              block={block}
              index={index}
              onUpdate={onUpdate}
              onDelete={handleDelete}
              onInsert={handleInsert}
              onMove={handleMove}
              onFocusBlock={onFocusBlock}
              onFocusNewBlock={onFocusNewBlock}
              onMergeWithPrevious={onMergeWithPrevious}
            />
            
            <DropZone
              isActive={isDropTargetAfter}
              position="between-after"
              onDragOver={(e) => handleDropZoneDragOver(e, index, 'after')}
              onDrop={(e) => handleDropZoneDrop(e, index, 'after')}
              onDragLeave={handleDropZoneDragLeave}
            />
          </div>
        );
      })}
      
      <DropZone
        isActive={dragOverBottom}
        position="bottom"
        onDragOver={handleBottomDragOver}
        onDrop={handleBottomDrop}
        onDragLeave={() => setDragOverBottom(false)}
      />
      
      {!isDragging && onAppend && blocks.length === 0 && (
        <EmptyPlaceholder onAdd={() => onAppend(createBlock('text'))} />
      )}
      
      <div class="relative group">
        <div class="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer">
          <svg class="w-4 h-4 text-[var(--text)]/30 hover:text-[var(--accent)]" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        {!isDragging && onAppend && blocks.length > 0 && (
          <button
            class="w-full text-left py-2 text-[var(--text)]/50 hover:text-[var(--text)] transition-colors"
            onClick={() => onAppend(createBlock('text'))}
          >
            Click to add a block...
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyPlaceholder({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      class="w-full text-left py-2 text-[var(--text)]/50 hover:text-[var(--text)] transition-colors"
      onClick={onAdd}
    >
      Click to add your first block...
    </button>
  );
}