import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, Mail, Lock, Zap,
  AlertCircle, ArrowRight, CheckCircle, Shield, TrendingUp, Package
} from 'lucide-react'
import { login } from '../api/authService'

const features = [
  { icon: TrendingUp, label: 'Real-time Analytics',   sub: 'Track sales & revenue live' },
  { icon: Package,    label: 'Smart Inventory',       sub: 'AI-powered stock management' },
  { icon: Shield,     label: 'Secure & Compliant',    sub: 'Bank-grade data encryption' },
]

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true); setError('')

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address'); return
      }
      if (!formData.password) {
        setError('Please enter your password'); return
      }

      const response = await login(formData.email, formData.password)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))

      const role = response.user.role
      navigate(role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/client')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const fillDemo = () => setFormData({ email: 'admin@example.com', password: 'password123', rememberMe: true })

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-bg">

      {/* ── Left Panel (branding) ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full -mt-40 -ml-40 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/10 rounded-full -mb-48 -mr-48 pointer-events-none" />
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 right-8 w-48 h-48 bg-white/5 rounded-3xl pointer-events-none"
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Zap size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">IntelliStock</span>
          </div>
          <p className="text-primary-200 text-sm font-medium">Intelligent Inventory Management</p>
        </div>

        {/* Main Hero Text */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Take control of your
              <span className="block text-primary-200">inventory today.</span>
            </h2>
            <p className="mt-4 text-primary-200 text-base leading-relaxed max-w-sm">
              Streamline operations, reduce waste, and grow revenue with AI-powered insights.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <f.icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.label}</p>
                  <p className="text-primary-300 text-xs">{f.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-primary-300 text-xs">
          © 2026 IntelliStock · SOC 2 Type II Certified
        </p>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center shadow-primary">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-xl text-gray-900 dark:text-slate-100">IntelliStock</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Inventory Management</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
              Welcome back
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2">
              Sign in to your workspace to continue.
            </p>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="alert alert-error flex items-start gap-3">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@company.com"
                  className="input pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="input pl-10 pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 accent-primary-600 cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-slate-200 transition-colors">
                  Remember me
                </span>
              </label>
              <Link to="#" className="text-sm text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Demo Credentials */}
          <button
            type="button"
            onClick={fillDemo}
            className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl py-2.5 transition-all"
          >
            <CheckCircle size={13} className="text-success-500" />
            Use demo credentials (admin@example.com)
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
            <span className="text-xs text-gray-400 dark:text-slate-500">New to IntelliStock?</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all"
          >
            Create your account
            <ArrowRight size={14} />
          </Link>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-8">
            Secured with 256-bit encryption · Your data is safe with us
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
