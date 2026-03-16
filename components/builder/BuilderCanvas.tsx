'use client';

import * as React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import type { SiteBlock, SiteTheme } from '@/lib/types';
import { BlockRenderer } from './BlockRenderer';
import { cn } from '@/lib/utils';

interface BuilderCanvasProps {
  blocks: SiteBlock[];
  theme: SiteTheme;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onReorder: (blocks: SiteBlock[]) => void;
  onDeleteBlock: (id: string) => void;
  previewMode: boolean;
}

export function BuilderCanvas({
  blocks,
  theme,
  selectedBlockId,
  onSelectBlock,
  onReorder,
  onDeleteBlock,
  previewMode,
}: BuilderCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }));
      onReorder(reordered);
    }
  }

  if (previewMode) {
    return (
      <div className="w-full min-h-screen bg-[#0a0a0f]">
        {blocks.map(block => (
          <BlockRenderer key={block.id} block={block} theme={theme} isPreview />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div className="w-full min-h-screen bg-[#0a0a0f]">
          {blocks.length === 0 ? (
            <div className="flex items-center justify-center h-96 text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-3">🧱</div>
                <p className="font-medium">No blocks yet</p>
                <p className="text-sm mt-1">Add blocks from the panel on the left</p>
              </div>
            </div>
          ) : (
            blocks.map(block => (
              <SortableBlock
                key={block.id}
                block={block}
                theme={theme}
                isSelected={selectedBlockId === block.id}
                onSelect={() => onSelectBlock(block.id)}
                onDelete={() => onDeleteBlock(block.id)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableBlock({
  block,
  theme,
  isSelected,
  onSelect,
  onDelete,
}: {
  block: SiteBlock;
  theme: SiteTheme;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isSelected && 'ring-2 ring-purple-500 ring-inset',
        hovered && 'ring-1 ring-purple-500/30 ring-inset'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      {/* Block type label */}
      {(hovered || isSelected) && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-purple-600 text-white text-xs px-2 py-1 rounded-md font-medium capitalize">
          {block.type}
        </div>
      )}

      {/* Controls */}
      {(hovered || isSelected) && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-lg p-1 shadow-xl">
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-grab active:cursor-grabbing"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 text-gray-400 hover:text-purple-400 transition-colors"
            onClick={e => { e.stopPropagation(); onSelect(); }}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
            onClick={e => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <BlockRenderer block={block} theme={theme} isPreview={false} />
    </div>
  );
}
