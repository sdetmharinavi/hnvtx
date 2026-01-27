// stores/syncStore.ts
import { create } from 'zustand';

interface SyncState {
  activeSyncs: Set<string>; // Set of table names currently syncing
  isGlobalSyncing: boolean;
  addActiveSync: (tableName: string) => void;
  removeActiveSync: (tableName: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  activeSyncs: new Set(),
  isGlobalSyncing: false,
  addActiveSync: (tableName) =>
    set((state) => {
      const newSet = new Set(state.activeSyncs);
      newSet.add(tableName);
      return { activeSyncs: newSet, isGlobalSyncing: newSet.size > 0 };
    }),
  removeActiveSync: (tableName) =>
    set((state) => {
      const newSet = new Set(state.activeSyncs);
      newSet.delete(tableName);
      return { activeSyncs: newSet, isGlobalSyncing: newSet.size > 0 };
    }),
}));