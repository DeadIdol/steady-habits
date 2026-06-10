'use client';

import React from 'react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface HabitGridHeaderProps {
    days: Date[];
}

export function HabitGridHeader({ days }: HabitGridHeaderProps) {
    return (
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
    );
}
