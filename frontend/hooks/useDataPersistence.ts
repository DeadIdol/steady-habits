import { useHabitStore } from '@/lib/store';
import { format } from 'date-fns';
import { RefObject } from 'react';

export function useDataPersistence(fileInputRef: RefObject<HTMLInputElement | null>) {
    const importData = useHabitStore(state => state.importData);

    const handleExport = () => {
        const state = useHabitStore.getState();
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
        event.target.value = '';
    };

    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    return { handleExport, handleImport, triggerImport };
}
