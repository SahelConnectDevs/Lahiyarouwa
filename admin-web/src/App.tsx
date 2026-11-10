import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { AuthProvider, useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { Loading } from './components/ui';
import { ContentPage } from './content/ContentPage';
import { AccountPage, ForcedPasswordChange } from './pages/AccountPage';
import { AgentsPage } from './pages/AgentsPage';
import { AlertsPage } from './pages/AlertsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { UsersPage } from './pages/UsersPage';

function Root() {
  const { status, user } = useAuth();
  if (status === 'unknown') {
    return (
      <div className="splash">
        <Loading label="Vérification de la session…" />
      </div>
    );
  }
  if (status === 'unauthenticated') return <LoginPage />;
  if (user?.mustChangePassword) return <ForcedPasswordChange />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="alertes" element={<AlertsPage />} />
        <Route path="utilisateurs" element={<UsersPage />} />
        <Route path="utilisateurs/:id" element={<UserDetailPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="contenus/:type" element={<ContentPage />} />
        <Route path="mon-compte" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </AuthProvider>
  );
}
