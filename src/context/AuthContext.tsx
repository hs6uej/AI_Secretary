// src/context/AuthContext.tsx
import React, { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { authService, LoginResponse } from '../services/authService';
// ADDED (Case 12, 15): Import the new settings service
import { settingsService, UpdateSettingsData } from '../services/settingsService';
import { User, UserSettings, UserState } from '../types/user';
import api from '../services/api'; // Import api to set token header

// Default values
const defaultSettings: UserSettings = {
  announcement: null,
  announcement_from: null,
  announcement_to: null,
  dnd_active: false,
  dnd_start: null,
  dnd_end: null,
};

const defaultState: UserState = {
  status: 'available',
  statusMessage: 'Your AI Secretary is active and handling calls',
  callForwarding: false,
  forwardingNumber: ''
};

// Context Type Definition
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  userSettings: UserSettings;
  userState: UserState;
  isLoading: boolean;
  login: (ownerNumber: string, password: string) => Promise<void>;
  register: (ownerNumber: string, password: string, ownerName?: string) => Promise<void>;
  logout: () => void;
  // MODIFIED (Case 12, 15): Update function signature
  updateUserSettings: (data: UpdateSettingsData) => Promise<void>;
  updateUserState: (state: Partial<UserState>) => void;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultSettings);
  const [userState, setUserState] = useState<UserState>(defaultState);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start true

  // Helper: Update local state based on settings (e.g., DND)
  const updateUserStateBasedOnSettings = (settings: UserSettings) => {
    if (settings.dnd_active) {
      setUserState(prev => ({
        ...prev,
        status: 'dnd',
        statusMessage: 'Do Not Disturb is active'
      }));
    } else if (settings.announcement) { // (Case 12)
       setUserState(prev => ({
        ...prev,
        status: 'away', // Or 'busy'
        statusMessage: `Announcement active: "${settings.announcement.substring(0, 30)}..."`
      }));
    } else {
      setUserState(prev => ({
        ...prev,
        status: 'available',
        statusMessage: 'Your AI Secretary is active and handling calls'
      }));
    }
  };

  // Helper: Process login/register response
  // MODIFIED: This function now matches the server.js response
  const handleAuthResponse = (response: LoginResponse) => {
    const { user, settings, token } = response;
    
    // Set token for API calls
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Save to local storage
    localStorage.setItem('ais_token', token);
    localStorage.setItem('ais_user', JSON.stringify(user));
    
    const finalSettings = { ...defaultSettings, ...settings };
    localStorage.setItem('ais_settings', JSON.stringify(finalSettings));
    
    // Update state
    setUser(user);
    setUserSettings(finalSettings);
    updateUserStateBasedOnSettings(finalSettings);
    setIsAuthenticated(true);
  };

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('ais_token');
    const storedUser = localStorage.getItem('ais_user');
    const storedSettings = localStorage.getItem('ais_settings');
    
    if (token && storedUser && storedSettings) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        const parsedSettings: UserSettings = JSON.parse(storedSettings);
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(parsedUser);
        setUserSettings(parsedSettings);
        updateUserStateBasedOnSettings(parsedSettings);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse stored auth data", e);
        logout(); // Clear bad data
      }
    }
    setIsLoading(false);
  }, []);


  // Login function
  const login = async (ownerNumber: string, password: string) => {
    const response = await authService.login(ownerNumber, password);
    handleAuthResponse(response);
  };

  // Register function
  const register = async (ownerNumber: string, password: string, ownerName?: string) => {
    const response = await authService.register(ownerNumber, password, ownerName);
    handleAuthResponse(response);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('ais_token');
    localStorage.removeItem('ais_user');
    localStorage.removeItem('ais_settings');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setUserSettings(defaultSettings);
    setUserState(defaultState);
    setIsAuthenticated(false);
  };

  // MODIFIED (Case 12, 15): This function now saves ALL settings
  const updateUserSettings = async (data: UpdateSettingsData) => {
    const oldUser = user;
    const oldSettings = userSettings;
    
    // Optimistic UI update (optional, but good for UX)
    const optimisticUser = { ...oldUser, ...data } as User;
    const optimisticSettings = { ...oldSettings, ...data } as UserSettings;
    setUser(optimisticUser);
    setUserSettings(optimisticSettings);
    updateUserStateBasedOnSettings(optimisticSettings);

    try {
      // Call the new service
      const response = await settingsService.updateSettings(data);
      
      // Save confirmed data from backend
      const finalSettings = { ...defaultSettings, ...response.settings };
      setUser(response.user);
      setUserSettings(finalSettings);
      updateUserStateBasedOnSettings(finalSettings);
      
      localStorage.setItem('ais_user', JSON.stringify(response.user));
      localStorage.setItem('ais_settings', JSON.stringify(finalSettings));
      
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Rollback UI on failure
      if (oldUser) setUser(oldUser);
      setUserSettings(oldSettings);
      updateUserStateBasedOnSettings(oldSettings);
      alert("Failed to save settings. Please try again.");
      throw error;
    }
  };

  // Update User State (Local UI state, not saved to backend)
  const updateUserState = (stateUpdate: Partial<UserState>) => {
    setUserState(prevState => ({ ...prevState, ...stateUpdate }));
  };

  // Context Value
  const value = {
    isAuthenticated,
    user,
    userSettings,
    userState,
    isLoading,
    login,
    register,
    logout,
    updateUserSettings,
    updateUserState
  };

  // Render Provider
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook to use Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};