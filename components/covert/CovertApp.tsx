import { useTheme } from '@/contexts/ThemeContext';
import { DeviceService } from '@/lib/deviceService';
import { triggerEmergencyCall } from '@/lib/emergencyService';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsModal } from './SettingsModal';
import { VoiceMemoPage } from './VoiceMemoPage';
import { WalkingHomePage } from './WalkingHomePage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.85;

type Page = 'home' | 'voice-memo' | 'walking-home';
type ConnectivityStatus = 'peer' | 'wifi' | 'cellular';

export function CovertApp() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sosHolding, setSosHolding] = useState(false);
  const [sosTimer, setSosTimer] = useState(0);
  const [sosAlertOpen, setSosAlertOpen] = useState(false);
  const [sosAlertMessage, setSosAlertMessage] = useState<{title: string, message: string}>({
    title: 'Alerting Emergency Services and Contacts',
    message: 'Your emergency contacts and local services are being notified of your situation.'
  });
  const [voiceMemoHolding, setVoiceMemoHolding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connectivityStatus] = useState<ConnectivityStatus>('wifi');
  const [currentAddress, setCurrentAddress] = useState<string>('Getting location...');
  const [locationAvailable, setLocationAvailable] = useState<boolean>(false);
  const [detailedLocation, setDetailedLocation] = useState<string>('');

  const sosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceMemoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation refs
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const mainContentAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(mainContentAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(mainContentAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSidebarOpen(false);
    });
  };

  // SOS Button handlers
  const handleSosPress = async () => {
    setSosHolding(true);
    setSosTimer(0);
    sosTimerRef.current = setInterval(() => {
      setSosTimer((prev) => {
        if (prev >= 3) {
          handleSosRelease();
          handleSosTrigger();
          return 0;
        }
        return prev + 0.1;
      });
    }, 100);
  };

  const handleSosTrigger = async () => {
    try {
      // Load user data from Firebase
      const deviceService = DeviceService.getInstance();
      const userData = await deviceService.getUserDocument();
      
      if (!userData) {
        console.error('[SOS] No user data found');
        setSosAlertMessage({
          title: 'Error',
          message: 'Unable to access user data. Please try again.'
        });
        setSosAlertOpen(true);
        return;
      }

      // Validate emergency contacts exist
      if (!userData.emergency_contacts || userData.emergency_contacts.length === 0) {
        console.error('[SOS] No emergency contacts configured');
        setSosAlertMessage({
          title: 'No Emergency Contacts',
          message: 'Please add emergency contacts in settings before using this feature.'
        });
        setSosAlertOpen(true);
        return;
      }

      // Get location (use detailed location if available, otherwise use current display)
      const location = detailedLocation || currentAddress || 'Location unavailable';

      // Trigger emergency call
      const success = await triggerEmergencyCall(userData, location);

      if (success) {
        const contactName = userData.emergency_contacts[0]?.name || 'Emergency Contact';
        console.log(`[SOS] Emergency call placed to ${contactName}`);
        setSosAlertMessage({
          title: 'Emergency Call Placed',
          message: `Emergency call successfully placed to ${contactName}. Help is on the way.`
        });
      } else {
        console.error('[SOS] Failed to place emergency call');
        setSosAlertMessage({
          title: 'Call Failed',
          message: 'Unable to place emergency call. Please try again or contact emergency services directly.'
        });
      }

      // Show alert modal regardless of success/failure
      setSosAlertOpen(true);
    } catch (error) {
      console.error('[SOS] Error in emergency trigger:', error);
      setSosAlertMessage({
        title: 'Error',
        message: 'An error occurred while attempting to place the emergency call.'
      });
      setSosAlertOpen(true);
    }
  };

  const handleSosRelease = () => {
    setSosHolding(false);
    setSosTimer(0);
    if (sosTimerRef.current) {
      clearInterval(sosTimerRef.current);
      sosTimerRef.current = null;
    }
  };

  // Voice Memo handlers
  const handleVoiceMemoPress = () => {
    setVoiceMemoHolding(true);
    voiceMemoTimerRef.current = setTimeout(() => {
      console.log('[Covert] Quick voice memo recording started');
    }, 500);
  };

  const handleVoiceMemoRelease = () => {
    setVoiceMemoHolding(false);
    if (voiceMemoTimerRef.current) {
      clearTimeout(voiceMemoTimerRef.current);
      voiceMemoTimerRef.current = null;
    }
  };

  const handleVoiceMemoClick = () => {
    setCurrentPage('voice-memo');
  };

  const handleWalkingHomeClick = () => {
    setCurrentPage('walking-home');
  };

  const handleLogout = () => {
    router.push('/' as any);
  };

  useEffect(() => {
    return () => {
      if (sosTimerRef.current) clearInterval(sosTimerRef.current);
      if (voiceMemoTimerRef.current) clearTimeout(voiceMemoTimerRef.current);
    };
  }, []);

  // Pulse animation for SOS alert
  useEffect(() => {
    if (sosAlertOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [sosAlertOpen]);

  // Location services
  useEffect(() => {
    const requestLocation = async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setCurrentAddress('Location permission denied');
          setLocationAvailable(false);
          return;
        }

        // Get current position
        const location = await Location.getCurrentPositionAsync({});
        
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;
        
        // Fetch address from OpenStreetMap Nominatim
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'CovertApp/1.0', // Required by Nominatim
              },
            }
          );
          
          const data = await response.json();
          
          if (data && data.address) {
            const address = data.address;
            
            // Create detailed address with house number, road, city, state, postcode
            const detailedParts = [
              address.house_number,
              address.road,
              address.city || address.town || address.village,
              address.state,
              address.postcode,
            ].filter(Boolean);
            
            // Create simplified address for display
            const simpleParts = [
              address.road || address.house_number,
              address.city || address.town || address.village,
              address.state,
            ].filter(Boolean);
            
            // Store detailed location for emergency calls
            const detailedAddress = detailedParts.join(', ');
            setDetailedLocation(detailedAddress);
            
            // Display simplified version in status bar
            if (simpleParts.length > 0) {
              setCurrentAddress(simpleParts.join(', '));
            } else {
              // Fallback to coordinates
              const latDir = lat >= 0 ? 'N' : 'S';
              const lonDir = lon >= 0 ? 'E' : 'W';
              setCurrentAddress(`${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`);
            }
          } else {
            // Fallback to coordinates if no address data
            const latDir = lat >= 0 ? 'N' : 'S';
            const lonDir = lon >= 0 ? 'E' : 'W';
            const coordString = `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
            setCurrentAddress(coordString);
            setDetailedLocation(coordString);
          }
          
          setLocationAvailable(true);
        } catch (geocodeError) {
          console.error('Error fetching address:', geocodeError);
          // Fallback to coordinates if geocoding fails
          const latDir = lat >= 0 ? 'N' : 'S';
          const lonDir = lon >= 0 ? 'E' : 'W';
          const coordString = `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
          setCurrentAddress(coordString);
          setDetailedLocation(coordString);
          setLocationAvailable(true);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setCurrentAddress('Location unavailable');
        setLocationAvailable(false);
      }
    };

    requestLocation();
    
    // Update location every 5 minutes
    const interval = setInterval(requestLocation, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getConnectivityInfo = () => {
    switch (connectivityStatus) {
      case 'peer':
        return { icon: 'account-group', text: 'Connected to Peer' };
      case 'wifi':
        return { icon: 'wifi', text: 'Connected via Wi-Fi' };
      case 'cellular':
        return { icon: 'radio-tower', text: 'Connected via Cellular' };
    }
  };

  if (currentPage === 'voice-memo') {
    return <VoiceMemoPage onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'walking-home') {
    return (
      <WalkingHomePage
        onBack={() => setCurrentPage('home')}
        sosHolding={sosHolding}
        sosTimer={sosTimer}
        handleSosPress={handleSosPress}
        handleSosRelease={handleSosRelease}
        setSosAlertOpen={setSosAlertOpen}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          { backgroundColor: colors.background, transform: [{ translateX: sidebarAnim }] },
        ]}
      >
        <View style={[styles.sidebarContent, { paddingTop: insets.top + 16 }]}>
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              placeholder="Search"
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
          </View>

          {/* New Chat Button */}
          <TouchableOpacity style={[styles.newChatButton, { backgroundColor: colors.surface }]}>
            <Ionicons name="add" size={20} color={colors.textPrimary} />
            <Text style={[styles.newChatText, { color: colors.textPrimary }]}>New Conversation</Text>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={[styles.quickActions, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quick Actions</Text>

            {/* Walking Home */}
            <TouchableOpacity
              onPress={handleWalkingHomeClick}
              style={[styles.quickActionButton, { backgroundColor: 'transparent' }]}
            >
              <Ionicons name="home" size={20} color={colors.warning} />
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Walking Home?</Text>
            </TouchableOpacity>

            {/* SOS Button */}
            <TouchableOpacity
              onPressIn={handleSosPress}
              onPressOut={handleSosRelease}
              style={[
                styles.quickActionButton,
                sosHolding && [styles.sosHoldingButton, { backgroundColor: colors.danger }],
              ]}
            >
              <Ionicons
                name="warning"
                size={20}
                color={sosHolding ? '#ffffff' : colors.danger}
              />
              <Text
                style={[
                  styles.quickActionText,
                  { color: sosHolding ? '#ffffff' : colors.textPrimary },
                  sosHolding && styles.sosHoldingText,
                ]}
              >
                SOS {sosHolding ? '(Sending...)' : '(Press & Hold)'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conversations List */}
          <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recent</Text>

            {['Conversation 1', 'Conversation 2', 'Conversation 3'].map((title, index) => (
              <TouchableOpacity key={index} style={styles.conversationItem}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.textPrimary} />
                <Text style={[styles.conversationText, { color: colors.textPrimary }]} numberOfLines={1}>
                  {title}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.conversationItem}>
              <Feather name="more-horizontal" size={20} color={colors.textSecondary} />
              <Text style={[styles.conversationText, { color: colors.textSecondary }]}>See more</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Settings Button */}
          <TouchableOpacity
            onPress={() => setSettingsOpen(true)}
            style={[styles.settingsButton, { borderTopColor: colors.border }]}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.settingsText, { color: colors.textPrimary }]}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Exit Button */}
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.settingsButton, { borderTopWidth: 0 }]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.danger} />
            <Text style={[styles.settingsText, { color: colors.danger }]}>Exit</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main Content */}
      <Animated.View
        style={[styles.mainContent, { transform: [{ translateX: mainContentAnim }] }]}
      >
        {/* Overlay */}
        {sidebarOpen && (
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.4],
                }),
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
          </Animated.View>
        )}

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={openSidebar} style={styles.menuButton}>
            <Ionicons name="menu" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={[styles.headerTitleText, { color: colors.textPrimary }]}>Covrt </Text>
            <Text style={[styles.headerVersion, { color: colors.textSecondary }]}>v1</Text>
          </View>

          <TouchableOpacity onPress={() => setSettingsOpen(true)} style={styles.settingsIconButton}>
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Chat Area */}
        <ScrollView 
          style={styles.chatArea} 
          contentContainerStyle={styles.chatAreaContent}
          scrollEnabled={false}
        >
          <View style={styles.cardsGrid}>
            {/* Notepad - Full width */}
            <TouchableOpacity
              style={[
                styles.card,
                styles.cardFullWidth,
                { backgroundColor: colors.surface, borderColor: '#10b981', borderWidth: 2 },
              ]}
              activeOpacity={0.95}
            >
              <Ionicons name="book-outline" size={48} color="#10b981" />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Notepad</Text>
            </TouchableOpacity>

            {/* Voice Memo */}
            <TouchableOpacity
              onPress={handleVoiceMemoClick}
              onPressIn={handleVoiceMemoPress}
              onPressOut={handleVoiceMemoRelease}
              style={[
                styles.card,
                styles.cardHalfWidth,
                {
                  backgroundColor: voiceMemoHolding ? colors.accent : colors.surface,
                  borderColor: voiceMemoHolding ? colors.accent : colors.border,
                  borderWidth: 1,
                },
              ]}
              activeOpacity={0.95}
            >
              <Ionicons
                name="mic"
                size={40}
                color={voiceMemoHolding ? '#ffffff' : colors.textPrimary}
              />
              <View style={styles.cardTextContainer}>
                <Text
                  style={[
                    styles.cardSubtitle,
                    { color: voiceMemoHolding ? '#ffffff' : colors.textPrimary },
                  ]}
                >
                  {voiceMemoHolding ? 'Recording...' : 'Voice Memo'}
                </Text>
                {!voiceMemoHolding && (
                  <Text style={[styles.cardHint, { color: colors.textSecondary }]}>Tap or hold</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Walking Home */}
            <TouchableOpacity
              onPress={handleWalkingHomeClick}
              style={[
                styles.card,
                styles.cardHalfWidth,
                { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              ]}
              activeOpacity={0.95}
            >
              <Ionicons name="home" size={40} color={colors.warning} />
              <Text style={[styles.cardSubtitle, { color: colors.textPrimary }]}>Walking Home?</Text>
            </TouchableOpacity>

            {/* Emergency SOS - Full width */}
            <TouchableOpacity
              onPressIn={handleSosPress}
              onPressOut={handleSosRelease}
              style={[
                styles.card,
                styles.cardFullWidth,
                {
                  backgroundColor: sosHolding ? colors.danger : colors.surface,
                  borderColor: colors.danger,
                  borderWidth: 2,
                },
              ]}
              activeOpacity={0.95}
            >
              <Ionicons name="warning" size={40} color={sosHolding ? '#ffffff' : colors.danger} />
              <View style={styles.sosCardContent}>
                <Text
                  style={[
                    styles.sosCardTitle,
                    { color: sosHolding ? '#ffffff' : colors.danger },
                  ]}
                >
                  {sosHolding ? `Sending SOS... ${Math.ceil(3 - sosTimer)}s` : 'Emergency SOS'}
                </Text>
                {!sosHolding && (
                  <Text style={[styles.cardHint, { color: colors.textSecondary }]}>Hold for 3 seconds</Text>
                )}
                {sosHolding && (
                  <View style={styles.sosProgressContainer}>
                    <View style={[styles.sosProgressBar, { width: `${(sosTimer / 3) * 100}%` }]} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Location Status Bar */}
        <View style={styles.connectivityBar}>
          <View style={[styles.connectivityBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.greenDot, { backgroundColor: locationAvailable ? '#28a745' : '#ef4444' }]} />
            <Text style={[styles.connectivityText, { color: colors.textPrimary }]} numberOfLines={1}>
              {currentAddress}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* SOS Alert Modal */}
      {sosAlertOpen && (
        <View style={styles.alertOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSosAlertOpen(false)} />
          <View style={[styles.alertModal, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.alertContent}>
              <Animated.View
                style={[
                  styles.alertIcon,
                  { backgroundColor: colors.danger, transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Ionicons name="warning" size={40} color="#ffffff" />
              </Animated.View>
              <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>
                {sosAlertMessage.title}
              </Text>
              <Text style={[styles.alertText, { color: colors.textSecondary }]}>
                {sosAlertMessage.message}
              </Text>
              <TouchableOpacity
                onPress={() => setSosAlertOpen(false)}
                style={[styles.alertButton, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.alertButtonText, { color: colors.textPrimary }]}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  sidebarContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  newChatText: {
    fontSize: 16,
    fontWeight: '500',
  },
  quickActions: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  sosHoldingButton: {
    transform: [{ scale: 0.95 }],
  },
  quickActionText: {
    fontSize: 16,
  },
  sosHoldingText: {
    fontWeight: '600',
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  conversationText: {
    flex: 1,
    fontSize: 16,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 16,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
  },
  mainContent: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '500',
  },
  headerVersion: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  settingsIconButton: {
    padding: 8,
    borderRadius: 8,
  },
  chatArea: {
    flex: 1,
  },
  chatAreaContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingBottom: 96,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  cardFullWidth: {
    width: '100%',
    minHeight: 160,
  },
  cardHalfWidth: {
    width: '47%',
    minHeight: 140,
  },
  cardTextContainer: {
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardHint: {
    fontSize: 12,
    marginTop: 2,
  },
  sosCardContent: {
    marginTop: 12,
    width: '100%',
  },
  sosCardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sosProgressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  sosProgressBar: {
    height: '100%',
    backgroundColor: '#ffffff',
  },
  connectivityBar: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  connectivityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  connectivityText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#28a745',
  },
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 16,
  },
  alertModal: {
    maxWidth: 400,
    width: '100%',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  alertContent: {
    alignItems: 'center',
  },
  alertIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  alertText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  alertButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

