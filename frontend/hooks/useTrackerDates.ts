import { useState, useMemo } from 'react';
import { subDays, addDays } from 'date-fns';

export function useTrackerDates(daysToShow: number) {
    const [endDate, setEndDate] = useState<Date>(new Date());

    const days = useMemo(() => {
        return Array.from({ length: daysToShow }, (_, i) => {
            return subDays(endDate, daysToShow - 1 - i);
        });
    }, [endDate, daysToShow]);

    const shiftDate = (amount: number) => {
        setEndDate(prev => addDays(prev, amount));
    };

    const goToDate = (dateString: string) => {
        if (dateString) {
            setEndDate(new Date(dateString + 'T12:00:00'));
        }
    };

    const setToday = () => {
        setEndDate(new Date());
    };

    return {
        endDate,
        days,
        shiftDate,
        goToDate,
        setToday
    };
}
