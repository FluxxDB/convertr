import { db } from '@/config/firebase';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

export interface UserDocument {
  deviceId: string;
  notes_for_emergency: string;
  emergency_contacts: Array<{name: string, phone: string}>;
  name: string;
  theme: 'light' | 'dark';
  append_location: boolean;
  pin?: string;
  createdAt: string;
  lastAccessed: string;
}

export class DeviceService {
  private static instance: DeviceService;
  private deviceId: string | null = null;

  private constructor() {}

  public static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  public async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }

    try {
      let deviceId: string;

      if (Platform.OS === 'web') {
        // For web, use a combination of browser fingerprinting
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('Device fingerprint', 2, 2);
        }
        const fingerprint = canvas.toDataURL();
        deviceId = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          fingerprint + navigator.userAgent + screen.width + screen.height,
          { encoding: Crypto.CryptoEncoding.BASE64 }
        );
      } else {
        // For mobile, use device-specific identifiers
        const applicationId = Application.applicationId;
        const deviceName = Device.deviceName || 'Unknown Device';
        const deviceType = Device.deviceType || 0;
        const osVersion = Device.osVersion || 'Unknown';
        
        const deviceInfo = `${applicationId}-${deviceName}-${deviceType}-${osVersion}`;
        deviceId = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          deviceInfo,
          { encoding: Crypto.CryptoEncoding.BASE64 }
        );
      }

      // Sanitize device ID for Firebase compatibility
      const sanitizedDeviceId = deviceId.replace(/[/\\]/g, '_');
      this.deviceId = sanitizedDeviceId;
      return sanitizedDeviceId;
    } catch (error) {
      console.error('Error generating device ID:', error);
      // Fallback to a random ID if device detection fails
      const fallbackId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `fallback-${Date.now()}-${Math.random()}`,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      this.deviceId = fallbackId;
      return fallbackId;
    }
  }

  public async createOrUpdateUserDocument(): Promise<UserDocument> {
    try {
      const deviceId = await this.getDeviceId();
      const userRef = doc(db, 'users', deviceId);
      
      // Check if document already exists
      const userDoc = await getDoc(userRef);
      const now = new Date().toISOString();

      if (userDoc.exists()) {
        // Update lastAccessed time
        const existingData = userDoc.data() as UserDocument;
        const updatedData: Partial<UserDocument> = {
          lastAccessed: now,
        };
        
        await setDoc(userRef, updatedData, { merge: true });
        
        return {
          ...existingData,
          ...updatedData,
        } as UserDocument;
      } else {
        // Create new document with default values
        const newUserData: UserDocument = {
          deviceId,
          notes_for_emergency: '',
          emergency_contacts: [],
          name: '',
          theme: 'dark',
          append_location: true,
          createdAt: now,
          lastAccessed: now,
        };

        await setDoc(userRef, newUserData);
        return newUserData;
      }
    } catch (error) {
      console.error('Error creating/updating user document:', error);
      throw error;
    }
  }

  public async getUserDocument(): Promise<UserDocument | null> {
    try {
      const deviceId = await this.getDeviceId();
      const userRef = doc(db, 'users', deviceId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserDocument;
      }
      return null;
    } catch (error) {
      console.error('Error getting user document:', error);
      return null;
    }
  }
}
