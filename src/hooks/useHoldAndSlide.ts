import React, { useState, useRef, useEffect, useCallback } from 'react';

interface UseHoldAndSlideOptions<T> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  onCommit?: (newItems: T[]) => void;
  holdDuration?: number;
  groupId?: string;
}

export function useHoldAndSlide<T>({
  items,
  onReorder,
  onCommit,
  holdDuration = 180,
  groupId
}: UseHoldAndSlideOptions<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const holdTimerRef = useRef<any>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const justDraggedRef = useRef<boolean>(false);
  const itemsRef = useRef<T[]>(items);
  const dragIndexRef = useRef<number | null>(null);
  const lastTriggerTimeRef = useRef<number>(0);

  itemsRef.current = items;
  dragIndexRef.current = dragIndex;

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const handleStart = useCallback(
    (
      e: React.PointerEvent | React.MouseEvent | React.TouchEvent,
      index: number
    ) => {
      // Prevent double trigger if both pointerdown and mousedown fire
      const now = Date.now();
      if (now - lastTriggerTimeRef.current < 80) return;
      lastTriggerTimeRef.current = now;

      // Only handle left clicks for mouse/pointer
      if ('button' in e && e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isDragHandle = Boolean(target.closest('[data-drag-handle]'));

      if (!isDragHandle) {
        // Disallow drag if interacting with inputs, textareas, selects, or elements marked with data-no-drag
        if (target.closest('input, textarea, select, [data-no-drag]')) {
          return;
        }

        // If clicked on an action button/link that is inside the item (and not the item itself)
        const itemRoot = target.closest('[data-reorder-index]');
        const actionButton = target.closest('button, [role="button"], a');
        if (
          actionButton &&
          itemRoot &&
          actionButton !== itemRoot &&
          !actionButton.hasAttribute('data-drag-handle')
        ) {
          return;
        }
      }

      let clientX = 0;
      let clientY = 0;
      if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if ('touches' in e && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }

      startPosRef.current = { x: clientX, y: clientY };
      cancelHold();

      // Drag handles start dragging almost immediately (30ms); entire headers/names/items use holdDuration
      const delay = isDragHandle ? 30 : holdDuration;

      holdTimerRef.current = setTimeout(() => {
        setIsHolding(true);
        setDragIndex(index);
        dragIndexRef.current = index;
        if (navigator.vibrate) {
          try {
            navigator.vibrate(30);
          } catch {}
        }
      }, delay);
    },
    [cancelHold, holdDuration]
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent | PointerEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('clientX' in e && typeof e.clientX === 'number') {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if ('touches' in e && (e as TouchEvent).touches?.[0]) {
        clientX = (e as TouchEvent).touches[0].clientX;
        clientY = (e as TouchEvent).touches[0].clientY;
      }

      // If timer is running but user moved past threshold, cancel hold
      if (holdTimerRef.current && dragIndexRef.current === null) {
        const dx = Math.abs(clientX - startPosRef.current.x);
        const dy = Math.abs(clientY - startPosRef.current.y);
        if (dx > 10 || dy > 10) {
          cancelHold();
        }
        return;
      }

      // If active drag is in progress
      const currentIdx = dragIndexRef.current;
      if (currentIdx === null) return;

      // Prevent native scrolling while dragging
      if (e.cancelable && ('touches' in e || (e as any).pointerType === 'touch')) {
        e.preventDefault();
      }

      // Find the element currently under the pointer
      const elementsUnder = document.elementsFromPoint(clientX, clientY);
      let targetIndex: number | null = null;

      for (const el of elementsUnder) {
        const itemEl = el.closest('[data-reorder-index]');
        if (itemEl) {
          if (groupId && itemEl.getAttribute('data-reorder-group') !== groupId) {
            continue;
          }
          const reorderAttr = itemEl.getAttribute('data-reorder-index');
          if (reorderAttr !== null) {
            const parsed = parseInt(reorderAttr, 10);
            if (!isNaN(parsed) && parsed !== currentIdx) {
              targetIndex = parsed;
              break;
            }
          }
        }
      }

      if (targetIndex !== null && targetIndex >= 0 && targetIndex < itemsRef.current.length) {
        const newItems = [...itemsRef.current];
        const [movedItem] = newItems.splice(currentIdx, 1);
        newItems.splice(targetIndex, 0, movedItem);

        itemsRef.current = newItems;
        dragIndexRef.current = targetIndex;
        setDragIndex(targetIndex);
        onReorder(newItems);
      }
    };

    const handleUp = () => {
      cancelHold();
      if (dragIndexRef.current !== null) {
        justDraggedRef.current = true;
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 200);

        if (onCommit) {
          onCommit(itemsRef.current);
        }
        setDragIndex(null);
        dragIndexRef.current = null;
        setIsHolding(false);
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    window.addEventListener('touchcancel', handleUp);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
      window.removeEventListener('touchcancel', handleUp);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [cancelHold, onReorder, onCommit, groupId]);

  const getItemProps = useCallback(
    (index: number) => {
      const isDraggingThis = dragIndex === index;
      return {
        'data-reorder-index': index,
        ...(groupId ? { 'data-reorder-group': groupId } : {}),
        onPointerDown: (e: React.PointerEvent) => handleStart(e, index),
        onMouseDown: (e: React.MouseEvent) => handleStart(e, index),
        onTouchStart: (e: React.TouchEvent) => handleStart(e, index),
        style: { touchAction: 'none' as const },
        className: isDraggingThis
          ? 'scale-105 z-30 shadow-2xl ring-2 ring-orange-500 opacity-95 transition-transform cursor-grabbing select-none touch-none'
          : dragIndex !== null
          ? 'transition-all duration-200 select-none touch-none'
          : 'transition-all duration-200 select-none'
      };
    },
    [dragIndex, handleStart, groupId]
  );

  const getHandleProps = useCallback(
    (index: number) => {
      return {
        'data-drag-handle': true,
        'data-reorder-index': index,
        ...(groupId ? { 'data-reorder-group': groupId } : {}),
        onPointerDown: (e: React.PointerEvent) => handleStart(e, index),
        onMouseDown: (e: React.MouseEvent) => handleStart(e, index),
        onTouchStart: (e: React.TouchEvent) => handleStart(e, index),
        style: { touchAction: 'none' as const },
        className: 'cursor-grab active:cursor-grabbing select-none touch-none'
      };
    },
    [handleStart, groupId]
  );

  return {
    dragIndex,
    isDragging: dragIndex !== null,
    isHolding,
    justDragged: justDraggedRef,
    getItemProps,
    getHandleProps
  };
}
