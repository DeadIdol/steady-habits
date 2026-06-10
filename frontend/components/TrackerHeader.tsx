'use client';

import React from 'react';
import { format, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Download, Upload, Layers } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TrackerHeaderProps {
    days: Date[];
    endDate: Date;
    onShiftDate: (amount: number) => void;
    onGoToDate: (dateStr: string) => void;
    onSetToday: () => void;
    onAddHabit: () => void;
    onAddGroup: () => void;
    onBulkUpdateTrigger: () => void;
    onExport: () => void;
    onImportTrigger: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onImportChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TrackerHeader({
    days,
    endDate,
    onShiftDate,
    onGoToDate,
    onSetToday,
    onAddHabit,
    onAddGroup,
    onBulkUpdateTrigger,
    onExport,
    onImportTrigger,
    fileInputRef,
    onImportChange
}: TrackerHeaderProps) {
    const isToday = isSameDay(endDate, new Date());

    return (
        <div className="p-4 border-b flex justify-between items-center shrink-0 flex-wrap gap-2">
            <h1 className="text-2xl font-bold hidden lg:block">Steady Habits</h1>

            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => onShiftDate(-7)}>
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
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={format(endDate, 'yyyy-MM-dd')}
                                onChange={(e) => onGoToDate(e.target.value)}
                            />
                        </div>
                    </PopoverContent>
                </Popover>

                <Button variant="outline" size="icon" onClick={() => onShiftDate(7)} disabled={isToday}>
                    <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onSetToday} disabled={isToday}>
                    Today
                </Button>
            </div>

            <div className="flex gap-2">
                <div className="hidden sm:flex border-r pr-2 mr-2 gap-2">
                    <Button variant="ghost" size="sm" onClick={onExport} title="Export Data">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onImportTrigger} title="Import Data">
                        <Upload className="w-4 h-4 mr-2" /> Import
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={onImportChange}
                    />
                </div>

                <Button variant="outline" onClick={onAddGroup} size="sm" className="hidden sm:flex">
                    <FolderPlus className="w-4 h-4 mr-2" /> Group
                </Button>
                <Button variant="outline" onClick={onAddGroup} size="icon" className="sm:hidden">
                    <FolderPlus className="w-4 h-4" />
                </Button>

                <Button onClick={onAddHabit} size="sm" className="hidden sm:flex">
                    <Plus className="w-4 h-4 mr-2" /> Habit
                </Button>
                <Button onClick={onAddHabit} size="icon" className="sm:hidden">
                    <Plus className="w-4 h-4" />
                </Button>

                <Button variant="outline" onClick={onBulkUpdateTrigger} size="sm" className="hidden lg:flex" title="Mass Fill Cells">
                    <Layers className="w-4 h-4 mr-2" /> Mass Fill
                </Button>
            </div>
        </div>
    );
}
