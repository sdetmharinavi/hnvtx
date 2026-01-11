// path: stores/appearanceStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppearanceState {
  fontSizeMultiplier: number;
  increase: () => void;
  decrease: () => void;
  reset: () => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      fontSizeMultiplier: 1, // Default to 100%
      increase: () =>
        set((state) => ({ fontSizeMultiplier: Math.min(state.fontSizeMultiplier + 0.1, 1.5) })), // Max 150%
      decrease: () =>
        set((state) => ({ fontSizeMultiplier: Math.max(state.fontSizeMultiplier - 0.1, 0.8) })), // Min 80%
      reset: () => set({ fontSizeMultiplier: 1 }),
    }),
    {
      name: 'appearance-storage', // localStorage key
    }
  )
);
