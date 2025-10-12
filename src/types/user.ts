export interface User {
  user_id: string;
  owner_number: string;
  owner_name: string;
  sms_lang: string;
  default_language: string;
  avatar?: string;
  announcement?: string;
  announcement_from?: string | null;
  announcement_to?: string | null;
  dnd_active?: boolean;
  dnd_start?: string | null;
  dnd_end?: string | null;
  created_at?: string;
  updated_at?: string;
}
export interface UserSettings {
  announcement: string | null;
  announcement_from: string | null;
  announcement_to: string | null;
  dnd_active: boolean;
  dnd_start: string | null;
  dnd_end: string | null;
}
export interface UserState {
  status: 'available' | 'busy' | 'dnd' | 'away';
  statusMessage?: string;
  callForwarding?: boolean;
  forwardingNumber?: string;
}