import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CurrencyConverter } from '@/components/currency-converter';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CurrencyConverter />
    </SafeAreaView>
  );
}

