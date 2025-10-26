import { useAppState } from '@/contexts/AppStateContext';
import { CURRENCY_NAMES, CURRENCY_SYMBOLS, EXCHANGE_RATES } from '@/lib/constants';
import { DeviceService } from '@/lib/deviceService';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<number | null>(null);
  const { activateCovertMode } = useAppState();
  const router = useRouter();

  // Check if user document exists on component mount
  useEffect(() => {
    const checkUserExists = async () => {
      try {
        const deviceService = DeviceService.getInstance();
        const userDoc = await deviceService.getUserDocument();
        
        // If no user document exists, redirect to initial setup
        if (!userDoc) {
          router.push('/initial-setup' as any);
          return;
        }
      } catch (error) {
        console.error('Error checking user document:', error);
        // If there's an error checking, assume no user exists and redirect to setup
        router.push('/initial-setup' as any);
      }
    };
    
    checkUserExists();
  }, [router]);

  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || amount === '') {
      setResult(null);
      return;
    }

    const fromRate = EXCHANGE_RATES[fromCurrency];
    const toRate = EXCHANGE_RATES[toCurrency];
    const converted = (numAmount / fromRate) * toRate;
    setResult(converted);
  }, [amount, fromCurrency, toCurrency]);

  const handleSwap = async () => {
    // Check for PIN first
    try {
      const deviceService = DeviceService.getInstance();
      const userDoc = await deviceService.getUserDocument();
      
      if (userDoc && userDoc.pin && amount === userDoc.pin) {
        activateCovertMode();
        return; // Don't swap, just activate covert mode
      }
    } catch (error) {
      console.error('Error checking PIN:', error);
    }

    // If not PIN, proceed with normal swap
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    if (result !== null) {
      setAmount(result.toFixed(2));
      setResult(parseFloat(amount));
    }
  };

  const currencies = Object.keys(EXCHANGE_RATES).map((key) => ({
    label: `${CURRENCY_SYMBOLS[key]} ${key} - ${CURRENCY_NAMES[key]}`,
    value: key,
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBackground}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
        </View>
        <View style={styles.headerContent}>
          <View style={{ height: 8 }} />
          <Text style={styles.title}>Convertr</Text>
          <Text style={styles.subtitle}>Real-time exchange rates • Instant conversion</Text>
        </View>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.cardContent}>
          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          {/* From Currency */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>From</Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                value={fromCurrency}
                onValueChange={setFromCurrency}
                items={currencies}
                style={pickerSelectStyles}
                placeholder={{}}
              />
            </View>
          </View>

          {/* Swap Button */}
          <View style={styles.swapButtonContainer}>
            <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
              <Text style={styles.swapButtonText}>⇅</Text>
            </TouchableOpacity>
          </View>

          {/* To Currency */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>To</Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                value={toCurrency}
                onValueChange={setToCurrency}
                items={currencies}
                style={pickerSelectStyles}
                placeholder={{}}
              />
            </View>
          </View>

          {/* Result */}
          {result !== null && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>Converted Amount</Text>
              <Text style={styles.resultAmount}>
                {CURRENCY_SYMBOLS[toCurrency]}
                {result.toFixed(2)} {toCurrency}
              </Text>
              <Text style={styles.resultDetails}>
                {CURRENCY_SYMBOLS[fromCurrency]}
                {amount} {fromCurrency} = {CURRENCY_SYMBOLS[toCurrency]}
                {result.toFixed(2)} {toCurrency}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Exchange rates updated daily</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#40916c',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 64,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorCircle1: {
    position: 'absolute',
    top: -64,
    right: -64,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -48,
    left: -48,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerContent: {
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 16,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 24,
    marginTop: -24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  input: {
    fontSize: 18,
    height: 56,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#000000',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
  },
  swapButtonContainer: {
    alignItems: 'center',
    marginVertical: -8,
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapButtonText: {
    fontSize: 24,
    color: '#40916c',
  },
  resultContainer: {
    padding: 24,
    backgroundColor: 'rgba(64, 145, 108, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(64, 145, 108, 0.2)',
    gap: 4,
  },
  resultLabel: {
    fontSize: 13,
    color: '#666666',
  },
  resultAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#40916c',
  },
  resultDetails: {
    fontSize: 13,
    color: '#666666',
    marginTop: 8,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#000000',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#000000',
  },
  inputWeb: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#000000',
  },
});

