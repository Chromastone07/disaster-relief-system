import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LayoutWrapper from './components/layout/LayoutWrapper';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import Dashboard from './Dashboard';
import AuthPage from './pages/Auth';
import IncidentsPage from './pages/Incidents';
import VolunteersPage from './pages/Volunteers';
import ResourcesPage from './pages/Resources';
import SettingsPage from './pages/Settings';

import './App.css';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />

              {/* Public layout wrapper routes */}
              <Route element={<LayoutWrapper />}>
                 <Route path="/" element={<Dashboard />} />
                 <Route path="/incidents" element={<IncidentsPage />} />
                 <Route path="/settings" element={<SettingsPage />} />
                 
                 {/* Protected routes */}
                 <Route element={<ProtectedRoute />}>
                    <Route path="/volunteers" element={<VolunteersPage />} />
                    <Route path="/inventory" element={<ResourcesPage />} />
                 </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;