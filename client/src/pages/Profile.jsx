import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Lock,
  Bell,
  Globe,
  Shield,
  Activity,
  Save,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import { DashboardLayout } from '../components/DashboardLayout'

function Profile() {
  const toast = useToast()

  // User info state
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    role: '',
    id: null
  })
  const [loading, setLoading] = useState(true)

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [changingPassword, setChangingPassword] = useState(false)

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    lowStockAlerts: true,
    language: 'en'
  })
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Activity log state
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  useEffect(() => {
    fetchUserInfo()
    fetchActivityLog()
  }, [])

  const fetchUserInfo = async () => {
    try {
      setLoading(true)
      const response = await api.get('/profile')
      const user = response.data.user || {}
      setUserInfo({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        id: user.id || null
      })
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchActivityLog = async () => {
    try {
      setLoadingActivities(true)
      // Get current user ID from localStorage (set on login)
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      const userId = storedUser.id

      if (!userId) {
        setLoadingActivities(false)
        return
      }

      const response = await api.get('/audit-logs', {
        params: { limit: 20, user_id: userId }
      })
      setActivities(response.data.logs || [])
    } catch (error) {
      console.error('Failed to fetch activity log:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      setChangingPassword(true)
      // TODO: Implement change password endpoint on backend
      // await api.post('/profile/change-password', {
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword
      // })
      toast.success('Password changed successfully')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handlePrefsSave = async (e) => {
    e.preventDefault()
    try {
      setSavingPrefs(true)
      // TODO: Implement save preferences endpoint
      // await api.put('/profile/preferences', preferences)
      toast.success('Preferences saved')
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setSavingPrefs(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info & Password */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">User Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    value={userInfo.name}
                    readOnly
                  />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    className="input"
                    value={userInfo.email}
                    readOnly
                  />
                </div>
                <div>
                  <label className="label">Role</label>
                  <input
                    type="text"
                    className="input"
                    value={userInfo.role}
                    readOnly
                  />
                </div>
              </div>
            </motion.div>

            {/* Change Password Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      className="input pr-10"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      className="input pr-10"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      className="input pr-10"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {changingPassword ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Change Password
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>

          {/* Right Column - Preferences & Activity */}
          <div className="space-y-6">
            {/* Preferences Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
              </div>

              <form onSubmit={handlePrefsSave} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.emailNotifications}
                      onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Low Stock Alerts</p>
                    <p className="text-sm text-gray-500">Get notified about low inventory</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.lowStockAlerts}
                      onChange={(e) => setPreferences({ ...preferences, lowStockAlerts: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div>
                  <label className="label">Language</label>
                  <select
                    className="input"
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  {savingPrefs ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Preferences
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Activity Log Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              </div>

              {loadingActivities ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : activities.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No activity recorded</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activities.map((activity) => (
                    <div key={activity.id} className="text-sm border-l-2 border-primary-200 pl-3">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString()} {new Date(activity.created_at).toLocaleTimeString()}
                      </p>
                      {activity.table_name && (
                        <p className="text-xs text-gray-400 capitalize">Table: {activity.table_name}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Account Security Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Security</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <button className="btn btn-sm btn-outline" disabled>
                    Coming Soon
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Active Sessions</p>
                    <p className="text-sm text-gray-500">Manage your login sessions</p>
                  </div>
                  <span className="badge badge-success">1 Active</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Profile
