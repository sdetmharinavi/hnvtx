import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ViewSettingsContextType {
  showHeader: boolean;
  setShowHeader: (show: boolean) => void;
  showToolbar: boolean;
  setShowToolbar: (show: boolean) => void;
}

const ViewSettingsContext = createContext<ViewSettingsContextType | undefined>(undefined);

export function ViewSettingsProvider({ children }: { children: ReactNode }) {
  const [showHeader, setShowHeader] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  return (
    <ViewSettingsContext.Provider value={{ showHeader, setShowHeader, showToolbar, setShowToolbar }}>
      {children}
    </ViewSettingsContext.Provider>
  );
}

export function useViewSettings() {
  const context = useContext(ViewSettingsContext);
  if (context === undefined) {
    throw new Error('useViewSettings must be used within a ViewSettingsProvider');
  }
  return context;
}
