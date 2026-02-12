import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Accounts from '@/pages/Accounts';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Family from '@/pages/Family';
import AppLayout from '@/components/layout/AppLayout';
import { WorkspaceProvider } from '@/context/WorkspaceContext';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route element={
          <WorkspaceProvider>
            <AppLayout />
          </WorkspaceProvider>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/members" element={<Family />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
