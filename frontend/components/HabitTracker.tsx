'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useHabitStore, Habit } from '@/lib/store';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HabitDialog } from './HabitDialog';
import { HabitRow } from './HabitRow';
import { GroupSection } from './GroupSection';
import { TrackerHeader } from './TrackerHeader';
import { HabitGridHeader } from './HabitGridHeader';
import { BulkUpdateDialog } from './BulkUpdateDialog';
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
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export function HabitTracker() {
  // Use specific selectors to avoid re-renders on every store change
  const habits = useHabitStore(state => state.habits);
  const groups = useHabitStore(state => state.groups);
  const groupOrder = useHabitStore(state => state.groupOrder);
  const ungroupedHabits = useHabitStore(state => state.ungroupedHabits);
  const addHabit = useHabitStore(state => state.addHabit);
  const updateHabit = useHabitStore(state => state.updateHabit);
  const deleteHabit = useHabitStore(state => state.deleteHabit);
  const setHabitOrder = useHabitStore(state => state.setHabitOrder);
  const addGroup = useHabitStore(state => state.addGroup);
  const deleteGroup = useHabitStore(state => state.deleteGroup);
  const moveHabit = useHabitStore(state => state.moveHabit);
  const setGroupOrder = useHabitStore(state => state.setGroupOrder);
  const notes = useHabitStore(state => state.notes);
  const setNotes = useHabitStore(state => state.setNotes);
  const bulkUpdateLogs = useHabitStore(state => state.bulkUpdateLogs);

  const [isMounted, setIsMounted] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Partial<Habit> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'habit' | 'group' | null>(null);
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const findContainer = (id: string) => {
    if (ungroupedHabits.includes(id)) return 'ungrouped';
    if (id === 'ungrouped') return 'ungrouped';
    if (groups[id]) return id;
    for (const groupId in groups) {
      if (groups[groupId].habitIds.includes(id)) return groupId;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    // If it's in habits, it's a habit. Otherwise it's a group.
    setActiveType(habits[id] ? 'habit' : 'group');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);
    if (!over) return;

    // Handle Group Reordering
    if (activeType === 'group') {
        if (active.id !== over.id && over.id !== 'ungrouped') {
            const oldIndex = groupOrder.indexOf(active.id as string);
            const newIndex = groupOrder.indexOf(over.id as string);
            if (oldIndex !== -1 && newIndex !== -1) {
                setGroupOrder(arrayMove(groupOrder, oldIndex, newIndex));
            }
        }
        return;
    }

    // Handle Habit Reordering
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

  const allHabits = Object.values(habits);

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
        onBulkUpdateTrigger={() => setIsBulkUpdateOpen(true)}
        onExport={handleExport}
        onImportTrigger={triggerImport}
        fileInputRef={fileInputRef}
        onImportChange={handleImport}
      />

      <div className="flex-1 overflow-auto relative">
        <div className="inline-block min-w-full pb-20"> 
            <HabitGridHeader days={days} />

            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* 
                    Ungrouped is not sortable as a group, 
                    but acts as a container for habits.
                */}
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

                <SortableContext 
                    items={groupOrder} 
                    strategy={verticalListSortingStrategy}
                >
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
                </SortableContext>

                <DragOverlay>
                    {activeId ? (
                        activeType === 'habit' && habits[activeId] ? (
                            <div className="opacity-80 shadow-2xl bg-background border rounded-md overflow-hidden">
                                <HabitRow
                                    habit={habits[activeId]}
                                    days={days}
                                    onEdit={() => {}}
                                    onInsertAfter={() => {}}
                                    isOverlay
                                />
                            </div>
                        ) : activeType === 'group' && groups[activeId] ? (
                            <div className="opacity-80 shadow-2xl bg-background border rounded-md overflow-hidden min-w-[300px]">
                                <GroupSection
                                    id={activeId}
                                    title={groups[activeId].title}
                                    habits={groups[activeId].habitIds.map(id => habits[id]).filter(Boolean)}
                                    days={days}
                                    onEdit={() => {}}
                                    onInsertAfter={() => {}}
                                    isOverlay
                                />
                            </div>
                        ) : null
                    ) : null}
                </DragOverlay>
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

      <BulkUpdateDialog 
        open={isBulkUpdateOpen}
        onOpenChange={setIsBulkUpdateOpen}
        habits={allHabits}
        onSave={bulkUpdateLogs}
      />
    </div>
  );
}
