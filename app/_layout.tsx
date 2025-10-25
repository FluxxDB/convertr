import { AppStateProvider } from '@/contexts/AppStateContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AppStateProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="covert" />
        <Stack.Screen name="info" />
      </Stack>
    </AppStateProvider>
  );
}

