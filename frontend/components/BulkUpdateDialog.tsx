'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Habit, Status } from '@/lib/store';
import { format } from 'date-fns';

interface BulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habits: Habit[];
  onSave: (habitIds: string[], startDate: string, endDate: string, status: Status | null) => void;
}

export function BulkUpdateDialog({
  open,
  onOpenChange,
  habits,
  onSave,
}: BulkUpdateDialogProps) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [status, setStatus] = useState<Status | 'NONE'>('NA');

  const toggleHabit = (id: string) => {
    setSelectedHabitIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedHabitIds.length === habits.length) {
      setSelectedHabitIds([]);
    } else {
      setSelectedHabitIds(habits.map(h => h.id));
    }
  };

  const handleSave = () => {
    if (selectedHabitIds.length === 0) {
        alert("Please select at least one habit.");
        return;
    }
    onSave(
        selectedHabitIds, 
        startDate, 
        endDate, 
        status === 'NONE' ? null : status as Status
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mass Fill Cells</DialogTitle>
          <DialogDescription>
            Update multiple cells at once. Select a date range and habits to apply the change to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="bulk-start">Start Date</Label>
                <input 
                    id="bulk-start"
                    type="date" 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="bulk-end">End Date</Label>
                <input 
                    id="bulk-end"
                    type="date" 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Apply Status</Label>
            <Select 
                value={status} 
                onValueChange={(v) => setStatus(v as Status | 'NONE')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NA">N/A (Grey)</SelectItem>
                <SelectItem value="NOT_DONE">Not Done (Empty)</SelectItem>
                <SelectItem value="DONE">Done (Colored)</SelectItem>
                <SelectItem value="NONE">None (Remove data)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <Label>Habits</Label>
                <Button variant="ghost" size="sm" onClick={toggleAll} className="h-6 px-2 text-xs">
                    {selectedHabitIds.length === habits.length ? "Deselect All" : "Select All"}
                </Button>
            </div>
            <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 grid gap-2">
                {habits.map(habit => (
                    <div key={habit.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`habit-${habit.id}`} 
                            checked={selectedHabitIds.includes(habit.id)}
                            onCheckedChange={() => toggleHabit(habit.id)}
                        />
                        <label 
                            htmlFor={`habit-${habit.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            {habit.title}
                        </label>
                    </div>
                ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Apply Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
