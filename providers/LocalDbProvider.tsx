// providers/LocalDbProvider.tsx
'use client';

import { localDb, HNVTMDatabase } from '@/data/localDb';
import { createContext, ReactNode, useContext } from 'react';

const LocalDbContext = createContext<HNVTMDatabase | undefined>(undefined);

export const LocalDbProvider = ({ children }: { children: ReactNode }) => {
  return (
    <LocalDbContext.Provider value={localDb}>
      {children}
    </LocalDbContext.Provider>
  );
};

export const useLocalDb = () => {
  const context = useContext(LocalDbContext);
  if (context === undefined) {
    throw new Error('useLocalDb must be used within a LocalDbProvider');
  }
  return context;
};