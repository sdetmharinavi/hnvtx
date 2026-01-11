// stores/appSettingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppSettingsState {
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  setSimulatedOffline: (value: boolean) => void;
}

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      isSimulatedOffline: false,
      toggleSimulatedOffline: () =>
        set((state) => ({ isSimulatedOffline: !state.isSimulatedOffline })),
      setSimulatedOffline: (value) => set({ isSimulatedOffline: value }),
    }),
    {
      name: 'app-settings-storage',
    }
  )
);
