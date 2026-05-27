import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { getAppBase } from '@uipath/uipath-typescript'
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/hooks/useAuth';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { AccountsPage } from '@/pages/AccountsPage'
import { AccountDetailPage } from '@/pages/AccountDetailPage'
import { ImportsPage } from '@/pages/ImportsPage'
import { MetricMappingAdminPage } from '@/pages/MetricMappingAdminPage'
// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter basename={getAppBase()}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/accounts/:subsidiaryId" element={<AccountDetailPage />} />
            <Route path="/imports" element={<ImportsPage />} />
            <Route path="/admin/metric-mappings" element={<MetricMappingAdminPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)