import { useTheme } from '@/contexts/ThemeContext';
import { DeviceService, UserDocument } from '@/lib/deviceService';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
};

type SettingsPage = 'main' | 'emergency-contacts' | 'communication-settings';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, colors, toggleTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState<SettingsPage>('main');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [contactFormData, setContactFormData] = useState({ name: '', phone: '' });
  const [notesForEmergency, setNotesForEmergency] = useState(
    'I need help. This is an emergency. Please contact me immediately or send assistance to my location.'
  );
  const [appendLocation, setAppendLocation] = useState(true);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [tempMessage, setTempMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [isFullNameModalOpen, setIsFullNameModalOpen] = useState(false);
  const [tempFullName, setTempFullName] = useState('');
  const [accessPin, setAccessPin] = useState('');
  const [isAccessPinModalOpen, setIsAccessPinModalOpen] = useState(false);
  const [tempAccessPin, setTempAccessPin] = useState('');

  // Animation states
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [dragY] = useState(new Animated.Value(0));

  // Pan responder for drag to close
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        dragY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        handleClose();
      } else {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentPage('main');
      loadUserSettings(); // Load settings from Firebase
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dragY.setValue(0);
      onClose();
    });
  };

  const addEmergencyContact = () => {
    if (emergencyContacts.length < 3) {
      setEditingContact(null);
      setContactFormData({ name: '', phone: '' });
      setIsContactModalOpen(true);
    }
  };

  const editEmergencyContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setContactFormData({ name: contact.name, phone: contact.phone });
    setIsContactModalOpen(true);
  };

  const saveContact = () => {
    let updatedContacts: EmergencyContact[];
    
    if (editingContact) {
      updatedContacts = emergencyContacts.map((contact) =>
        contact.id === editingContact.id
          ? { ...contact, name: contactFormData.name, phone: contactFormData.phone }
          : contact
      );
    } else {
      updatedContacts = [
        ...emergencyContacts,
        { id: Date.now().toString(), name: contactFormData.name, phone: contactFormData.phone },
      ];
    }
    
    setEmergencyContacts(updatedContacts);
    setIsContactModalOpen(false);
    setContactFormData({ name: '', phone: '' });
    
    // Save to Firebase
    saveToFirebase({ emergency_contacts: updatedContacts });
  };

  const removeEmergencyContact = (id: string) => {
    Alert.alert('Delete Contact', 'Are you sure you want to delete this contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedContacts = emergencyContacts.filter((contact) => contact.id !== id);
          setEmergencyContacts(updatedContacts);
          setIsContactModalOpen(false);
          
          // Save to Firebase
          saveToFirebase({ emergency_contacts: updatedContacts });
        },
      },
    ]);
  };

  const openMessageModal = () => {
    setTempMessage(notesForEmergency);
    setIsMessageModalOpen(true);
  };

  const saveMessage = () => {
    setNotesForEmergency(tempMessage);
    setIsMessageModalOpen(false);
    saveToFirebase({ notes_for_emergency: tempMessage });
  };

  const openFullNameModal = () => {
    setTempFullName(fullName);
    setIsFullNameModalOpen(true);
  };

  const saveFullName = () => {
    setFullName(tempFullName);
    setIsFullNameModalOpen(false);
    saveToFirebase({ name: tempFullName });
  };

  const openAccessPinModal = () => {
    setTempAccessPin(accessPin);
    setIsAccessPinModalOpen(true);
  };

  const saveAccessPin = () => {
    // Validate PIN: 4-6 digits only
    if (!/^\d{4,6}$/.test(tempAccessPin)) {
      Alert.alert('Invalid PIN', 'PIN must be 4-6 digits only.');
      return;
    }
    setAccessPin(tempAccessPin);
    setIsAccessPinModalOpen(false);
    saveToFirebase({ pin: tempAccessPin });
  };

  const getTruncatedMessage = (message: string, maxLines = 3) => {
    const lines = message.split('\n');
    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).join('\n') + '...';
    }
    return message;
  };

  // Firebase persistence functions
  const loadUserSettings = async () => {
    try {
      const deviceService = DeviceService.getInstance();
      const userDoc = await deviceService.getUserDocument();
      
      if (userDoc) {
        setEmergencyContacts(userDoc.emergency_contacts || []);
        setNotesForEmergency(userDoc.notes_for_emergency || 'I need help. This is an emergency. Please contact me immediately or send assistance to my location.');
        setFullName(userDoc.name || '');
        setAccessPin(userDoc.pin || '');
        setAppendLocation(userDoc.append_location !== undefined ? userDoc.append_location : true);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const saveToFirebase = async (updates: Partial<UserDocument>) => {
    try {
      const deviceService = DeviceService.getInstance();
      const deviceId = await deviceService.getDeviceId();
      
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');
      
      const userRef = doc(db, 'users', deviceId);
      await setDoc(userRef, {
        ...updates,
        lastAccessed: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving to Firebase:', error);
    }
  };

  const handleAppendLocationToggle = (value: boolean) => {
    setAppendLocation(value);
    saveToFirebase({ append_location: value });
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'emergency-contacts':
        return 'Emergency Contacts';
      case 'communication-settings':
        return 'Communication Settings';
      default:
        return 'Settings';
    }
  };

  if (!isOpen) return null;

  return (
    <Modal transparent visible={isOpen} animationType="none" onRequestClose={handleClose}>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheetContainer,
          {
            transform: [
              { translateY: slideAnim },
              { translateY: dragY },
            ],
          },
        ]}
      >
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              {currentPage !== 'main' && (
                <TouchableOpacity
                  onPress={() => setCurrentPage('main')}
                  style={[styles.backButton, { backgroundColor: 'transparent' }]}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              )}
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{getPageTitle()}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {currentPage === 'main' && (
              <>
                {/* Appearance */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
                  <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
                    <View style={styles.settingItemLeft}>
                      <Ionicons
                        name={theme === 'dark' ? 'moon' : 'sunny'}
                        size={20}
                        color={colors.textPrimary}
                      />
                      <View style={styles.settingItemText}>
                        <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>Theme</Text>
                        <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>
                          {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={theme === 'dark'}
                      onValueChange={toggleTheme}
                      trackColor={{ false: colors.border, true: colors.accent }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>

                {/* Privacy & Security */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Privacy & Security</Text>
                  
                  <TouchableOpacity
                    onPress={() => setCurrentPage('emergency-contacts')}
                    style={[styles.settingItem, { backgroundColor: colors.surface, marginBottom: 8 }]}
                  >
                    <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>
                      Emergency Contacts
                    </Text>
                    <View style={styles.settingItemRight}>
                      <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>
                        {emergencyContacts.length} contacts
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setCurrentPage('communication-settings')}
                    style={[styles.settingItem, { backgroundColor: colors.surface, marginBottom: 8 }]}
                  >
                    <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>
                      Communication Settings
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>

                  {/* Access PIN */}
                  <TouchableOpacity
                    onPress={openAccessPinModal}
                    style={[styles.settingItem, { backgroundColor: colors.surface }]}
                  >
                    <View style={styles.settingItemLeft}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.textPrimary} />
                      <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>
                        Access PIN
                      </Text>
                    </View>
                    <View style={styles.settingItemRight}>
                      <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>
                        {accessPin ? '•'.repeat(Math.min(accessPin.length, 6)) : 'Not set'}
                      </Text>
                      <Feather name="edit-2" size={16} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* About */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>
                  <View style={[styles.settingItem, { backgroundColor: colors.surface, marginBottom: 8 }]}>
                    <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>Version</Text>
                    <Text style={[styles.versionText, { color: colors.textSecondary }]}>v1.0.0</Text>
                  </View>
                  <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>
                      Help & Support
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {currentPage === 'emergency-contacts' && (
              <View>
                {/* Warning Banner */}
                <View style={styles.warningBanner}>
                  <Text style={styles.warningText}>
                    Only +1 (US/Canada) phone numbers are currently supported
                  </Text>
                </View>

                {/* Contacts List */}
                <View style={styles.contactsList}>
                  {emergencyContacts.map((contact) => (
                    <View key={contact.id} style={[styles.contactItem, { backgroundColor: colors.surface }]}>
                      <View style={styles.contactInfo}>
                        <Text style={[styles.contactName, { color: colors.textPrimary }]}>
                          {contact.name || 'Unnamed Contact'}
                        </Text>
                        <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
                          +1 {contact.phone || 'No number'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => editEmergencyContact(contact)}
                        style={styles.contactMoreButton}
                      >
                        <Feather name="more-vertical" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Add Button */}
                {emergencyContacts.length < 3 && (
                  <TouchableOpacity
                    onPress={addEmergencyContact}
                    style={[styles.addButton, { backgroundColor: colors.accent }]}
                  >
                    <Ionicons name="add" size={20} color="#ffffff" />
                    <Text style={styles.addButtonText}>Add Emergency Contact</Text>
                  </TouchableOpacity>
                )}

                {emergencyContacts.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                      No emergency contacts added yet
                    </Text>
                  </View>
                )}
              </View>
            )}

            {currentPage === 'communication-settings' && (
              <View>
                {/* Full Name */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Full Name</Text>
                  <TouchableOpacity
                    onPress={openFullNameModal}
                    style={[styles.messagePreview, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Text style={[styles.messagePreviewText, { color: colors.textPrimary }]} numberOfLines={1}>
                      {fullName || 'Enter your full name'}
                    </Text>
                    <View style={styles.messagePreviewIcon}>
                      <Feather name="edit-2" size={16} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Notes for Emergency */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notes for Emergency</Text>
                  <TouchableOpacity
                    onPress={openMessageModal}
                    style={[styles.messagePreview, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Text style={[styles.messagePreviewText, { color: colors.textPrimary }]} numberOfLines={3}>
                      {getTruncatedMessage(notesForEmergency)}
                    </Text>
                    <View style={styles.messagePreviewIcon}>
                      <Feather name="edit-2" size={16} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Append Location */}
                <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
                  <View style={styles.appendLocationContent}>
                    <Text style={[styles.settingItemTitle, { color: colors.textPrimary }]}>
                      Append Current Location
                    </Text>
                    <Text style={[styles.appendLocationDesc, { color: colors.textSecondary }]}>
                      When SOS is dialed, the Agent will report the User's current location to the dispatcher or
                      emergency contact automatically.
                    </Text>
                  </View>
                  <Switch
                    value={appendLocation}
                    onValueChange={handleAppendLocationToggle}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor="#ffffff"
                    style={styles.appendLocationSwitch}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Animated.View>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <Modal transparent visible={isContactModalOpen} animationType="fade">
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsContactModalOpen(false)} />
            <View style={[styles.modal, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingContact ? 'Edit Contact' : 'Add Contact'}
                </Text>
                <TouchableOpacity onPress={() => setIsContactModalOpen(false)}>
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Name</Text>
                  <TextInput
                    value={contactFormData.name}
                    onChangeText={(text) => setContactFormData({ ...contactFormData, name: text })}
                    placeholder="Enter name"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.formInput,
                      { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
                    ]}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Phone Number</Text>
                  <View style={styles.phoneInputContainer}>
                    <View
                      style={[
                        styles.phonePrefix,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.phonePrefixText, { color: colors.textPrimary }]}>+1</Text>
                    </View>
                    <TextInput
                      value={contactFormData.phone}
                      onChangeText={(text) => {
                        const value = text.replace(/\D/g, '').slice(0, 10);
                        setContactFormData({ ...contactFormData, phone: value });
                      }}
                      placeholder="(555) 123-4567"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="phone-pad"
                      style={[
                        styles.formInput,
                        styles.phoneInput,
                        { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
                      ]}
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                {editingContact && (
                  <TouchableOpacity
                    onPress={() => removeEmergencyContact(editingContact.id)}
                    style={styles.deleteButton}
                  >
                    <MaterialIcons name="delete" size={16} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={saveContact}
                  disabled={!contactFormData.name || !contactFormData.phone}
                  style={[
                    styles.saveButton,
                    { backgroundColor: colors.accent },
                    (!contactFormData.name || !contactFormData.phone) && styles.saveButtonDisabled,
                  ]}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Message Modal */}
      {isMessageModalOpen && (
        <Modal transparent visible={isMessageModalOpen} animationType="fade">
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsMessageModalOpen(false)} />
            <View style={[styles.modal, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Notes for Emergency</Text>
                <TouchableOpacity onPress={() => setIsMessageModalOpen(false)}>
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <TextInput
                  value={tempMessage}
                  onChangeText={setTempMessage}
                  placeholder="Enter your emergency message..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  style={[
                    styles.messageTextArea,
                    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
                  ]}
                />
              </View>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  onPress={saveMessage}
                  disabled={!tempMessage.trim()}
                  style={[
                    styles.saveButton,
                    styles.saveButtonFull,
                    { backgroundColor: colors.accent },
                    !tempMessage.trim() && styles.saveButtonDisabled,
                  ]}
                >
                  <Text style={styles.saveButtonText}>Save Notes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Full Name Modal */}
      {isFullNameModalOpen && (
        <Modal transparent visible={isFullNameModalOpen} animationType="fade">
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsFullNameModalOpen(false)} />
            <View style={[styles.modal, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Full Name</Text>
                <TouchableOpacity onPress={() => setIsFullNameModalOpen(false)}>
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <TextInput
                  value={tempFullName}
                  onChangeText={setTempFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textSecondary}
                  numberOfLines={1}
                  style={[
                    styles.formInput,
                    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
                  ]}
                />
              </View>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  onPress={saveFullName}
                  disabled={!tempFullName.trim()}
                  style={[
                    styles.saveButton,
                    styles.saveButtonFull,
                    { backgroundColor: colors.accent },
                    !tempFullName.trim() && styles.saveButtonDisabled,
                  ]}
                >
                  <Text style={styles.saveButtonText}>Save Name</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Access PIN Modal */}
      {isAccessPinModalOpen && (
        <Modal transparent visible={isAccessPinModalOpen} animationType="fade">
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsAccessPinModalOpen(false)} />
            <View style={[styles.modal, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Access PIN</Text>
                <TouchableOpacity onPress={() => setIsAccessPinModalOpen(false)}>
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <TextInput
                  value={tempAccessPin}
                  onChangeText={(text) => {
                    // Only allow digits, max 6 characters
                    const numericValue = text.replace(/\D/g, '').slice(0, 6);
                    setTempAccessPin(numericValue);
                  }}
                  placeholder="Enter PIN (4-6 digits)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                  style={[
                    styles.formInput,
                    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
                  ]}
                />
              </View>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  onPress={saveAccessPin}
                  disabled={!tempAccessPin.trim() || tempAccessPin.length < 4}
                  style={[
                    styles.saveButton,
                    styles.saveButtonFull,
                    { backgroundColor: colors.accent },
                    (!tempAccessPin.trim() || tempAccessPin.length < 4) && styles.saveButtonDisabled,
                  ]}
                >
                  <Text style={styles.saveButtonText}>Save PIN</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: 430,
    alignSelf: 'center',
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandleContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingItemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  warningBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#f59e0b',
  },
  contactsList: {
    gap: 8,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 14,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  contactMoreButton: {
    padding: 8,
    borderRadius: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
  },
  messagePreview: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    position: 'relative',
  },
  messagePreviewText: {
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 32,
  },
  messagePreviewIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  appendLocationContent: {
    flex: 1,
    paddingRight: 12,
  },
  appendLocationDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  appendLocationSwitch: {
    alignSelf: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  formInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  phonePrefix: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 16,
    fontFamily: 'monospace',
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'monospace',
  },
  messageTextArea: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    height: 160,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonFull: {
    width: '100%',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
});

