'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Habit } from '@/lib/store';
import { HabitRow } from './HabitRow';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

interface GroupSectionProps {
  id: string; // Group ID or 'ungrouped'
  title?: string;
  habits: Habit[];
  days: Date[];
  onEdit: (habit: Habit) => void;
  onInsertAfter: (index: number) => void;
  onDeleteGroup?: () => void;
  isUngrouped?: boolean;
  isOverlay?: boolean;
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
            
            <span className="flex-1">{title}</span>
            
            {onDeleteGroup && (
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onDeleteGroup}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            )}
        </div>
      )}

      {(!collapsed || isUngrouped) && (
        <div className={cn(isOverlay && "border-x border-b bg-background")}>
          {habits.length === 0 && !isUngrouped && !isOverlay && (
            <div key="placeholder" className="p-4 text-center text-sm text-muted-foreground border-b italic bg-background">
              No habits in this group. Drop habits here.
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
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
