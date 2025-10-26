import { UserDocument } from './deviceService';

interface EmergencyCallParams {
  agent_id: string;
  agent_phone_number_id: string;
  to_number: string;
  conversation_initiation_client_data: {
    dynamic_variables: {
      caller_name: string;
      callee_name: string;
      location: string;
      notes: string;
    };
  };
}

const ELEVENLABS_API_KEY = 'sk_90507edb4a1ddabab1f8af3c078cad5835436f4b5ee120b0';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/convai/twilio/outbound-call';
const AGENT_ID = 'agent_2401k8f7my85eg48nrt34gv2bcgt';
const AGENT_PHONE_NUMBER_ID = '67KT0465VqgdB70dG9cN';

/**
 * Formats a phone number to ensure it has +1 prefix
 * @param phone - Phone number (with or without +1)
 * @returns Formatted phone number with +1 prefix
 */
function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with 1, add + prefix
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it's 10 digits, add +1 prefix
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it already has +1, return as is
  if (phone.startsWith('+1')) {
    return phone;
  }
  
  return phone;
}

/**
 * Triggers an emergency call to the first emergency contact
 * @param userData - User data from Firebase
 * @param location - Detailed address location
 * @returns Promise<boolean> - True if call was successful, false otherwise
 */
export async function triggerEmergencyCall(
  userData: UserDocument,
  location: string
): Promise<boolean> {
  try {
    // Validate that emergency contacts exist
    if (!userData.emergency_contacts || userData.emergency_contacts.length === 0) {
      console.error('[Emergency] No emergency contacts configured');
      return false;
    }

    const firstContact = userData.emergency_contacts[0];
    
    // Validate contact has required fields
    if (!firstContact.phone) {
      console.error('[Emergency] First contact does not have a phone number');
      return false;
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(firstContact.phone);

    // Get caller and callee names
    const callerName = userData.name || 'Unknown';
    const calleeName = firstContact.name || 'Emergency Contact';
    const notes = userData.notes_for_emergency || 'Emergency call activated';

    // Prepare API request payload
    const payload: EmergencyCallParams = {
      agent_id: AGENT_ID,
      agent_phone_number_id: AGENT_PHONE_NUMBER_ID,
      to_number: formattedPhone,
      conversation_initiation_client_data: {
        dynamic_variables: {
          caller_name: callerName,
          callee_name: calleeName,
          location: location,
          notes: notes,
        },
      },
    };

    console.log('[Emergency] Triggering call to:', formattedPhone);
    console.log('[Emergency] Location:', location);

    // Make API call to ElevenLabs
    const response = await fetch(ELEVENLABS_API_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Emergency] API call failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('[Emergency] Call initiated successfully:', result);
    return true;
  } catch (error) {
    console.error('[Emergency] Error triggering call:', error);
    return false;
  }
}

