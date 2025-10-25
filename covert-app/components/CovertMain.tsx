import { DeviceService, UserDocument } from '@/lib/deviceService';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function CovertMain() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        setIsLoading(true);
        console.log('Starting user initialization...');
        
        const deviceService = DeviceService.getInstance();
        console.log('Device service instance created');
        
        const userDoc = await deviceService.createOrUpdateUserDocument();
        setUserData(userDoc);
        setFirebaseConnected(true);
        console.log('User document created/updated:', userDoc);
      } catch (error) {
        console.error('Error initializing user:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          name: error instanceof Error ? error.name : 'Unknown',
        });
        
        // Create a fallback user document if Firebase fails
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
          console.log('Using fallback user document (Firebase not available)');
          setUserData(fallbackUserDoc);
          setFirebaseConnected(false);
        } catch (fallbackError) {
          console.error('Fallback initialization also failed:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleHome = () => {
    router.push('/');
  };

  const handleInfo = () => {
    router.push('/info' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>covert</Text>
        
        {isLoading ? (
          <Text style={styles.loadingText}>Initializing...</Text>
        ) : userData ? (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoTitle}>Device Registered</Text>
            <Text style={styles.userInfoText}>Device ID: {userData.deviceId.substring(0, 8)}...</Text>
            <Text style={styles.userInfoText}>Name: {userData.name || 'Not set'}</Text>
            <Text style={styles.userInfoText}>Emergency Contact: {userData.emergency_contact_number || 'Not set'}</Text>
            <Text style={styles.userInfoText}>SOS Message: {userData.sos_message || 'Not set'}</Text>
            {firebaseConnected === false && (
              <Text style={styles.warningText}>⚠️ Firebase connection failed - data not saved to cloud</Text>
            )}
            {firebaseConnected === true && (
              <Text style={styles.successText}>✅ Connected to Firebase - data saved to cloud</Text>
            )}
          </View>
        ) : (
          <Text style={styles.errorText}>Failed to initialize user data</Text>
        )}
      </View>
      
      <View style={styles.navigationBar}>
        <TouchableOpacity style={styles.navButton} onPress={handleBack}>
          <Text style={styles.navIcon}>←</Text>
          <Text style={styles.navLabel}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={handleHome}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={handleInfo}>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    color: '#000000',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
  },
  userInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
    minWidth: 280,
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  userInfoText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: 12,
    color: '#ffc107',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 12,
    color: '#28a745',
    fontStyle: 'italic',
    marginTop: 8,
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

