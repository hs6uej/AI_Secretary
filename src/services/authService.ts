import api from './api';
import { User, UserSettings } from '../types/user';
export interface LoginResponse {
  token: string;
  user: User;
  settings: UserSettings;
}
export const authService = {
  login: async (otp: string, phoneNumber: string): Promise<LoginResponse> => {
    try {
      // In production, this would call the actual API
      const response = await api.post('/auth/login', {
        otp,
        phoneNumber
      });
      return response.data;
    } catch (error) {
      // For development/testing
      if (otp === '123456' || phoneNumber === '+66812345678') {
        // Mock successful login
        const mockUser: User = {
          user_id: 'mock-user-id',
          owner_number: phoneNumber,
          owner_name: 'Demo User',
          sms_lang: 'TH',
          default_language: 'TH',
          avatar: 'https://i.pravatar.cc/150?u=demo@example.com'
        };
        const mockSettings: UserSettings = {
          announcement: '',
          announcement_from: null,
          announcement_to: null,
          dnd_active: false,
          dnd_start: null,
          dnd_end: null
        };
        return {
          token: 'mock-jwt-token',
          user: mockUser,
          settings: mockSettings
        };
      }
      throw new Error('Invalid OTP or phone number');
    }
  },
  logout: async (): Promise<void> => {
    // In production, this would call the API to invalidate the token
    // For now, just clear local storage
    return Promise.resolve();
  },
  updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    try {
      const response = await api.put(`/users/${userId}`, data);
      return response.data;
    } catch (error) {
      // For development/testing
      return {
        ...data,
        user_id: userId
      } as User;
    }
  },
  updateSettings: async (userId: string, settings: Partial<UserSettings>): Promise<UserSettings> => {
    try {
      const response = await api.put(`/users/${userId}/settings`, settings);
      return response.data;
    } catch (error) {
      // For development/testing
      return settings as UserSettings;
    }
  }
};