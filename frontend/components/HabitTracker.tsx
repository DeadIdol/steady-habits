'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useHabitStore, Habit } from '@/lib/store';
import { format, subDays, isSameDay, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Download, Upload } from 'lucide-react';
import { HabitDialog } from './HabitDialog';
import { GroupSection } from './GroupSection';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
      logs, 
      addHabit, 
      updateHabit, 
      deleteHabit, 
      toggleHabitStatus, 
      setHabitOrder, 
      addGroup, 
      deleteGroup, 
      moveHabit, 
      notes, 
      setNotes,
      syncLogs,
      importData
  } = useHabitStore();

  const [isMounted, setIsMounted] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Partial<Habit> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Date State
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [daysToShow, setDaysToShow] = useState(21);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setIsMounted(true);
    syncLogs();
    // Dynamic days calculation based on window width
    const handleResize = () => {
        const availableWidth = window.innerWidth - 300 - 40; // 40 padding
        const days = Math.floor(availableWidth / 40);
        setDaysToShow(Math.max(7, Math.min(days, 30))); // Min 7, Max 30
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [syncLogs]);

  const days = Array.from({ length: daysToShow }, (_, i) => {
    return subDays(endDate, daysToShow - 1 - i);
  });

  if (!isMounted) {
    return <div className="p-8">Loading habits...</div>;
  }

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

  const shiftDate = (amount: number) => {
      setEndDate(prev => addDays(prev, amount));
  };

  const handleExport = () => {
    const state = useHabitStore.getState();
    // Create a clean object with only the state we want to persist
    const exportData = {
        habits: state.habits,
        groups: state.groups,
        groupOrder: state.groupOrder,
        ungroupedHabits: state.ungroupedHabits,
        logs: state.logs,
        notes: state.notes,
        settings: state.settings
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const exportFileDefaultName = `steady-habits-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (window.confirm("Importing data will overwrite your current habits. Continue?")) {
            importData(json);
            window.location.reload(); 
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden bg-background text-foreground">
      {/* Header / Controls */}
      <div className="p-4 border-b flex justify-between items-center shrink-0 flex-wrap gap-2">
        <h1 className="text-2xl font-bold hidden lg:block">Steady Habits</h1>
        
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shiftDate(-7)}>
                <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="text-sm font-medium min-w-[140px] justify-center gap-2">
                        <CalendarIcon className="w-4 h-4 opacity-50" />
                        {format(days[0], 'MMM d')} - {format(days[days.length - 1], 'MMM d')}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="center">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-muted-foreground">Jump to Date (end):</label>
                        <input 
                            type="date" 
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={format(endDate, 'yyyy-MM-dd')}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setEndDate(new Date(e.target.value + 'T12:00:00'));
                                }
                            }}
                        />
                    </div>
                </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" onClick={() => shiftDate(7)} disabled={isSameDay(endDate, new Date())}>
                <ChevronRight className="w-4 h-4" />
            </Button>
             <Button variant="ghost" size="sm" onClick={() => setEndDate(new Date())} disabled={isSameDay(endDate, new Date())}>
                Today
            </Button>
        </div>

        <div className="flex gap-2">
            <div className="hidden sm:flex border-r pr-2 mr-2 gap-2">
                <Button variant="ghost" size="sm" onClick={handleExport} title="Export Data">
                    <Download className="w-4 h-4 mr-2" /> Export
                </Button>
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Import Data">
                    <Upload className="w-4 h-4 mr-2" /> Import
                </Button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json" 
                    onChange={handleImport} 
                />
            </div>

            <Button variant="outline" onClick={handleAddGroup} size="sm" className="hidden sm:flex">
                <FolderPlus className="w-4 h-4 mr-2" /> Group
            </Button>
             <Button variant="outline" onClick={handleAddGroup} size="icon" className="sm:hidden">
                <FolderPlus className="w-4 h-4" />
            </Button>

            <Button onClick={() => handleAddHabit()} size="sm" className="hidden sm:flex">
                <Plus className="w-4 h-4 mr-2" /> Habit
            </Button>
             <Button onClick={() => handleAddHabit()} size="icon" className="sm:hidden">
                <Plus className="w-4 h-4" />
            </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto relative">
        <div className="inline-block min-w-full pb-20"> 
            {/* Header Row */}
            <div className="sticky top-0 z-30 flex w-full min-w-max border-b bg-background shadow-sm">
                <div className="w-[200px] sticky left-0 z-40 bg-background border-r px-2 py-1 font-semibold flex items-end shrink-0 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
                    Habit
                </div>
                {days.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    return (
                    <div
                        key={day.toISOString()}
                        className={cn(
                        "w-[40px] border-r p-1 text-center text-xs flex flex-col justify-end shrink-0",
                        isToday && "bg-accent text-accent-foreground"
                        )}
                    >
                        <span className="opacity-50">{format(day, 'EEE')}</span>
                        <span className="font-bold">{format(day, 'd')}</span>
                    </div>
                    );
                })}
                <div className="w-[100px] shrink-0 px-2 py-1 font-semibold flex items-end border-l">
                    Streak
                </div>
            </div>

            {/* Content */}
            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {/* Ungrouped Habits */}
                <GroupSection
                    key="ungrouped-section"
                    id="ungrouped"
                    isUngrouped
                    habits={ungroupedHabits.map(id => habits[id]).filter(Boolean)}
                    days={days}
                    logs={logs}
                    onToggle={toggleHabitStatus}
                    onEdit={(h) => {
                        setEditingHabit(h);
                        setIsDialogOpen(true);
                    }}
                    onInsertAfter={() => handleAddHabit()}
                />

                {/* Groups */}
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
                            logs={logs}
                            onToggle={toggleHabitStatus}
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
            
            {/* Add Button Row */}
             <div className="sticky left-0 z-20 w-[200px] bg-background border-r border-b p-2 mt-4">
                <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => handleAddHabit()}>
                    <Plus className="w-4 h-4 mr-2" /> Add Habit
                </Button>
            </div>
        </div>
      </div>
      
      {/* Notes Area */}
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
