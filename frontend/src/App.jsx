import './App.css'
import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import DonationsPage from './pages/DonationsPage'
import PostDonationPage from './pages/PostDonationPage'
import NGOPortalPage from './pages/NGOPortalPage'
import PickupsPage from './pages/PickupsPage'
import ReportsPage from './pages/ReportsPage'
import NotificationsPage from './pages/NotificationsPage'
import DonorProfilePage from './pages/DonorProfilePage'
import LandingPage from './pages/LandingPage'

// Protected Route wrapper
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-dark)' }}>
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full border-4 spinner mx-auto mb-4"
            style={{ borderColor: '#10b981', borderTopColor: 'transparent' }}
          />
          <p style={{ color: '#9ca3af', fontFamily: 'Outfit' }}>Loading FoodBridge AI...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

// App shell with sidebar
function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`main-content flex-1 ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes - all roles */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppShell><DashboardPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/notifications" element={
        <ProtectedRoute>
          <AppShell><NotificationsPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute roles={['admin', 'ngo']}>
          <AppShell><ReportsPage /></AppShell>
        </ProtectedRoute>
      } />

      {/* Donor routes */}
      <Route path="/donations" element={
        <ProtectedRoute roles={['donor', 'admin']}>
          <AppShell><DonationsPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/post-donation" element={
        <ProtectedRoute roles={['donor', 'admin']}>
          <AppShell><PostDonationPage /></AppShell>
        </ProtectedRoute>
      } />

      <Route path="/donor-profile" element={
        <ProtectedRoute roles={['donor', 'admin']}>
          <AppShell><DonorProfilePage /></AppShell>
        </ProtectedRoute>
      } />

      {/* NGO routes */}
      <Route path="/ngo-portal" element={
        <ProtectedRoute roles={['ngo', 'admin']}>
          <AppShell><NGOPortalPage /></AppShell>
        </ProtectedRoute>
      } />

      {/* Volunteer routes */}
      <Route path="/pickups" element={
        <ProtectedRoute roles={['volunteer', 'admin']}>
          <AppShell><PickupsPage /></AppShell>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
