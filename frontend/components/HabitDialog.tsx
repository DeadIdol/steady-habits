'use client';

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Habit, Status } from '@/lib/store';

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<Habit>; // If provided, we are editing
  groups: Record<string, { id: string, title: string }>;
  onSave: (habit: Partial<Habit>) => void;
  onDelete?: () => void;
}

export function HabitDialog({
  open,
  onOpenChange,
  initialData,
  groups,
  onSave,
  onDelete,
}: HabitDialogProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [color, setColor] = React.useState('#22c55e');
  const [defaultStatus, setDefaultStatus] = React.useState<Status>('NOT_DONE');
  const [groupId, setGroupId] = React.useState<string>('ungrouped');

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || '');
      setDescription(initialData?.description || '');
      setColor(initialData?.color || '#22c55e');
      setDefaultStatus(initialData?.defaultStatus || 'NOT_DONE');
      setGroupId(initialData?.groupId || 'ungrouped');
    }
  }, [open, initialData]);

  const handleSave = () => {
    onSave({
      id: initialData?.id,
      title,
      description,
      color,
      defaultStatus,
      groupId: groupId === 'ungrouped' ? undefined : groupId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit Habit' : 'Add Habit'}</DialogTitle>
          <DialogDescription>
            {initialData?.id 
              ? 'Modify your habit details, color, and default status.' 
              : 'Create a new habit to track daily. Choose a name, color, and grouping.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          {/* Group Selector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="group" className="text-right">
              Group
            </Label>
             <Select 
                value={groupId} 
                onValueChange={setGroupId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ungrouped">Ungrouped</SelectItem>
                {Object.values(groups).map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="defaultStatus" className="text-right">
              Default
            </Label>
            <Select 
                value={defaultStatus} 
                onValueChange={(v) => setDefaultStatus(v as Status)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select default status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_DONE">Not Done (Empty)</SelectItem>
                <SelectItem value="DONE">Done (Colored)</SelectItem>
                <SelectItem value="NA">N/A (Grey)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {initialData?.id && onDelete && (
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          )}
           <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
