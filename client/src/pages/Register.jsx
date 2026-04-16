import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Zap, AlertCircle, Users, Briefcase } from 'lucide-react'
import { register } from '../api/authService'

function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState('role') // role, form, success
  const [selectedRole, setSelectedRole] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const roles = [
    {
      id: 'customer',
      label: 'Customer',
      description: 'Browse and purchase products',
      icon: Users,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'staff',
      label: 'Staff',
      description: 'Manage inventory and sales',
      icon: Briefcase,
      color: 'from-purple-500 to-pink-500'
    }
  ]

  // Password validation function matching backend requirements
  const validatePassword = (password) => {
    const minLength = password.length >= 8
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)

    return {
      valid: minLength && hasLower && hasUpper && hasNumber,
      errors: {
        minLength: minLength ? true : 'Password must be at least 8 characters',
        hasLower: hasLower ? true : 'Password must contain at least one lowercase letter',
        hasUpper: hasUpper ? true : 'Password must contain at least one uppercase letter',
        hasNumber: hasNumber ? true : 'Password must contain at least one number'
      }
    }
  }

  const getPasswordErrors = (password) => {
    const { errors } = validatePassword(password)
    return Object.values(errors).filter(msg => msg !== true)
  }

  const getPasswordRequirementStatus = (password) => {
    const { errors } = validatePassword(password)
    return {
      minLength: errors.minLength === true,
      hasLower: errors.hasLower === true,
      hasUpper: errors.hasUpper === true,
      hasNumber: errors.hasNumber === true
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId)
    setStep('form')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Password match check
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Full password validation matching backend requirements
    const passwordErrors = getPasswordErrors(formData.password)
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. '))
      return
    }

    try {
      setLoading(true)
      setError('')

      // Send only required fields (no confirmPassword)
      const { confirmPassword, ...userData } = formData
      await register({
        name: userData.name.trim(),
        email: userData.email.trim(),
        password: userData.password,
        role: selectedRole
      })
      setStep('success')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      // Display specific validation errors from backend if available
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessages = err.response.data.errors
          .map(e => e.message)
          .join('. ')
        setError(errorMessages)
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const goBackToRoles = () => {
    setStep('role')
    setError('')
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Zap className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">IntelliStock</h1>
          <p className="text-white/80 text-sm">Create your account</p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-card p-8 space-y-6"
        >
          {/* Role Selection Step */}
          {step === 'role' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold text-gray-900">Choose Your Role</h2>
              <p className="text-sm text-gray-600">Select the account type that fits you best</p>

              <div className="grid gap-3">
                {roles.map((role, idx) => {
                  const Icon = role.icon
                  return (
                    <motion.button
                      key={role.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      onClick={() => handleRoleSelect(role.id)}
                      className="group relative overflow-hidden p-4 rounded-xl border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${role.color}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{role.label}</h3>
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-white/30 group-hover:border-white/60 transition-colors"></div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              <div className="divider my-6"></div>

              <div className="text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Sign In
                </Link>
              </div>
            </motion.div>
          )}

          {/* Registration Form Step */}
          {step === 'form' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Your Account</h2>
                <motion.button
                  onClick={goBackToRoles}
                  className="text-2xl text-gray-600 hover:text-gray-900"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ←
                </motion.button>
              </div>

              <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {selectedRole === 'customer' ? 'Customer Account' : 'Staff Account'}
              </div>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="alert alert-error flex gap-3"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="input pl-10"
                      placeholder="John Doe"
                    />
                  </div>
                </motion.div>

                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="input pl-10"
                      placeholder="you@example.com"
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="input pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Password requirements */}
                  {formData.password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 space-y-1"
                    >
                      <div className={`text-xs ${getPasswordRequirementStatus(formData.password).minLength ? 'text-green-600' : 'text-gray-500'}`}>
                        {getPasswordRequirementStatus(formData.password).minLength ? '✓' : '✗'} At least 8 characters
                      </div>
                      <div className={`text-xs ${getPasswordRequirementStatus(formData.password).hasLower ? 'text-green-600' : 'text-gray-500'}`}>
                        {getPasswordRequirementStatus(formData.password).hasLower ? '✓' : '✗'} At least one lowercase letter
                      </div>
                      <div className={`text-xs ${getPasswordRequirementStatus(formData.password).hasUpper ? 'text-green-600' : 'text-gray-500'}`}>
                        {getPasswordRequirementStatus(formData.password).hasUpper ? '✓' : '✗'} At least one uppercase letter
                      </div>
                      <div className={`text-xs ${getPasswordRequirementStatus(formData.password).hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                        {getPasswordRequirementStatus(formData.password).hasNumber ? '✓' : '✗'} At least one number
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Confirm Password */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <label className="label">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="input pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 mt-6"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </motion.button>
              </form>

              <div className="text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Sign In
                </Link>
              </div>
            </motion.div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: 3, duration: 0.6 }}
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-3xl">✓</div>
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account created!</h2>
              <p className="text-gray-600 mb-6">Redirecting to login...</p>
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2 }}
                  className="h-full bg-indigo-600"
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Register
