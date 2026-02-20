import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';

// Lazy-loaded pages for code-splitting
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Operations = lazy(() => import('@/pages/Operations').then((m) => ({ default: m.Operations })));
const Processes = lazy(() => import('@/pages/Processes').then((m) => ({ default: m.Processes })));
const Clients = lazy(() => import('@/pages/Clients').then((m) => ({ default: m.Clients })));
const ClientPortal = lazy(() => import('@/pages/ClientPortal').then((m) => ({ default: m.ClientPortal })));
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));
const Approvals = lazy(() => import('@/pages/Approvals').then((m) => ({ default: m.Approvals })));
const Meetings = lazy(() => import('@/pages/Meetings').then((m) => ({ default: m.Meetings })));
const Reports = lazy(() => import('@/pages/Reports').then((m) => ({ default: m.Reports })));
const Pipeline = lazy(() => import('@/pages/Pipeline').then((m) => ({ default: m.Pipeline })));
const AdminUsers = lazy(() => import('@/pages/AdminUsers').then((m) => ({ default: m.AdminUsers })));

function LoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="operations" element={<Operations />} />
                <Route path="processes" element={<Processes />} />
                <Route path="clients" element={<Clients />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="meetings" element={<Meetings />} />
                <Route path="reports" element={<Reports />} />
                <Route path="pipeline" element={<Pipeline />} />
                <Route path="team" element={<AdminUsers />} />
                <Route path="portal" element={<ClientPortal />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
