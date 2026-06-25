'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Habit, useHabitStore } from '@/lib/store';
import { HabitRow } from './HabitRow';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronRight, GripVertical, Plus } from 'lucide-react';

interface GroupSectionProps {
  id: string; // Group ID or 'ungrouped'
  title?: string;
  habits: Habit[];
  days: Date[];
  onEdit: (habit: Habit) => void;
  onInsertAfter: (index?: number) => void;
  onDeleteGroup?: () => void;
  isUngrouped?: boolean;
  isOverlay?: boolean;
  isAnyGroupDragging?: boolean;
}

export function GroupSection({
  id,
  title,
  habits,
  days,
  onEdit,
  onInsertAfter,
  onDeleteGroup,
  isUngrouped = false,
  isOverlay = false,
  isAnyGroupDragging = false,
}: GroupSectionProps) {
  // We use useSortable for the group itself if it's not the "ungrouped" section
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: isUngrouped || isOverlay
  });

  // We still need useDroppable for habits to be dropped into it
  const { setNodeRef: setDroppableRef } = useDroppable({ 
    id,
    disabled: isOverlay
  });

  // Combine refs
  const setContextRef = (element: HTMLElement | null) => {
    setSortableRef(element);
    setDroppableRef(element);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [collapsed, setCollapsed] = React.useState(false);
  const updateGroup = useHabitStore(state => state.updateGroup);
  const [localTitle, setLocalTitle] = React.useState(title || '');

  React.useEffect(() => {
    setLocalTitle(title || '');
  }, [title]);

  const handleSave = () => {
    const trimmed = localTitle.trim();
    if (trimmed && trimmed !== title) {
      updateGroup(id, { title: trimmed });
    } else {
      setLocalTitle(title || '');
    }
  };

  const showContent = !isAnyGroupDragging && (isUngrouped || !collapsed);

  return (
    <div 
        ref={setContextRef} 
        style={style}
        className={cn(
            "flex flex-col", 
            !isUngrouped && "mt-4",
            isDragging && "opacity-50 grayscale"
        )}
    >
      {!isUngrouped && (
        <div className="sticky left-0 z-20 flex items-center p-2 bg-muted/50 font-semibold border-y group/header">
            <div 
                className="mr-1 p-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing hover:bg-accent rounded"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <Button variant="ghost" size="icon" className="h-6 w-6 mr-1" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent border-none outline-none focus:bg-background/80 px-1 py-0.5 rounded focus:ring-1 focus:ring-primary font-semibold text-sm cursor-text"
            />
            
            {onDeleteGroup && (
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onDeleteGroup}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            )}
        </div>
      )}

      {showContent && (
        <div className={cn(isOverlay && "border-x border-b bg-background")}>
          {habits.length === 0 && !isUngrouped && !isOverlay && (
            <div key="placeholder" className="p-4 text-center text-sm text-muted-foreground border-b italic bg-background flex flex-col items-center gap-2">
              <span>No habits in this group. Drop habits here.</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-1"
                onClick={() => onInsertAfter()}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Habit
              </Button>
            </div>
          )}
          <SortableContext
            id={id}
            items={habits.map((h) => h.id)}
            strategy={verticalListSortingStrategy}
          >
            {habits.map((habit, index) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                days={days}
                onEdit={onEdit}
                onInsertAfter={() => onInsertAfter(index)}
                onInsertBefore={index === 0 ? () => onInsertAfter(-1) : undefined}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
