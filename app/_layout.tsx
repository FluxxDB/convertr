import { AppStateProvider } from '@/contexts/AppStateContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppStateProvider>
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
      </AppStateProvider>
    </ThemeProvider>
  );
}

