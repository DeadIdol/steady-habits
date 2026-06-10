import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, parseISO, isBefore, format, subDays, addDays } from 'date-fns';

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

export const getEffectiveStatus = (habit: Habit, logs: HabitLogs, date: Date | string): Status => {
  const dateKey = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
  const log = logs[habit.id]?.[dateKey];
  if (log !== undefined) return log;

  const targetDate = startOfDay(typeof date === 'string' ? parseISO(date) : date);
  const createdDate = startOfDay(parseISO(habit.createdAt));
  
  if (isBefore(targetDate, createdDate)) {
    return 'NA';
  }
  return habit.defaultStatus;
};

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

const getDatesBetween = (start: Date, end: Date) => {
    const dates = [];
    let curr = startOfDay(start);
    const last = startOfDay(end);
    while (curr <= last) {
        dates.push(format(curr, 'yyyy-MM-dd'));
        curr = addDays(curr, 1);
    }
    return dates;
};

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
        const now = new Date();
        const newHabit: Habit = {
          title: 'New Habit',
          description: '',
          color: DEFAULT_HABIT_COLOR,
          defaultStatus: 'NOT_DONE',
          hidden: false,
          archived: false,
          createdAt: now.toISOString(),
          ...habitData,
          id, // Apply generated id LAST to ensure it is never undefined
          groupId, // Ensure the explicitly passed groupId takes precedence
        };

        set((state) => {
            const newState: Partial<AppState> = {
                habits: { ...state.habits, [id]: newHabit },
            };

            if (groupId && state.groups[groupId]) {
                newState.groups = {
                    ...state.groups,
                    [groupId]: {
                        ...state.groups[groupId],
                        habitIds: [...state.groups[groupId].habitIds, id]
                    }
                };
            } else {
                newState.ungroupedHabits = [...state.ungroupedHabits, id];
            }

            return newState;
        });
      },

      updateHabit: (id, updates) => {
        set((state) => {
          const habit = state.habits[id];
          if (!habit) return state;

          let newLogs = { ...state.logs };
          
          // If defaultStatus is changing, seal the past
          if (updates.defaultStatus !== undefined && updates.defaultStatus !== habit.defaultStatus) {
            const today = startOfDay(new Date());
            const yesterday = subDays(today, 1);
            const createdDate = startOfDay(parseISO(habit.createdAt));
            
            if (isBefore(createdDate, today)) {
                const datesToSeal = getDatesBetween(createdDate, yesterday);
                const habitLogs = { ...(newLogs[id] || {}) };
                let changed = false;
                datesToSeal.forEach(date => {
                    if (habitLogs[date] === undefined) {
                        habitLogs[date] = habit.defaultStatus;
                        changed = true;
                    }
                });
                if (changed) {
                    newLogs[id] = habitLogs;
                }
            }
          }

          return {
            habits: {
              ...state.habits,
              [id]: { ...habit, ...updates },
            },
            logs: newLogs,
          };
        });
      },

      deleteHabit: (id) => {
        set((state) => {
          const habit = state.habits[id];
          if (!habit) return state;
          
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

        const currentStatus = getEffectiveStatus(habit, state.logs, date);

        let nextStatus: Status;
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
              const habitIdsToMove = group?.habitIds || [];
              const { [id]: deleted, ...restGroups } = state.groups;
              
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
    }
  )
);
