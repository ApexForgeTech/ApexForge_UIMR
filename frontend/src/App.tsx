import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/layout/Layout';
import IncidentListPage from './pages/IncidentListPage';
import CreateIncidentPage from './pages/CreateIncidentPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import PlaybooksPage from './pages/PlaybooksPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';
import SettingsPage from './pages/SettingsPage';
import IngestionPage from './pages/IngestionPage';
import NotificationsPage from './pages/NotificationsPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          
          <Route path="incidents" element={<IncidentListPage />} />
          <Route path="incidents/new" element={<CreateIncidentPage />} />
          <Route path="incidents/:id" element={<IncidentDetailPage />} />
          
          <Route path="playbooks" element={<PlaybooksPage />} />
          <Route path="kb" element={<KnowledgeBasePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
          <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
          <Route path="ingestion" element={<IngestionPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
