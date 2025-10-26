import { DeviceService, UserDocument } from '@/lib/deviceService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export function InitialSetup() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null);
  
  // Form fields
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Check Firebase connection on component mount
  useEffect(() => {
    const checkFirebaseConnection = async () => {
      try {
        // Simply import Firebase config to test connection
        await import('@/config/firebase');
        await import('firebase/firestore');
        setFirebaseConnected(true);
      } catch (error) {
        console.error('Firebase connection failed:', error);
        setFirebaseConnected(false);
      }
    };
    checkFirebaseConnection();
  }, []);

  // Check if user already exists and redirect if they do
  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const deviceService = DeviceService.getInstance();
        const userDoc = await deviceService.getUserDocument();
        
        // If user document already exists, redirect to currency converter
        if (userDoc) {
          router.push('/' as any);
          return;
        }
      } catch (error) {
        console.error('Error checking existing user:', error);
        // If there's an error, allow setup to continue
      }
    };
    
    checkExistingUser();
  }, [router]);

  const validatePin = (pinValue: string): boolean => {
    return /^\d{4,6}$/.test(pinValue);
  };

  const handleSave = async () => {
    // Validate PIN
    if (!validatePin(pin)) {
      Alert.alert('Invalid PIN', 'PIN must be 4-6 digits only.');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PIN and confirmation PIN do not match.');
      return;
    }

    try {
      setIsSaving(true);
      const deviceService = DeviceService.getInstance();
      
      // Create user document with minimal information
      const userData: UserDocument = {
        deviceId: await deviceService.getDeviceId(),
        notes_for_emergency: 'I need help. This is an emergency. Please contact me immediately or send assistance to my location.',
        emergency_contacts: [],
        name: '',
        theme: 'dark',
        append_location: true,
        pin: pin,
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      };

      // Save to Firebase
    try {
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('@/config/firebase');
        
        // Sanitize device ID for Firebase (replace invalid characters)
        const sanitizedDeviceId = userData.deviceId.replace(/[/\\]/g, '_');
        const userRef = doc(db, 'users', sanitizedDeviceId);
        
        // Update userData with sanitized ID
        const sanitizedUserData = { ...userData, deviceId: sanitizedDeviceId };
        await setDoc(userRef, sanitizedUserData);
        setFirebaseConnected(true);
        
        // Immediately redirect to currency converter after successful save
        router.push('/' as any);
        return;
      } catch (firebaseError) {
        console.error('Firebase save error:', firebaseError);
        setFirebaseConnected(false);
        Alert.alert('Connection Error', 'Unable to connect to Firebase. Please check your internet connection and try again.');
        return;
      }
    } catch (error) {
      console.error('Error saving initial setup:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={48} color="#10a37f" />
            </View>
            <Text style={styles.title}>Create Access PIN</Text>
            <Text style={styles.subtitle}>
              Set up a secure PIN to protect your privacy
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* PIN Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Access PIN</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={pin}
                  onChangeText={(text) => setPin(text.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 4-6 digit PIN"
                  placeholderTextColor="#666666"
                  keyboardType="numeric"
                  secureTextEntry={!showPin}
                  maxLength={6}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPin(!showPin)}
                >
                  <Ionicons
                    name={showPin ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666666"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>Must be 4-6 digits</Text>
            </View>

            {/* Confirm PIN Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm PIN</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={confirmPin}
                  onChangeText={(text) => setConfirmPin(text.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Re-enter your PIN"
                  placeholderTextColor="#666666"
                  keyboardType="numeric"
                  secureTextEntry={!showConfirmPin}
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPin(!showConfirmPin)}
                >
                  <Ionicons
                    name={showConfirmPin ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666666"
                  />
                </TouchableOpacity>
              </View>
              {confirmPin.length > 0 && pin !== confirmPin && (
                <Text style={styles.errorText}>PINs do not match</Text>
              )}
              {confirmPin.length > 0 && pin === confirmPin && (
                <Text style={styles.successText}>✓ PINs match</Text>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                (isSaving || !validatePin(pin) || pin !== confirmPin) && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={isSaving || !validatePin(pin) || pin !== confirmPin}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Creating...' : 'Continue'}
              </Text>
              {!isSaving && <Ionicons name="arrow-forward" size={20} color="#ffffff" />}
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color="#666666" />
              <Text style={styles.infoText}>
                You'll use this PIN to access the hidden features
              </Text>
            </View>

            {firebaseConnected === false && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={16} color="#f59e0b" />
                <Text style={styles.warningText}>
                  No internet connection - setup will not be saved
                </Text>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 163, 127, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    fontSize: 18,
    height: 56,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 48,
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
  },
  successText: {
    fontSize: 12,
    color: '#10a37f',
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#10a37f',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    shadowColor: '#10a37f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#2a2a2a',
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#a0a0a0',
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#f59e0b',
    lineHeight: 18,
  },
});
