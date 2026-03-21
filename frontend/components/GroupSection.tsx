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
    <div ref={setNodeRef} className={cn("flex flex-col", !isUngrouped && "mt-4")}>
      {!isUngrouped && (
        <div className="sticky left-0 z-20 flex items-center p-2 bg-muted/30 font-semibold border-y">
            <Button variant="ghost" size="icon" className="h-6 w-6 mr-1" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <span className="flex-1">{title}</span>
            {onDeleteGroup && (
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onDeleteGroup}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            )}
            
            {/* Visual filler for the rest of the row to span the grid? 
                Actually, this header is just a flex row. It doesn't align with the grid columns.
                That's fine for a separator.
            */}
        </div>
      )}

      {(!collapsed || isUngrouped) && (
          <SortableContext 
            id={id} 
            items={habits.map(h => h.id)} 
            strategy={verticalListSortingStrategy}
          >
            {habits.length === 0 && !isUngrouped && (
                <div className="p-4 text-center text-sm text-muted-foreground border-b italic">
                    No habits in this group. Drop habits here.
                </div>
            )}
            {habits.map((habit, index) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                days={days}
                logs={logs}
                onToggle={onToggle}
                onEdit={onEdit}
                onInsertAfter={() => onInsertAfter(index)}
              />
            ))}
          </SortableContext>
      )}
    </div>
  );
}
