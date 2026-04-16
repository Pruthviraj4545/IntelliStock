import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Login from './pages/Login'
import Register from './pages/Register'
import ModernDashboard from './pages/ModernDashboard'
import StaffDashboard from './pages/StaffDashboard'
import ClientDashboard from './pages/ClientDashboard'
import ModernBilling from './pages/ModernBilling'
import Sales from './pages/Sales'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import CompanyProfile from './pages/CompanyProfile'
import { ModernDashboardLayout } from './components/ModernDashboardLayout'
import { ToastContainer } from './components/Toast'
import './App.css'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === 'admin' ? '/admin' : user.role === 'staff' ? '/staff' : '/client'
    return <Navigate to={redirectPath} replace />
  }

  return children
}

function App() {
  return (
    <>
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ModernDashboardLayout>
                    <ModernDashboard />
                  </ModernDashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Staff Routes */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <ModernDashboardLayout>
                    <StaffDashboard />
                  </ModernDashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Products Route */}
            <Route
              path="/products"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <ModernDashboardLayout>
                    <Products />
                  </ModernDashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <ModernDashboardLayout>
                    <Inventory />
                  </ModernDashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Client Routes */}
            <Route
              path="/client"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'customer']}>
                  <ModernDashboardLayout>
                    <ClientDashboard />
                  </ModernDashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Billing/POS */}
            <Route
              path="/billing"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <ModernDashboardLayout>
                    <ModernBilling />
                  </ModernDashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Sales History */}
            <Route
              path="/sales"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <Sales />
                </ProtectedRoute>
              }
            />

            {/* Analytics */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ModernDashboardLayout>
                    <Analytics />
                  </ModernDashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Reports */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ModernDashboardLayout>
                    <Reports />
                  </ModernDashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'customer']}>
                  <ModernDashboardLayout>
                    <Profile />
                  </ModernDashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Company Profile */}
            <Route
              path="/company-profile"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <ModernDashboardLayout>
                    <CompanyProfile />
                  </ModernDashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AnimatePresence>
      </Router>
      <ToastContainer />
    </>
  )
}

export default App
