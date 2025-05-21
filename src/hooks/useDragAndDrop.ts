import { useState, useRef, useCallback, useEffect } from 'react';
import useMultiTasking from './useMultiTasking';

export type DragItemType = 
  | 'text'
  | 'file'
  | 'chart'
  | 'image'
  | 'data-point'
  | 'link'
  | 'custom';

export type DragItemData = {
  id: string;
  type: DragItemType;
  payload: any;
  metadata?: Record<string, any>;
  sourceId?: string;
};

export type DropTargetOptions = {
  id: string;
  types: DragItemType[];
  onDrop?: (item: DragItemData, position: { x: number, y: number }) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  disabled?: boolean;
};

export type DragSourceOptions = {
  id: string;
  type: DragItemType;
  data: any;
  metadata?: Record<string, any>;
  disabled?: boolean;
  onDragStart?: () => void;
  onDragEnd?: (dropped: boolean) => void;
  dragImage?: HTMLElement | null;
  preview?: (data: any) => React.ReactNode;
};

export type DragState = {
  isDragging: boolean;
  currentItem: DragItemData | null;
  isOverValidTarget: boolean;
};

/**
 * Hook to enable iPad-optimized drag and drop support
 * Designed to work with Split View, Slide Over, and Stage Manager
 */
function useDragAndDrop() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    currentItem: null,
    isOverValidTarget: false
  });
  
  const dragDataRef = useRef<{
    activeTargets: Record<string, DropTargetOptions>;
    activeSources: Record<string, DragSourceOptions>;
    lastPosition: { x: number, y: number };
  }>({
    activeTargets: {},
    activeSources: {},
    lastPosition: { x: 0, y: 0 }
  });
  
  const { isMultiTasking, mode } = useMultiTasking();

  // When item is dropped on a valid target
  const handleDrop = useCallback((e: DragEvent, targetId: string) => {
    e.preventDefault();
    const target = dragDataRef.current.activeTargets[targetId];
    const currentItem = dragState.currentItem;
    
    if (target && currentItem && target.onDrop) {
      target.onDrop(currentItem, {
        x: e.clientX,
        y: e.clientY
      });
    }
    
    // Find source and call its onDragEnd
    if (currentItem?.sourceId) {
      const source = dragDataRef.current.activeSources[currentItem.sourceId];
      source?.onDragEnd?.(true);
    }
    
    setDragState({
      isDragging: false,
      currentItem: null,
      isOverValidTarget: false
    });
  }, [dragState.currentItem]);

  // Register a drop target
  const registerDropTarget = useCallback((options: DropTargetOptions) => {
    const { id, types, onDrop, onDragEnter, onDragLeave, onDragOver, disabled } = options;
    
    // Skip if disabled
    if (disabled) {
      delete dragDataRef.current.activeTargets[id];
      return {
        ref: (el: HTMLElement | null) => {},
        isOver: false,
        canDrop: false
      };
    }
    
    // Store target in registry
    dragDataRef.current.activeTargets[id] = options;
    
    // Return props to be spread onto component
    return {
      ref: (el: HTMLElement | null) => {
        if (!el) return;
        
        const handleDragOver = (e: DragEvent) => {
          e.preventDefault();
          const dt = e.dataTransfer;
          
          if (dt) {
            // Set drop effect based on multi-tasking mode
            if (isMultiTasking && mode === 'split-view') {
              dt.dropEffect = 'copy';
            } else {
              dt.dropEffect = 'move';
            }
          }
          
          dragDataRef.current.lastPosition = { x: e.clientX, y: e.clientY };
          
          if (onDragOver) {
            onDragOver(e as unknown as React.DragEvent);
          }
          
          // Only set state if needed
          if (!dragState.isOverValidTarget) {
            setDragState(prev => ({ ...prev, isOverValidTarget: true }));
          }
        };
        
        const handleDragEnter = (e: DragEvent) => {
          e.preventDefault();
          
          // Check if current drag item is allowed
          const canAccept = dragState.currentItem && 
            types.includes(dragState.currentItem.type);
            
          if (canAccept) {
            onDragEnter?.();
            setDragState(prev => ({ ...prev, isOverValidTarget: true }));
          }
        };
        
        const handleDragLeave = (e: DragEvent) => {
          // Only trigger if we're actually leaving the element
          if (!el.contains(e.relatedTarget as Node)) {
            onDragLeave?.();
            setDragState(prev => ({ ...prev, isOverValidTarget: false }));
          }
        };
        
        const handleLocalDrop = (e: DragEvent) => {
          handleDrop(e, id);
        };
        
        // Add event listeners
        el.addEventListener('dragover', handleDragOver);
        el.addEventListener('dragenter', handleDragEnter);
        el.addEventListener('dragleave', handleDragLeave);
        el.addEventListener('drop', handleLocalDrop);
        
        // Handle cleanup
        return () => {
          el.removeEventListener('dragover', handleDragOver);
          el.removeEventListener('dragenter', handleDragEnter);
          el.removeEventListener('dragleave', handleDragLeave);
          el.removeEventListener('drop', handleLocalDrop);
        };
      },
      isOver: dragState.isOverValidTarget && dragState.currentItem?.type &&
        types.includes(dragState.currentItem.type),
      canDrop: dragState.currentItem?.type && types.includes(dragState.currentItem.type)
    };
  }, [dragState.currentItem, dragState.isOverValidTarget, handleDrop, isMultiTasking, mode]);

  // Register a drag source
  const registerDragSource = useCallback((options: DragSourceOptions) => {
    const { id, type, data, metadata, disabled, onDragStart, onDragEnd, dragImage } = options;
    
    // Skip if disabled
    if (disabled) {
      delete dragDataRef.current.activeSources[id];
      return {
        ref: (el: HTMLElement | null) => {},
        isDragging: false,
        dragHandleProps: {}
      };
    }
    
    // Store source in registry
    dragDataRef.current.activeSources[id] = options;
    
    // Return props to be spread onto component
    return {
      ref: (el: HTMLElement | null) => {
        if (!el) return;
        
        el.setAttribute('draggable', 'true');
        
        const handleDragStart = (e: DragEvent) => {
          // Create drag data
          const item: DragItemData = {
            id: `drag-${Date.now()}`,
            type,
            payload: data,
            metadata,
            sourceId: id
          };
          
          // Set drag image if provided
          if (dragImage && e.dataTransfer) {
            e.dataTransfer.setDragImage(dragImage, 0, 0);
          }
          
          // Store JSON representation to support cross-window drags
          e.dataTransfer?.setData('application/json', JSON.stringify(item));
          
          // For iPadOS text-related drags, set plain text too
          if (type === 'text' && typeof data === 'string') {
            e.dataTransfer?.setData('text/plain', data);
          }
          
          // Set Apple-specific dataTransfer property for improved iOS/iPadOS drag UX
          if (e.dataTransfer && 'effectAllowed' in e.dataTransfer) {
            e.dataTransfer.effectAllowed = isMultiTasking ? 'copyMove' : 'move';
          }
          
          // Update drag state
          setDragState({
            isDragging: true,
            currentItem: item,
            isOverValidTarget: false
          });
          
          onDragStart?.();
        };
        
        const handleDragEnd = (e: DragEvent) => {
          onDragEnd?.(false);
          
          setDragState({
            isDragging: false,
            currentItem: null,
            isOverValidTarget: false
          });
        };
        
        // Add event listeners
        el.addEventListener('dragstart', handleDragStart);
        el.addEventListener('dragend', handleDragEnd);
        
        // Return cleanup function
        return () => {
          el.removeEventListener('dragstart', handleDragStart);
          el.removeEventListener('dragend', handleDragEnd);
        };
      },
      isDragging: dragState.isDragging && dragState.currentItem?.sourceId === id,
      dragHandleProps: {
        draggable: true,
        onTouchStart: (e: React.TouchEvent) => {
          // Enhance touch handling for iPad
          if (isMultiTasking) {
            // Enable force touch for better iPad drag detection
            (e.target as HTMLElement).style.webkitTouchCallout = 'none';
          }
        }
      }
    };
  }, [dragState.isDragging, dragState.currentItem, isMultiTasking]);

  // Set up global event listeners for cross-window drag and drop
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    
    // Handle drops anywhere in the document
    const handleDocumentDrop = (e: DragEvent) => {
      setDragState({
        isDragging: false,
        currentItem: null,
        isOverValidTarget: false
      });
    };
    
    // Process data transfers from other windows/apps
    const handleDocumentDragOver = (e: DragEvent) => {
      e.preventDefault();
      
      // Skip if we already have an active drag operation
      if (dragState.isDragging) return;
      
      // Try to extract drag data from another source (for iPad split screen)
      const dt = e.dataTransfer;
      if (!dt) return;
      
      // Update position
      dragDataRef.current.lastPosition = { x: e.clientX, y: e.clientY };
    };
    
    document.addEventListener('drop', handleDocumentDrop);
    document.addEventListener('dragover', handleDocumentDragOver);
    
    return () => {
      document.removeEventListener('drop', handleDocumentDrop);
      document.removeEventListener('dragover', handleDocumentDragOver);
    };
  }, [dragState.isDragging]);

  return {
    isDragging: dragState.isDragging,
    currentItem: dragState.currentItem,
    isOverValidTarget: dragState.isOverValidTarget,
    registerDropTarget,
    registerDragSource,
  };
}

export default useDragAndDrop;