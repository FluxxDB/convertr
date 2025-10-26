import { AppStateProvider } from '@/contexts/AppStateContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // When app goes to background/inactive
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // If user is in covert mode, exit back to currency converter
        const currentRoute = segments[0];
        if (currentRoute === 'covert') {
          router.replace('/' as any);
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="initial-setup" />
      <Stack.Screen 
        name="covert" 
        options={{ 
          gestureEnabled: false,
          animation: 'none'
        }} 
      />
      <Stack.Screen name="info" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppStateProvider>
        <RootLayoutNav />
      </AppStateProvider>
    </ThemeProvider>
  );
}

