import React, { useEffect, useState, createContext, useContext } from 'react';
interface User {
  user_id: string;
  owner_number: string;
  owner_name: string;
  sms_lang: string;
  default_language: string;
  avatar?: string;
}
interface UserSettings {
  announcement: string | null;
  announcement_from: string | null;
  announcement_to: string | null;
  dnd_active: boolean;
  dnd_start: string | null;
  dnd_end: string | null;
  // Legacy fields for backward compatibility
  voicemailEnabled?: boolean;
  announcementEnabled?: boolean;
  announcementMessage?: string;
  callForwarding?: boolean;
  forwardingNumber?: string;
}
interface UserState {
  status: 'available' | 'busy' | 'dnd' | 'away';
  statusMessage?: string;
  callForwarding?: boolean;
  forwardingNumber?: string;
}
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  userSettings: UserSettings;
  userState: UserState;
  login: (otp: string, phoneNumber: string) => Promise<void>;
  logout: () => void;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  updateUserState: (state: Partial<UserState>) => void;
}
const defaultSettings: UserSettings = {
  announcement: null,
  announcement_from: null,
  announcement_to: null,
  dnd_active: false,
  dnd_start: null,
  dnd_end: null,
  voicemailEnabled: true,
  announcementEnabled: false,
  announcementMessage: '',
  callForwarding: false,
  forwardingNumber: ''
};
const defaultState: UserState = {
  status: 'available',
  statusMessage: 'Your AI Secretary is active and handling calls',
  callForwarding: false,
  forwardingNumber: ''
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultSettings);
  const [userState, setUserState] = useState<UserState>(defaultState);
  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('ais_token');
    const userData = localStorage.getItem('ais_user');
    const settingsData = localStorage.getItem('ais_settings');
    const stateData = localStorage.getItem('ais_state');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      if (settingsData) {
        setUserSettings({
          ...defaultSettings,
          ...JSON.parse(settingsData)
        });
      }
      if (stateData) {
        setUserState({
          ...defaultState,
          ...JSON.parse(stateData)
        });
      }
    }
  }, []);
  // Update user state based on settings
  useEffect(() => {
    if (userSettings) {
      const newState: Partial<UserState> = {};
      // Set status based on DND
      if (userSettings.dnd_active) {
        newState.status = 'dnd';
        newState.statusMessage = 'Do Not Disturb mode is active';
      } else if (userSettings.announcement) {
        newState.status = 'available';
        newState.statusMessage = 'Announcement is active';
      } else if (userSettings.callForwarding) {
        newState.status = 'away';
        newState.statusMessage = `Calls are being forwarded to ${userSettings.forwardingNumber}`;
      } else {
        newState.status = 'available';
        newState.statusMessage = 'Your AI Secretary is active and handling calls';
      }
      // Update state if there are changes
      if (Object.keys(newState).length > 0) {
        updateUserState(newState);
      }
    }
  }, [userSettings]);
  const login = async (otp: string, phoneNumber: string) => {
    try {
      // Mock login for development
      if (otp === '123456' || phoneNumber === '+66812345678') {
        const mockUser = {
          user_id: 'mock-user-id',
          owner_number: phoneNumber,
          owner_name: 'Demo User',
          sms_lang: 'TH',
          default_language: 'TH',
          avatar: 'https://i.pravatar.cc/150?u=demo@example.com'
        };
        const mockSettings = {
          ...defaultSettings,
          announcement: null,
          announcement_from: null,
          announcement_to: null,
          dnd_active: false
        };
        const token = 'mock-jwt-token';
        localStorage.setItem('ais_token', token);
        localStorage.setItem('ais_user', JSON.stringify(mockUser));
        localStorage.setItem('ais_settings', JSON.stringify(mockSettings));
        localStorage.setItem('ais_state', JSON.stringify(defaultState));
        setUser(mockUser);
        setUserSettings(mockSettings);
        setUserState(defaultState);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid OTP or phone number');
      }
    } catch (error) {
      throw error;
    }
  };
  const updateUserSettings = (settings: Partial<UserSettings>) => {
    const updatedSettings = {
      ...userSettings,
      ...settings
    };
    setUserSettings(updatedSettings);
    localStorage.setItem('ais_settings', JSON.stringify(updatedSettings));
  };
  const updateUserState = (state: Partial<UserState>) => {
    const updatedState = {
      ...userState,
      ...state
    };
    setUserState(updatedState);
    localStorage.setItem('ais_state', JSON.stringify(updatedState));
  };
  const logout = () => {
    localStorage.removeItem('ais_token');
    localStorage.removeItem('ais_user');
    localStorage.removeItem('ais_settings');
    localStorage.removeItem('ais_state');
    setIsAuthenticated(false);
    setUser(null);
    setUserSettings(defaultSettings);
    setUserState(defaultState);
  };
  const value = {
    isAuthenticated,
    user,
    userSettings,
    userState,
    login,
    logout,
    updateUserSettings,
    updateUserState
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};