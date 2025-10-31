// src/types/user.ts

export interface User {
  user_id: string;
  owner_number: string;
  // MODIFIED: (Case 15)
  owner_name: string | null; // Changed to allow null
  owner_name_spelling?: string | null; // ADDED for Case 15
  sms_lang: string | null; // Changed to allow null

  // REMOVED: These fields are now in UserSettings
  // default_language: string; 
  // avatar?: string;
  // announcement?: string;
  // announcement_from?: string | null;
  // announcement_to?: string | null;
  // dnd_active?: boolean;
  // dnd_start?: string | null;
  // dnd_end?: string | null;
  // created_at?: string;
  // updated_at?: string;
}

export interface UserSettings {
  announcement: string | null;
  announcement_from: string | null;
  announcement_to: string | null;
  dnd_active: boolean;
  dnd_start: string | null;
  dnd_end: string | null;
  
  // NOTE: 'voicemailEnabled' and 'announcementEnabled' 
  // from SettingsPage.tsx are not in the backend response.
  // We will rely on 'announcement' (string|null) for Case 12
}

export interface UserState {
  status: 'available' | 'busy' | 'dnd' | 'away';
  statusMessage?: string;
  callForwarding?: boolean;
  forwardingNumber?: string;
}