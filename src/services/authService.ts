import api from './api';
import { User, UserSettings } from '../types/user';

// Interface นี้ใช้ร่วมกันทั้ง Login และ Register
export interface LoginResponse {
  token: string; // JWT Token ของแอปเรา
  user: User;
  settings: UserSettings; // Backend อาจจะส่ง object ว่าง {} มาก่อน
}

export const authService = {
  /**
   * Login using owner number and password.
   */
  login: async (ownerNumber: string, password: string): Promise<LoginResponse> => {
    try {
      // เรียก Backend endpoint /api/auth/login
      const response = await api.post<LoginResponse>('/auth/login', {
        owner_number: ownerNumber, // Key ต้องตรงกับที่ backend รอรับ
        password: password
      });
      return response.data; // ส่งข้อมูล (token, user, settings) กลับไป
    } catch (error) {
       // --- ส่วน Bypass Login (เก็บไว้เผื่อทดสอบ) ---
       // ใช้ ownerNumber ที่ลงท้ายด้วย 888 และ password อะไรก็ได้ที่ไม่ใช่ค่าว่าง
       if (ownerNumber.endsWith('888') && password) {
            console.warn("Login API failed or invalid credentials, attempting Bypass Login...");
            const mockUser: User = {
                user_id: `mock-bypass-${ownerNumber}`,
                owner_number: ownerNumber,
                owner_name: `Bypass User (${ownerNumber.slice(-4)})`,
                sms_lang: 'TH',
                // default_language: 'TH', // เอาออกแล้ว
                avatar: `https://i.pravatar.cc/150?u=${ownerNumber}`
            };
            const mockSettings: UserSettings = { // ใส่ค่า default ที่เหมาะสม
                announcement: null,
                announcement_from: null,
                announcement_to: null,
                dnd_active: false,
                dnd_start: null,
                dnd_end: null
            };
             return { token: 'mock-bypass-jwt-token', user: mockUser, settings: mockSettings };
        }
       // --- จบส่วน Bypass ---

      console.error("Login service failed:", error);
      // ส่ง error กลับไปให้ Context จัดการ (อาจมี message จาก backend)
      throw error;
    }
  },

  /**
   * Register a new user.
   */
  register: async (ownerNumber: string, password: string, ownerName?: string): Promise<LoginResponse> => {
    try {
      // เรียก Backend endpoint /api/auth/register
      const response = await api.post<LoginResponse>('/auth/register', {
        owner_number: ownerNumber,
        password: password,
        owner_name: ownerName // ส่งชื่อไปด้วย (optional)
      });
      return response.data; // Backend คืน token, user, settings เหมือน login
    } catch (error) {
      console.error("Register service failed:", error);
      throw error; // ส่ง error กลับไปให้ Context จัดการ
    }
  },

  /**
   * Logout (ทำที่ Frontend โดยลบ token)
   */
  logout: async (): Promise<void> => {
    // ไม่ต้องเรียก API แค่ลบข้อมูลที่ localStorage
    return Promise.resolve();
  },

  /**
   * Update user profile information.
   */
  updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    try {
      // TODO: สร้าง Endpoint PUT /api/users/:userId ที่ Backend
      const response = await api.put(`/users/${userId}`, data);
      return response.data;
    } catch (error) {
      console.warn("Update profile API failed, returning mock data.", error);
      // Mock สำหรับ Development (ถ้า API ยังไม่พร้อม)
      const currentUserData = JSON.parse(localStorage.getItem('ais_user') || '{}');
      return {
        ...currentUserData, // ใช้ข้อมูลเดิมเป็นฐาน
        ...data, // เอาข้อมูลใหม่ทับ
        user_id: userId
      } as User;
    }
  },

  /**
   * Update user settings.
   */
  updateSettings: async (userId: string, settings: Partial<UserSettings>): Promise<UserSettings> => {
    try {
       // TODO: สร้าง Endpoint PUT /api/users/:userId/settings ที่ Backend
      const response = await api.put(`/users/${userId}/settings`, settings);
      return response.data;
    } catch (error) {
      console.warn("Update settings API failed, returning mock data.", error);
       // Mock สำหรับ Development (ถ้า API ยังไม่พร้อม)
       const currentSettingsData = JSON.parse(localStorage.getItem('ais_settings') || '{}');
      return { ...currentSettingsData, ...settings } as UserSettings;
    }
  }
};