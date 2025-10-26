import { DeviceService, UserDocument } from '@/lib/deviceService';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export function InitialSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null);
  
  // Form fields
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [name, setName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [sosMessage, setSosMessage] = useState('');

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

    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your full name.');
      return;
    }

    try {
      setIsSaving(true);
      const deviceService = DeviceService.getInstance();
      
      // Create user document with all information
      const userData: UserDocument = {
        deviceId: await deviceService.getDeviceId(),
        notes_for_emergency: sosMessage.trim(),
        emergency_contacts: emergencyContact.trim() ? [{ name: 'Emergency Contact', phone: emergencyContact.trim() }] : [],
        name: name.trim(),
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Initial Setup</Text>
          <Text style={styles.subtitle}>Set up your device and create your access PIN</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Access PIN (4-6 digits)</Text>
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={setPin}
              placeholder="Enter 4-6 digit PIN"
              placeholderTextColor="#999"
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm PIN</Text>
            <TextInput
              style={styles.input}
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="Confirm your PIN"
              placeholderTextColor="#999"
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact Number</Text>
            <TextInput
              style={styles.input}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="Enter an emergency contact phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes for Emergency</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={sosMessage}
              onChangeText={setSosMessage}
              placeholder="Enter your emergency message"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Setting up...' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>

          {firebaseConnected === false && (
            <Text style={styles.warningText}>
              ⚠️ Firebase not connected - setup will not be saved
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#40916c',
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  form: {
    padding: 24,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    height: 48,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#000000',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: '#40916c',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    color: '#ffc107',
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 12,
    color: '#28a745',
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
  },
});
