import React, { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { authService, LoginResponse } from '../services/authService';
// ตรวจสอบว่า import Type ถูกต้อง และไม่มี default_language ใน User interface
import { User, UserSettings, UserState } from '../types/user';

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
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateUserState: (state: Partial<UserState>) => void;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultSettings);
  const [userState, setUserState] = useState<UserState>(defaultState);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing auth on mount
  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem('ais_token');
    const userData = localStorage.getItem('ais_user');
    const settingsData = localStorage.getItem('ais_settings');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        const currentSettings = settingsData ? { ...defaultSettings, ...JSON.parse(settingsData) } : defaultSettings;
        setUserSettings(currentSettings);
        updateUserStateBasedOnSettings(currentSettings);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse auth data from localStorage", e);
        logout(); // Clear invalid data
      }
    } else {
      // If no token, ensure state is clean
      setIsAuthenticated(false);
      setUser(null);
      setUserSettings(defaultSettings);
      setUserState(defaultState);
    }
    setIsLoading(false);
  }, []);

  // Function to calculate User State based on Settings
  const updateUserStateBasedOnSettings = (currentSettings: UserSettings) => {
    let newStatus: UserState['status'] = 'available';
    let newMessage = 'Your AI Secretary is active and handling calls';
    let newForwarding = false; // Assume no call forwarding settings in DB yet
    let newForwardingNumber = '';

    if (currentSettings.dnd_active) {
      newStatus = 'dnd';
      newMessage = 'Do Not Disturb mode is active';
    } else if (currentSettings.announcement && currentSettings.announcement_from && currentSettings.announcement_to) {
        // Simple check if announcement text exists
        newStatus = 'available';
        newMessage = `Announcement active: "${currentSettings.announcement.substring(0, 30)}..."`; // Show snippet
    }
    // Add logic for call forwarding if settings are added later

    setUserState({
      status: newStatus,
      statusMessage: newMessage,
      callForwarding: newForwarding,
      forwardingNumber: newForwardingNumber
    });
  };

  // Login Function
  const login = async (ownerNumber: string, password: string) => {
    setIsLoading(true);
    try {
      const { token, user: loggedInUser, settings: fetchedSettings } = await authService.login(ownerNumber, password);

      localStorage.setItem('ais_token', token);
      localStorage.setItem('ais_user', JSON.stringify(loggedInUser));
      const currentSettings = { ...defaultSettings, ...fetchedSettings };
      localStorage.setItem('ais_settings', JSON.stringify(currentSettings));

      setUser(loggedInUser);
      setUserSettings(currentSettings);
      updateUserStateBasedOnSettings(currentSettings);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("AuthContext Login Failed:", error);
      // Ensure clean state on failure
      localStorage.removeItem('ais_token');
      localStorage.removeItem('ais_user');
      localStorage.removeItem('ais_settings');
      setIsAuthenticated(false);
      setUser(null);
      setUserSettings(defaultSettings);
      setUserState(defaultState);
      throw error;
    } finally {
        setIsLoading(false);
    }
  };

  // Register Function
  const register = async (ownerNumber: string, password: string, ownerName?: string) => {
    setIsLoading(true);
    try {
      const { token, user: registeredUser, settings: initialSettings } = await authService.register(ownerNumber, password, ownerName);

      localStorage.setItem('ais_token', token);
      localStorage.setItem('ais_user', JSON.stringify(registeredUser));
      const currentSettings = { ...defaultSettings, ...initialSettings };
      localStorage.setItem('ais_settings', JSON.stringify(currentSettings));

      setUser(registeredUser);
      setUserSettings(currentSettings);
      updateUserStateBasedOnSettings(currentSettings);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("AuthContext Register Failed:", error);
       // Ensure clean state on failure
      localStorage.removeItem('ais_token');
      localStorage.removeItem('ais_user');
      localStorage.removeItem('ais_settings');
      setIsAuthenticated(false);
      setUser(null);
      setUserSettings(defaultSettings);
      setUserState(defaultState);
      throw error;
    } finally {
        setIsLoading(false);
    }
  };

  // Logout Function
  const logout = () => {
    localStorage.removeItem('ais_token');
    localStorage.removeItem('ais_user');
    localStorage.removeItem('ais_settings');
    setIsAuthenticated(false);
    setUser(null);
    setUserSettings(defaultSettings);
    setUserState(defaultState);
    // Consider adding navigation back to login page here if not handled by router
    // navigate('/login', { replace: true }); // Need access to navigate function or use window.location
  };

  // Update User Settings Function
  const updateUserSettings = async (settingsUpdate: Partial<UserSettings>) => {
     if (!user) return;
     const oldSettings = userSettings; // Keep old settings for potential rollback
     const newSettings = { ...userSettings, ...settingsUpdate };

     // Optimistic Update UI
     setUserSettings(newSettings);
     updateUserStateBasedOnSettings(newSettings);
     localStorage.setItem('ais_settings', JSON.stringify(newSettings));

    try {
        // Call Backend API
        const savedSettings = await authService.updateSettings(user.user_id, settingsUpdate);
        // Re-sync with backend response (might include generated fields or corrections)
        const finalSettings = { ...defaultSettings, ...savedSettings }; // Use default as base
        setUserSettings(finalSettings);
        updateUserStateBasedOnSettings(finalSettings);
        localStorage.setItem('ais_settings', JSON.stringify(finalSettings));
    } catch (error) {
        console.error("Failed to save settings to backend:", error);
        // Rollback UI on failure
        setUserSettings(oldSettings);
        updateUserStateBasedOnSettings(oldSettings);
        localStorage.setItem('ais_settings', JSON.stringify(oldSettings));
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