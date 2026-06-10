'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Habit, useHabitStore } from '@/lib/store';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Plus, GripVertical } from 'lucide-react';

interface HabitRowProps {
  habit: Habit;
  days: Date[];
  onEdit: (habit: Habit) => void;
  onInsertAfter: () => void;
}

export function HabitRow({
  habit,
  days,
  onEdit,
  onInsertAfter,
}: HabitRowProps) {
  const toggleHabitStatus = useHabitStore(state => state.toggleHabitStatus);
  const habitLogs = useHabitStore(state => state.logs[habit.id] || {});

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex w-full min-w-max border-b group/row",
        isDragging && "opacity-50 bg-accent z-50 shadow-xl"
      )}
    >
      {/* Title Column (Sticky Left) */}
      <div
        className={cn(
            "sticky left-0 z-20 w-[200px] bg-background border-r p-2 flex items-center font-medium group cursor-pointer hover:bg-accent/50 transition-colors relative touch-none shrink-0",
             isDragging && "bg-accent"
        )}
        onClick={() => onEdit(habit)}
        {...attributes}
      >
        <div 
            className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing p-1"
            {...listeners}
            onClick={(e) => e.stopPropagation()}
        >
            <GripVertical className="w-3 h-3" />
        </div>
        
        <span className="truncate pl-4 select-none">{habit.title}</span>

        <div
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onInsertAfter();
          }}
          className="absolute -bottom-2.5 left-0 w-full h-5 z-50 flex items-center justify-center opacity-0 hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
        >
          <div className="bg-primary text-primary-foreground rounded-full p-0.5 shadow-md">
            <Plus className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Day Cells */}
      {days.map((day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const status = habitLogs[dateKey];

        return (
          <div
            key={`${habit.id}-${dateKey}`}
            className="border-r p-1 w-[40px] shrink-0"
          >
            <button
              onClick={() => toggleHabitStatus(habit.id, dateKey)}
              className={cn(
                "w-full h-full min-h-[30px] rounded-sm transition-all duration-200",
                status === 'NA' && "bg-gray-400",
                status === 'NOT_DONE' && "bg-red-500",
                status === 'DONE' && "text-white shadow-sm",
                status === undefined && "bg-card border shadow-sm hover:border-primary/50"
              )}
              style={{
                backgroundColor: status === 'DONE' ? habit.color : undefined,
              }}
              title={`${habit.title} - ${format(day, 'MMM d')}: ${status || 'No data'}`}
            />
          </div>
        );
      })}

      {/* Streak Column (Blank for now) */}
      <div className="w-[100px] shrink-0 p-2 text-center text-sm text-muted-foreground flex items-center justify-center bg-background border-l">
        {/* Streak logic removed for refactoring */}
      </div>
    </div>
  );
}
