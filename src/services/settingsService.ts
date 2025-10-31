// src/services/settingsService.ts
import api from './api';
import { User, UserSettings } from '../types/user';

// Interface สำหรับ data ที่ส่งไป update
export interface UpdateSettingsData {
  owner_name?: string;
  owner_name_spelling?: string; // (Case 15)
  sms_lang?: string;
  announcement?: string | null; // (Case 12)
  // TODO: Add DND/Forwarding fields here when implemented
}

// Interface สำหรับ response ที่ได้กลับมา (ตรงกับ server.js)
interface UpdateSettingsResponse {
  user: User;
  settings: UserSettings;
}

export const settingsService = {
  /**
   * Updates user profile data (name, spelling) AND secretary settings
   * (announcement, dnd, etc.) in one call.
   */
  updateSettings: async (data: UpdateSettingsData): Promise<UpdateSettingsResponse> => {
    // userId ถูกส่งไปใน token แล้ว ไม่ต้องใส่ใน URL
    const response = await api.put<UpdateSettingsResponse>('/settings', data);
    return response.data;
  },
};