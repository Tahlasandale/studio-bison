import { signal } from '@preact/signals';

export interface Position {
  x: number;
  y: number;
}

export type DropPosition = 'before' | 'after';

export interface DragState {
  isDragging: boolean;
  dragId: string | null;
  dragIndex: number;
  startPos: Position;
  currentPos: Position;
  targetIndex: number;
  dropPosition: DropPosition;
}

export const dragState = signal<DragState>({
  isDragging: false,
  dragId: null,
  dragIndex: -1,
  startPos: { x: 0, y: 0 },
  currentPos: { x: 0, y: 0 },
  targetIndex: -1,
  dropPosition: 'after'
});

export function startDrag(blockId: string, blockIndex: number, startPos: Position) {
  dragState.value = {
    isDragging: true,
    dragId: blockId,
    dragIndex: blockIndex,
    startPos,
    currentPos: startPos,
    targetIndex: -1,
    dropPosition: 'after'
  };
}

export function updateDrag(currentPos: Position) {
  if (!dragState.value.isDragging) return;
  dragState.value = {
    ...dragState.value,
    currentPos
  };
}

export function setDropTarget(index: number, position: DropPosition = 'after') {
  dragState.value = {
    ...dragState.value,
    targetIndex: index,
    dropPosition: position
  };
}

export function endDrag() {
  dragState.value = {
    isDragging: false,
    dragId: null,
    dragIndex: -1,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    targetIndex: -1,
    dropPosition: 'after'
  };
}