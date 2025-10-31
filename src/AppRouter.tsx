// src/AppRouter.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CallsPage } from './pages/CallsPage';
import { CallDetailPage } from './pages/CallDetailPage';
import { ContactsPage } from './pages/ContactsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute: React.FC<{ isAuthenticated: boolean, children: React.ReactElement }> = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};


export const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/calls" element={<CallsPage />} />
        
        {/* MODIFIED (Case 10): Changed route to accept URL parameter */}
        <Route path="/calls/:callId" element={<CallDetailPage />} />
        {/* REMOVED: Old route */}
        {/* <Route path="/call-detail" element={<CallDetailPage />} /> */}

        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* Add a default redirect for authenticated users */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};