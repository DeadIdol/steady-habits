'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Habit, HabitLogs, Group } from '@/lib/store';
import { HabitRow } from './HabitRow';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

interface GroupSectionProps {
  id: string; // Group ID or 'ungrouped'
  title?: string;
  habits: Habit[];
  days: Date[];
  logs: HabitLogs;
  onToggle: (habitId: string, date: string) => void;
  onEdit: (habit: Habit) => void;
  onInsertAfter: (index: number) => void;
  onDeleteGroup?: () => void;
  isUngrouped?: boolean;
}

export function GroupSection({
  id,
  title,
  habits,
  days,
  logs,
  onToggle,
  onEdit,
  onInsertAfter,
  onDeleteGroup,
  isUngrouped = false,
}: GroupSectionProps) {
  const { setNodeRef } = useDroppable({ id });
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div ref={setNodeRef} className={cn("flex flex-col")}>
      {/* Reduced visual header for Groups */}
      {!isUngrouped && habits.length === 0 && (
         <div className="flex w-full min-w-max border-b group/row bg-muted/10 h-10 items-center">
            <div className="sticky left-0 z-30 w-[40px] border-r flex flex-col items-center justify-center h-full bg-muted/20">
                 <div className="rotate-180 [writing-mode:vertical-lr] text-[8px] font-bold uppercase tracking-widest text-muted-foreground/50">
                   {title}
                 </div>
                 {onDeleteGroup && (
                    <Button variant="ghost" size="icon" className="h-4 w-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onDeleteGroup}>
                        <Trash2 className="w-2 h-2" />
                    </Button>
                 )}
            </div>
            <div className="sticky left-[40px] z-20 w-[200px] border-r p-2 text-xs italic text-muted-foreground flex items-center">
                Empty group... drop habits here
            </div>
         </div>
      )}

      {(!collapsed || isUngrouped) && (
        <>
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
                logs={logs}
                onToggle={onToggle}
                onEdit={onEdit}
                onInsertAfter={() => onInsertAfter(index)}
                groupTitle={title}
                isFirstInGroup={!isUngrouped && index === 0}
                isLastInGroup={!isUngrouped && index === habits.length - 1}
              />
            ))}
          </SortableContext>
        </>
      )}
    </div>
  );
}
