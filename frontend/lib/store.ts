import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Status = 'DONE' | 'NOT_DONE' | 'NA';

export interface Habit {
  id: string;
  title: string;
  description: string;
  color: string; // Hex code, defaults to green
  defaultStatus: Status;
  groupId?: string; // undefined if no group
  hidden: boolean;
  archived: boolean;
  createdAt: string;
}

export interface Group {
  id: string;
  title: string;
  collapsed: boolean;
  habitIds: string[]; // Order within the group
}

// Key is date string YYYY-MM-DD, Value is Status
export type HabitLog = Record<string, Status>;

// Key is Habit ID
export type HabitLogs = Record<string, HabitLog>;

interface AppState {
  habits: Record<string, Habit>;
  groups: Record<string, Group>;
  groupOrder: string[]; // Order of groups
  ungroupedHabits: string[]; // IDs of habits not in any group
  logs: HabitLogs;
  notes: string;
  settings: {
    startDate: string;
    theme: 'light' | 'dark';
  };

  // Actions
  addHabit: (habit: Partial<Habit>, groupId?: string) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitStatus: (habitId: string, date: string) => void;
  
  // Group Actions
  addGroup: (title: string) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  
  // Reordering
  setGroupOrder: (order: string[]) => void;
  setHabitOrder: (groupId: string | null, order: string[]) => void; // groupId null = ungrouped
  moveHabit: (habitId: string, fromGroupId: string | null, toGroupId: string | null, newIndex: number) => void;

  setNotes: (notes: string) => void;
}

const DEFAULT_HABIT_COLOR = '#22c55e'; // tailwind green-500

export const useHabitStore = create<AppState>()(
  persist(
    (set, get) => ({
      habits: {},
      groups: {},
      groupOrder: [],
      ungroupedHabits: [],
      logs: {},
      notes: '',
      settings: {
        startDate: new Date().toISOString().split('T')[0],
        theme: 'light',
      },

      addHabit: (habitData, groupId) => {
        const id = uuidv4();
        const newHabit: Habit = {
          title: 'New Habit',
          description: '',
          color: DEFAULT_HABIT_COLOR,
          defaultStatus: 'NOT_DONE',
          hidden: false,
          archived: false,
          createdAt: new Date().toISOString(),
          ...habitData,
          id, // Apply generated id LAST to ensure it is never undefined
          groupId, // Ensure the explicitly passed groupId takes precedence
        };

        set((state) => {
            if (groupId && state.groups[groupId]) {
                return {
                    habits: { ...state.habits, [id]: newHabit },
                    groups: {
                        ...state.groups,
                        [groupId]: {
                            ...state.groups[groupId],
                            habitIds: [...state.groups[groupId].habitIds, id]
                        }
                    }
                };
            } else {
                return {
                    habits: { ...state.habits, [id]: newHabit },
                    ungroupedHabits: [...state.ungroupedHabits, id]
                };
            }
        });
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: {
            ...state.habits,
            [id]: { ...state.habits[id], ...updates },
          },
        }));
      },

      deleteHabit: (id) => {
        set((state) => {
          const habit = state.habits[id];
          const { [id]: deleted, ...restHabits } = state.habits;
          const { [id]: deletedLogs, ...restLogs } = state.logs;
          
          let newGroups = { ...state.groups };
          let newUngrouped = [...state.ungroupedHabits];

          if (habit.groupId && newGroups[habit.groupId]) {
             newGroups[habit.groupId].habitIds = newGroups[habit.groupId].habitIds.filter(h => h !== id);
          } else {
             newUngrouped = newUngrouped.filter(h => h !== id);
          }

          return {
            habits: restHabits,
            groups: newGroups,
            ungroupedHabits: newUngrouped,
            logs: restLogs,
          };
        });
      },

      toggleHabitStatus: (habitId, date) => {
        const state = get();
        const habit = state.habits[habitId];
        if (!habit) return;

        const currentLog = state.logs[habitId]?.[date];
        let nextStatus: Status;
        const currentStatus = currentLog ?? habit.defaultStatus;

        if (currentStatus === 'NA') nextStatus = 'NOT_DONE';
        else if (currentStatus === 'NOT_DONE') nextStatus = 'DONE';
        else nextStatus = 'NA'; 

        set((state) => ({
          logs: {
            ...state.logs,
            [habitId]: {
              ...(state.logs[habitId] || {}),
              [date]: nextStatus,
            },
          },
        }));
      },

      addGroup: (title) => {
          const id = uuidv4();
          set(state => ({
              groups: { ...state.groups, [id]: { id, title, collapsed: false, habitIds: [] } },
              groupOrder: [...state.groupOrder, id]
          }));
      },

      updateGroup: (id, updates) => {
          set(state => ({
              groups: { ...state.groups, [id]: { ...state.groups[id], ...updates } }
          }));
      },

      deleteGroup: (id) => {
          set(state => {
              const group = state.groups[id];
              // Move habits to ungrouped? Or delete them? Prompt says "Habits can be deleted...".
              // Safest is to move to ungrouped or delete. Let's move to ungrouped for safety.
              const habitIdsToMove = group?.habitIds || [];
              const { [id]: deleted, ...restGroups } = state.groups;
              
              // Update habits to remove groupId
              const updatedHabits = { ...state.habits };
              habitIdsToMove.forEach(hId => {
                  if (updatedHabits[hId]) updatedHabits[hId].groupId = undefined;
              });

              return {
                  groups: restGroups,
                  groupOrder: state.groupOrder.filter(gId => gId !== id),
                  ungroupedHabits: [...state.ungroupedHabits, ...habitIdsToMove],
                  habits: updatedHabits
              };
          });
      },

      setGroupOrder: (order) => set({ groupOrder: order }),

      setHabitOrder: (groupId, order) => set(state => {
          if (groupId) {
              return {
                  groups: {
                      ...state.groups,
                      [groupId]: { ...state.groups[groupId], habitIds: order }
                  }
              };
          } else {
              return { ungroupedHabits: order };
          }
      }),

      moveHabit: (habitId, fromGroupId, toGroupId, newIndex) => set(state => {
          // Remove from old
          let newGroups = { ...state.groups };
          let newUngrouped = [...state.ungroupedHabits];

          if (fromGroupId) {
              newGroups[fromGroupId].habitIds = newGroups[fromGroupId].habitIds.filter(id => id !== habitId);
          } else {
              newUngrouped = newUngrouped.filter(id => id !== habitId);
          }

          // Add to new
          if (toGroupId) {
              newGroups[toGroupId].habitIds = [
                  ...newGroups[toGroupId].habitIds.slice(0, newIndex),
                  habitId,
                  ...newGroups[toGroupId].habitIds.slice(newIndex)
              ];
          } else {
              newUngrouped = [
                  ...newUngrouped.slice(0, newIndex),
                  habitId,
                  ...newUngrouped.slice(newIndex)
              ];
          }

          const updatedHabit = { ...state.habits[habitId], groupId: toGroupId || undefined };

          return {
              groups: newGroups,
              ungroupedHabits: newUngrouped,
              habits: { ...state.habits, [habitId]: updatedHabit }
          };
      }),

      setNotes: (notes) => {
        set({ notes });
      },
    }),
    {
      name: 'steady-habits-storage',
      storage: createJSONStorage(() => localStorage),
      // Migration logic if needed, but for dev we can just clear storage or handle missing fields
    }
  )
);
