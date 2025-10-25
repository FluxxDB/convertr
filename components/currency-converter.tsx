import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  AUD: 1.52,
  CAD: 1.36,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
  MXN: 17.05,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  CNY: "¥",
  INR: "₹",
  MXN: "$",
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  AUD: "Australian Dollar",
  CAD: "Canadian Dollar",
  CHF: "Swiss Franc",
  CNY: "Chinese Yuan",
  INR: "Indian Rupee",
  MXN: "Mexican Peso",
};

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  currencies: string[];
  label: string;
}

function CurrencySelect({ value, onChange, currencies, label }: CurrencySelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.currencySelectContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.currencySelectButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.currencySelectContent}>
          <Text style={styles.currencySymbol}>{CURRENCY_SYMBOLS[value]}</Text>
          <Text style={styles.currencyCode}>{value}</Text>
          <Text style={styles.currencyName}>{CURRENCY_NAMES[value]}</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#666" 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <ScrollView style={styles.currencyDropdown} nestedScrollEnabled>
          {currencies.map((currency) => (
            <TouchableOpacity
              key={currency}
              style={[
                styles.currencyOption,
                value === currency && styles.currencyOptionSelected
              ]}
              onPress={() => {
                onChange(currency);
                setIsOpen(false);
              }}
            >
              <Text style={styles.currencyOptionSymbol}>{CURRENCY_SYMBOLS[currency]}</Text>
              <Text style={styles.currencyOptionCode}>{currency}</Text>
              <Text style={styles.currencyOptionName}>{CURRENCY_NAMES[currency]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>("100");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("EUR");
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    const numAmount = Number.parseFloat(amount);
    if (isNaN(numAmount) || amount === "") {
      setResult(null);
      return;
    }

    const fromRate = EXCHANGE_RATES[fromCurrency];
    const toRate = EXCHANGE_RATES[toCurrency];
    const converted = (numAmount / fromRate) * toRate;
    setResult(converted);
  }, [amount, fromCurrency, toCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    if (result !== null) {
      setAmount(result.toFixed(2));
      setResult(Number.parseFloat(amount));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="trending-up" size={32} color="white" />
        </View>
        <Text style={styles.headerTitle}>Currency Converter</Text>
        <Text style={styles.headerSubtitle}>Real-time exchange rates • Instant conversion</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          {/* From Currency */}
          <CurrencySelect
            value={fromCurrency}
            onChange={setFromCurrency}
            currencies={Object.keys(EXCHANGE_RATES)}
            label="From"
          />

          {/* Swap Button */}
          <View style={styles.swapContainer}>
            <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
              <Ionicons name="swap-vertical" size={24} color="#40916c" />
            </TouchableOpacity>
          </View>

          {/* To Currency */}
          <CurrencySelect
            value={toCurrency}
            onChange={setToCurrency}
            currencies={Object.keys(EXCHANGE_RATES)}
            label="To"
          />

          {/* Result */}
          {result !== null && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>Converted Amount</Text>
              <Text style={styles.resultAmount}>
                {CURRENCY_SYMBOLS[toCurrency]}{result.toFixed(2)} {toCurrency}
              </Text>
              <Text style={styles.resultDetails}>
                {CURRENCY_SYMBOLS[fromCurrency]}{amount} {fromCurrency} = {CURRENCY_SYMBOLS[toCurrency]}{result.toFixed(2)} {toCurrency}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.footerText}>Exchange rates updated daily</Text>
      </View>
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#40916c',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    position: 'relative',
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    backgroundColor: '#f9f9f9',
  },
  currencySelectContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  currencySelectButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencySelectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  currencyName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  currencyDropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currencyOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  currencyOptionSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  currencyOptionCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  currencyOptionName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  swapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#40916c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#40916c',
    marginBottom: 8,
  },
  resultDetails: {
    fontSize: 14,
    color: '#666',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});
