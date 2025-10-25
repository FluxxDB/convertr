import { useRouter } from 'expo-router';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AppStateContextType {
  isCovertMode: boolean;
  activateCovertMode: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isCovertMode, setIsCovertMode] = useState(false);
  const router = useRouter();

  const activateCovertMode = () => {
    setIsCovertMode(true);
    router.push('/covert');
  };

  return (
    <AppStateContext.Provider value={{ isCovertMode, activateCovertMode }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

