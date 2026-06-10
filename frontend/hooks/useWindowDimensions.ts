import { useState, useEffect } from 'react';

export function useWindowDimensions() {
    const [daysToShow, setDaysToShow] = useState(21);

    useEffect(() => {
        const handleResize = () => {
            const availableWidth = window.innerWidth - 300 - 40; // 300 fixed columns, 40 padding
            const days = Math.floor(availableWidth / 40);
            setDaysToShow(Math.max(7, Math.min(days, 30))); // Min 7, Max 30
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { daysToShow };
}
