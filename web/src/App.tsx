import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Accounts from '@/pages/Accounts';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Family from '@/pages/Family';
import Plans from '@/pages/Plans';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AppLayout from '@/components/layout/AppLayout';
import { WorkspaceProvider } from '@/context/WorkspaceContext';

import LandingPage from '@/pages/LandingPage';

import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors />
      <Routes>
        <Route path="/" element={<LandingPage />} />
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
          <Route path="/plans" element={<Plans />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
