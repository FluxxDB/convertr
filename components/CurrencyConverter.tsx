import { useAppState } from '@/contexts/AppStateContext';
import { CURRENCY_NAMES, CURRENCY_SYMBOLS, EXCHANGE_RATES } from '@/lib/constants';
import { DeviceService } from '@/lib/deviceService';
import { triggerEmergencyCall } from '@/lib/emergencyService';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<number | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const { activateCovertMode } = useAppState();
  const router = useRouter();
  
  const sosProgress = useRef(new Animated.Value(0)).current;
  const sosOpacity = useRef(new Animated.Value(0)).current;
  const sosTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sosAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

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

  const handleSOSLongPressStart = () => {
    // Reset and start animations
    sosProgress.setValue(0);
    sosOpacity.setValue(0);
    
    sosAnimationRef.current = Animated.parallel([
      Animated.timing(sosProgress, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(sosOpacity, {
        toValue: 1,
        duration: 200, // Fade in quickly
        useNativeDriver: true,
      })
    ]);
    
    sosAnimationRef.current.start();

    // Start timer
    sosTimerRef.current = setTimeout(() => {
      triggerSOS();
    }, 3000);
  };

  const handleSOSLongPressEnd = () => {
    // Cancel animation and timer
    if (sosTimerRef.current) {
      clearTimeout(sosTimerRef.current);
      sosTimerRef.current = null;
    }
    
    // Stop the current animation
    if (sosAnimationRef.current) {
      sosAnimationRef.current.stop();
      sosAnimationRef.current = null;
    }
    
    // Animate back to 0
    Animated.parallel([
      Animated.timing(sosProgress, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sosOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  const triggerSOS = async () => {
    try {
      const deviceService = DeviceService.getInstance();
      const userDoc = await deviceService.getUserDocument();
      
      if (!userDoc) {
        console.error('No user document found');
        return;
      }

      // Get location
      let locationString = 'Location unavailable';
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const address = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          
          if (address && address.length > 0) {
            const addr = address[0];
            locationString = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim();
          }
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }

      // Trigger emergency call
      const success = await triggerEmergencyCall(userDoc, locationString);
      
      if (success) {
        setSosTriggered(true);
        setShowSOSModal(true);
      }
    } catch (error) {
      console.error('Error triggering SOS:', error);
    }
  };

  const currencies = Object.keys(EXCHANGE_RATES);

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container} pointerEvents="box-none">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBackground}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
        </View>
        <View style={styles.headerContent}>
          <View style={{ height: 12 }} />
          <Text style={styles.title}>Convrt</Text>
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
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowFromPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {CURRENCY_SYMBOLS[fromCurrency]} {fromCurrency} - {CURRENCY_NAMES[fromCurrency]}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Swap Button */}
          <View style={styles.swapButtonContainer}>
            <Animated.View style={[styles.sosProgressSvg, { opacity: sosOpacity }]}>
              <Svg
                width="56"
                height="56"
              >
                <AnimatedCircle
                  cx="28"
                  cy="28"
                  r="25"
                  stroke="#dc2626"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={157} // 2 * π * 25
                  strokeDashoffset={sosProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [157, 0] // Start fully empty, end fully filled
                  })}
                  rotation="-90" // Start at 12 o'clock
                  origin="28, 28"
                />
              </Svg>
            </Animated.View>
            <Pressable 
              style={styles.swapButton} 
              onPress={handleSwap}
              onPressIn={handleSOSLongPressStart}
              onPressOut={handleSOSLongPressEnd}
            >
              <Text style={styles.swapButtonText}>⇅</Text>
            </Pressable>
          </View>

          {/* To Currency */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>To</Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowToPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {CURRENCY_SYMBOLS[toCurrency]} {toCurrency} - {CURRENCY_NAMES[toCurrency]}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
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
      </TouchableWithoutFeedback>

      {/* From Currency Picker Modal */}
      <Modal
        visible={showFromPicker}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalOverlay}
            onPress={() => setShowFromPicker(false)}
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowFromPicker(false)}>
                <Text style={styles.modalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={fromCurrency}
              onValueChange={(itemValue) => setFromCurrency(itemValue)}
              style={styles.modalPicker}
              itemStyle={styles.pickerItem}
            >
              {currencies.map((currency) => (
                <Picker.Item
                  key={currency}
                  label={`${CURRENCY_SYMBOLS[currency]} ${currency} - ${CURRENCY_NAMES[currency]}`}
                  value={currency}
                  color="#000000"
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* To Currency Picker Modal */}
      <Modal
        visible={showToPicker}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalOverlay}
            onPress={() => setShowToPicker(false)}
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowToPicker(false)}>
                <Text style={styles.modalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={toCurrency}
              onValueChange={(itemValue) => setToCurrency(itemValue)}
              style={styles.modalPicker}
              itemStyle={styles.pickerItem}
            >
              {currencies.map((currency) => (
                <Picker.Item
                  key={currency}
                  label={`${CURRENCY_SYMBOLS[currency]} ${currency} - ${CURRENCY_NAMES[currency]}`}
                  value={currency}
                  color="#000000"
                />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* SOS Emergency Modal */}
      <Modal
        visible={showSOSModal}
        transparent
        animationType="fade"
      >
        <View style={styles.sosModalContainer}>
          <View style={styles.sosModalContent}>
            <View style={styles.sosIconContainer}>
              <Ionicons name="alert-circle" size={64} color="#dc2626" />
            </View>
            <Text style={styles.sosModalTitle}>Emergency SOS Activated</Text>
            <Text style={styles.sosModalMessage}>
              Your emergency contact has been notified and will receive a call with your location.
            </Text>
            <TouchableOpacity 
              style={styles.sosModalButton}
              onPress={() => {
                setShowSOSModal(false);
                setSosTriggered(false);
              }}
            >
              <Text style={styles.sosModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  modalContent: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#40916c',
  },
  modalPicker: {
    width: '100%',
  },
  pickerItem: {
    fontSize: 18,
    height: 130,
    color: '#000000',
  },
  swapButtonContainer: {
    alignItems: 'center',
    marginVertical: -8,
    position: 'relative',
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
    zIndex: 2,
  },
  sosProgressSvg: {
    position: 'absolute',
    zIndex: 1,
    top: -4,
    alignSelf: 'center',
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
  sosModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sosModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
  },
  sosIconContainer: {
    marginBottom: 16,
  },
  sosModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  sosModalMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  sosModalButton: {
    backgroundColor: '#40916c',
    paddingHorizontal: 48,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sosModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

