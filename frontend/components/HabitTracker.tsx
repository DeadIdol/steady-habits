'use client';

import React, { useState, useRef } from 'react';
import { useHabitStore, Habit } from '@/lib/store';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HabitDialog } from './HabitDialog';
import { GroupSection } from './GroupSection';
import { TrackerHeader } from './TrackerHeader';
import { HabitGridHeader } from './HabitGridHeader';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { useTrackerDates } from '@/hooks/useTrackerDates';
import { useDataPersistence } from '@/hooks/useDataPersistence';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

export function HabitTracker() {
  const { 
      habits, 
      groups, 
      groupOrder, 
      ungroupedHabits, 
      addHabit, 
      updateHabit, 
      deleteHabit, 
      setHabitOrder, 
      addGroup, 
      deleteGroup, 
      moveHabit, 
      notes, 
      setNotes 
  } = useHabitStore();

  const [editingHabit, setEditingHabit] = useState<Partial<Habit> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Hooks
  const { daysToShow } = useWindowDimensions();
  const { endDate, days, shiftDate, goToDate, setToday } = useTrackerDates(daysToShow);
  const { handleExport, handleImport, triggerImport } = useDataPersistence(fileInputRef);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: string) => {
    if (ungroupedHabits.includes(id)) return 'ungrouped';
    if (id === 'ungrouped') return 'ungrouped';
    if (groups[id]) return id;
    for (const groupId in groups) {
      if (groups[groupId].habitIds.includes(id)) return groupId;
    }
    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
        const items = activeContainer === 'ungrouped' ? ungroupedHabits : groups[activeContainer].habitIds;
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        
        if (oldIndex !== newIndex) {
            setHabitOrder(activeContainer === 'ungrouped' ? null : activeContainer, arrayMove(items, oldIndex, newIndex));
        }
    } else {
        let newIndex;
        if (over.id === overContainer) {
            newIndex = (overContainer === 'ungrouped' ? ungroupedHabits : groups[overContainer].habitIds).length;
        } else {
            const overItems = overContainer === 'ungrouped' ? ungroupedHabits : groups[overContainer].habitIds;
            newIndex = overItems.indexOf(over.id as string);
        }

        moveHabit(active.id as string, 
                  activeContainer === 'ungrouped' ? null : activeContainer,
                  overContainer === 'ungrouped' ? null : overContainer,
                  newIndex);
    }
  };

  const handleAddHabit = () => {
    setEditingHabit({ title: '', color: '#22c55e', defaultStatus: 'NOT_DONE' }); 
    setIsDialogOpen(true);
  };

  const handleSaveHabit = (habitData: Partial<Habit>) => {
    if (habitData.id) {
        updateHabit(habitData.id, habitData);
    } else {
        addHabit(habitData, habitData.groupId);
    }
    setEditingHabit(null);
  };

  const handleDeleteHabit = () => {
    if (editingHabit?.id) {
        deleteHabit(editingHabit.id);
        setIsDialogOpen(false);
    }
  }

  const handleAddGroup = () => {
      const title = window.prompt("Enter group name:");
      if (title) {
          addGroup(title);
      }
  };

  const handleDeleteGroup = (id: string) => {
      if (window.confirm("Delete group? Habits will be moved to Ungrouped.")) {
          deleteGroup(id);
      }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-background text-foreground">
      <TrackerHeader 
        days={days}
        endDate={endDate}
        onShiftDate={shiftDate}
        onGoToDate={goToDate}
        onSetToday={setToday}
        onAddHabit={handleAddHabit}
        onAddGroup={handleAddGroup}
        onExport={handleExport}
        onImportTrigger={triggerImport}
        fileInputRef={fileInputRef}
        onImportChange={handleImport}
      />

      {/* Grid Container */}
      <div className="flex-1 overflow-auto relative">
        <div className="inline-block min-w-full pb-20"> 
            <HabitGridHeader days={days} />

            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <GroupSection
                    key="ungrouped-section"
                    id="ungrouped"
                    isUngrouped
                    habits={ungroupedHabits.map(id => habits[id]).filter(Boolean)}
                    days={days}
                    onEdit={(h) => {
                        setEditingHabit(h);
                        setIsDialogOpen(true);
                    }}
                    onInsertAfter={() => handleAddHabit()}
                />

                {groupOrder.map(groupId => {
                    const group = groups[groupId];
                    if (!group) return null;
                    return (
                        <GroupSection
                            key={groupId}
                            id={groupId}
                            title={group.title}
                            habits={group.habitIds.map(id => habits[id]).filter(Boolean)}
                            days={days}
                            onEdit={(h) => {
                                setEditingHabit(h);
                                setIsDialogOpen(true);
                            }}
                            onInsertAfter={() => handleAddHabit()}
                            onDeleteGroup={() => handleDeleteGroup(groupId)}
                        />
                    );
                })}
            </DndContext>
            
             <div className="sticky left-0 z-20 w-[200px] bg-background border-r border-b p-2 mt-4">
                <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleAddHabit}>
                    <Plus className="w-4 h-4 mr-2" /> Add Habit
                </Button>
            </div>
        </div>
      </div>
      
      <div className="p-4 border-t bg-muted/20 shrink-0">
         <textarea 
            className="w-full h-20 bg-transparent resize-none focus:outline-none text-sm p-2"
            placeholder="Notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
         />
      </div>

      <HabitDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        initialData={editingHabit || undefined}
        groups={groups}
        onSave={handleSaveHabit}
        onDelete={editingHabit?.id ? handleDeleteHabit : undefined}
      />
    </div>
  );
}
