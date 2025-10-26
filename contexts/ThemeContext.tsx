import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

type ThemeColors = {
  background: string;
  surface: string;
  surfaceHover: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  warning: string;
  danger: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
};

type ThemeContextType = {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
};

const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f5f5f5',
  surfaceHover: '#e8e8e8',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  border: '#e0e0e0',
  accent: '#10a37f',
  warning: '#f59e0b',
  danger: '#ef4444',
  foreground: '#1a1a1a',
  primary: '#1a1a1a',
  primaryForeground: '#ffffff',
  secondary: '#f5f5f5',
  secondaryForeground: '#1a1a1a',
  muted: '#f5f5f5',
  mutedForeground: '#666666',
  card: '#ffffff',
  cardForeground: '#1a1a1a',
};

const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#1a1a1a',
  surfaceHover: '#2a2a2a',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  border: '#333333',
  accent: '#10a37f',
  warning: '#f59e0b',
  danger: '#ef4444',
  foreground: '#ffffff',
  primary: '#ffffff',
  primaryForeground: '#1a1a1a',
  secondary: '#2a2a2a',
  secondaryForeground: '#ffffff',
  muted: '#2a2a2a',
  mutedForeground: '#a0a0a0',
  card: '#1a1a1a',
  cardForeground: '#ffffff',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load theme from Firebase first, then AsyncStorage, then system preference
    const loadTheme = async () => {
      try {
        // Try Firebase first
        try {
          const { DeviceService } = await import('@/lib/deviceService');
          const deviceService = DeviceService.getInstance();
          const userDoc = await deviceService.getUserDocument();
          
          if (userDoc?.theme && (userDoc.theme === 'light' || userDoc.theme === 'dark')) {
            setTheme(userDoc.theme);
            // Sync to AsyncStorage for quick access
            await AsyncStorage.setItem('theme', userDoc.theme);
            setMounted(true);
            return;
          }
        } catch (firebaseError) {
          console.error('Failed to load theme from Firebase:', firebaseError);
        }
        
        // Fallback to AsyncStorage
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
        } else if (systemColorScheme === 'light' || systemColorScheme === 'dark') {
          setTheme(systemColorScheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
      setMounted(true);
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
      
      // Also save to Firebase
      try {
        const { DeviceService } = await import('@/lib/deviceService');
        const deviceService = DeviceService.getInstance();
        const deviceId = await deviceService.getDeviceId();
        
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('@/config/firebase');
        
        const userRef = doc(db, 'users', deviceId);
        await setDoc(userRef, {
          theme: newTheme,
          lastAccessed: new Date().toISOString(),
        }, { merge: true });
      } catch (firebaseError) {
        console.error('Failed to save theme to Firebase:', firebaseError);
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

