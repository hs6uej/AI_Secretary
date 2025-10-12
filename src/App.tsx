import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRouter } from './AppRouter';
export function App() {
  return <AuthProvider>
      <ThemeProvider>
        <div className="font-inter text-text min-h-screen bg-background-light">
          <AppRouter />
        </div>
      </ThemeProvider>
    </AuthProvider>;
}