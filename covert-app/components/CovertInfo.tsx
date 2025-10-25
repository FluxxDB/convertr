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

export function CovertInfo() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [sosMessage, setSosMessage] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const deviceService = DeviceService.getInstance();
        const userDoc = await deviceService.getUserDocument();
        
        if (userDoc) {
          setUserData(userDoc);
          setName(userDoc.name || '');
          setEmergencyContact(userDoc.emergency_contact_number || '');
          setSosMessage(userDoc.sos_message || '');
          setFirebaseConnected(true);
        } else {
          // Create new document if none exists
          const newUserDoc = await deviceService.createOrUpdateUserDocument();
          setUserData(newUserDoc);
          setName(newUserDoc.name || '');
          setEmergencyContact(newUserDoc.emergency_contact_number || '');
          setSosMessage(newUserDoc.sos_message || '');
          setFirebaseConnected(true);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setFirebaseConnected(false);
        
        // Create fallback data
        try {
          const deviceService = DeviceService.getInstance();
          const deviceId = await deviceService.getDeviceId();
          const fallbackUserDoc: UserDocument = {
            deviceId,
            sos_message: '',
            emergency_contact_number: '',
            name: '',
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
          };
          setUserData(fallbackUserDoc);
          setName('');
          setEmergencyContact('');
          setSosMessage('');
        } catch (fallbackError) {
          console.error('Fallback initialization failed:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSave = async () => {
    if (!userData) return;

    try {
      setIsSaving(true);
      const deviceService = DeviceService.getInstance();
      
      // Update the user document with new values
      const updatedData: Partial<UserDocument> = {
        name: name.trim(),
        emergency_contact_number: emergencyContact.trim(),
        sos_message: sosMessage.trim(),
        lastAccessed: new Date().toISOString(),
      };

      // If Firebase is connected, save to Firestore
      if (firebaseConnected) {
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('@/config/firebase');
        const userRef = doc(db, 'users', userData.deviceId);
        await setDoc(userRef, updatedData, { merge: true });
      }

      // Update local state
      const updatedUserData = { ...userData, ...updatedData };
      setUserData(updatedUserData);
      
      Alert.alert('Success', 'Your information has been saved!');
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleHome = () => {
    router.push('/' as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading your information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Information</Text>
          <Text style={styles.subtitle}>Keep your emergency details up to date</Text>
        </View>

        <View style={styles.form}>
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
              placeholder="Enter an emergency contact phone number (e.g. 911)"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SOS Message</Text>
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
              {isSaving ? 'Saving...' : 'Save Information'}
            </Text>
          </TouchableOpacity>

          {firebaseConnected === false && (
            <Text style={styles.warningText}>
              ⚠️ Firebase not connected - changes will not be saved to cloud
            </Text>
          )}
          {firebaseConnected === true && (
            <Text style={styles.successText}>
              ✅ Connected to Firebase - changes will be saved to cloud
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.navigationBar}>
        <TouchableOpacity style={styles.navButton} onPress={handleBack}>
          <Text style={styles.navIcon}>←</Text>
          <Text style={styles.navLabel}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={handleHome}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navButton, styles.activeNavButton]}>
          <Text style={styles.navIcon}>ℹ️</Text>
          <Text style={styles.navLabel}>Info</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
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
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
  },
  navButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 60,
  },
  activeNavButton: {
    backgroundColor: 'rgba(64, 145, 108, 0.1)',
    borderRadius: 8,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
});
