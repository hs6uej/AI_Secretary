import React, { createContext, useContext } from 'react';
interface ThemeContextType {
  colors: {
    primary: string;
    secondary: string;
    backgroundLight: string;
    text: string;
    error: string;
    warning: string;
    success: string;
  };
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const ThemeProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const theme = {
    colors: {
      primary: '#00A94F',
      secondary: '#007AFF',
      backgroundLight: '#F5F5F7',
      text: '#333333',
      error: '#FF3B30',
      warning: '#FF9500',
      success: '#00C853'
    }
  };
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};