import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  SlidersHorizontal,
  ShoppingCart,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
  Zap,
  Search,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  ChevronRight,
  Home,
  Building2,
  TrendingUp,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'

export function ModernDashboardLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const profileMenuRef = useRef(null)
  const notificationsRef = useRef(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const html = document.documentElement
    darkMode ? html.classList.add('dark') : html.classList.remove('dark')
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setProfileMenuOpen(false)
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(p => !p) }
      if (e.key === 'Escape') { setSearchOpen(false); setProfileMenuOpen(false); setNotificationsOpen(false) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const getMenuItems = () => {
    const items = {
      admin: [
        { icon: LayoutDashboard, label: 'Dashboard',      path: '/admin',           group: 'Overview' },
        { icon: BarChart3,       label: 'Analytics',      path: '/analytics',       group: 'Insights' },
        { icon: FileText,        label: 'Reports',        path: '/reports',         group: 'Insights' },
        { icon: Building2,       label: 'Company',        path: '/company-profile', group: 'Insights' },
        { icon: Package,         label: 'Products',       path: '/products',        group: 'Operations' },
        { icon: TrendingUp,      label: 'Sales History',  path: '/sales',           group: 'Operations' },
        { icon: ShoppingCart,    label: 'Billing / POS',  path: '/billing',         group: 'Operations' },
        { icon: SlidersHorizontal,label:'Inventory',      path: '/inventory',       group: 'Operations' },
      ],
      staff: [
        { icon: LayoutDashboard,  label: 'Dashboard',    path: '/staff',           group: 'Overview' },
        { icon: Building2,        label: 'Company',      path: '/company-profile', group: 'Operations' },
        { icon: Package,          label: 'Products',     path: '/products',        group: 'Operations' },
        { icon: TrendingUp,       label: 'Sales History',path: '/sales',           group: 'Operations' },
        { icon: ShoppingCart,     label: 'Billing / POS',path: '/billing',         group: 'Operations' },
        { icon: SlidersHorizontal,label: 'Inventory',   path: '/inventory',       group: 'Operations' },
      ],
      customer: [
        { icon: Home,         label: 'Home',       path: '/client',  group: 'Main' },
        { icon: Package,      label: 'Products',   path: '/products',group: 'Shop' },
        { icon: ShoppingCart, label: 'My Orders',  path: '/billing', group: 'Shop' },
      ]
    }
    return items[user.role] || items.customer
  }

  const menuItems = getMenuItems()
  const groupedItems = menuItems.reduce((acc, item) => {
    const g = item.group || 'Navigation'
    if (!acc[g]) acc[g] = []
    acc[g].push(item)
    return acc
  }, {})

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const notifications = [
    { id: 1, title: 'Low Stock Alert',  message: '5 products are below reorder level', time: '5 min ago',  unread: true,  type: 'warning' },
    { id: 2, title: 'New Order',        message: 'Order #1234 has been placed',        time: '15 min ago', unread: true,  type: 'success' },
    { id: 3, title: 'System Update',    message: 'IntelliStock v2.0 is deployed',      time: '1 hour ago', unread: false, type: 'info' },
  ]
  const unreadCount = notifications.filter(n => n.unread).length

  const notifIconBg = { warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600',
                        success: 'bg-success-100 dark:bg-success-900/30 text-success-600',
                        info:    'bg-accent-100 dark:bg-accent-900/30 text-accent-600'    }

  const SidebarContent = ({ collapsed }) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-slate-800">
        <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-primary">
          <Zap className="w-4.5 h-4.5 text-white" size={18} />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key="brand"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col min-w-0"
            >
              <span className="font-bold text-base text-gray-900 dark:text-slate-100 tracking-tight leading-none">
                IntelliStock
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium mt-0.5 leading-none">
                Inventory Pro
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <div key={groupName}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  key={`label-${groupName}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-600 px-3 mb-2"
                >
                  {groupName}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={`nav-item w-full ${active ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
                  >
                    {active && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-600 dark:bg-primary-400 rounded-r-full" />
                    )}
                    <Icon
                      size={18}
                      className={`flex-shrink-0 ${active
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 dark:text-slate-500'
                      }`}
                    />
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex-1 text-left truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {active && !collapsed && (
                      <ChevronRight size={14} className="text-primary-400 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User info at bottom */}
      <div className="border-t border-gray-100 dark:border-slate-800 p-3">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`nav-item w-full text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 hover:text-danger-700 ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-slate-100 overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 264 : 72 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden md:flex flex-col bg-white dark:bg-dark-card border-r border-gray-100 dark:border-slate-800 shadow-sm z-40 overflow-hidden flex-shrink-0"
      >
        {/* Top gradient accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-primary-600 via-primary-400 to-accent-500 flex-shrink-0" />
        <SidebarContent collapsed={!sidebarOpen} />
      </motion.aside>

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -264 }}
              animate={{ x: 0 }}
              exit={{ x: -264 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed left-0 top-0 h-full w-[264px] flex flex-col bg-white dark:bg-dark-card border-r border-gray-100 dark:border-slate-800 shadow-xl z-50 md:hidden"
            >
              <div className="h-0.5 bg-gradient-to-r from-primary-600 via-primary-400 to-accent-500 flex-shrink-0" />
              <SidebarContent collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Topbar / Navbar ── */}
        <header className="flex-shrink-0 h-16 bg-white dark:bg-dark-card border-b border-gray-100 dark:border-slate-800 shadow-sm sticky top-0 z-30">
          <div className="h-full px-4 flex items-center justify-between gap-4">

            {/* Left: Toggle + Search */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Desktop: collapse toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="btn-icon hidden md:flex"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen
                  ? <PanelLeftClose size={18} />
                  : <PanelLeftOpen size={18} />}
              </button>

              {/* Mobile: hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="btn-icon md:hidden"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>

              {/* Search bar */}
              <AnimatePresence mode="wait">
                {searchOpen ? (
                  <motion.div
                    key="search-open"
                    initial={{ width: 40, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 40, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative hidden sm:block"
                  >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search anything..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-9 pr-9 py-2 text-sm"
                    />
                    <button
                      onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-closed"
                    onClick={() => setSearchOpen(true)}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition-all duration-200"
                  >
                    <Search size={14} />
                    <span className="hidden lg:block">Search...</span>
                    <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-gray-500 dark:text-slate-400">
                      ⌘K
                    </kbd>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">

              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="btn-icon"
                aria-label="Toggle theme"
              >
                {darkMode
                  ? <Sun size={18} className="text-warning-500" />
                  : <Moon size={18} className="text-gray-500" />
                }
              </button>

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="btn-icon relative"
                  aria-label="Notifications"
                >
                  <Bell size={18} className="text-gray-500 dark:text-slate-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 card shadow-xl z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="badge badge-primary">{unreadCount} new</span>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700/60">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3.5 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${n.unread ? 'bg-primary-50/40 dark:bg-primary-950/20' : ''}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${notifIconBg[n.type] || notifIconBg.info}`}>
                              {n.type === 'warning' ? <AlertTriangle size={14} />
                               : n.type === 'success' ? <ShoppingCart size={14} />
                               : <Bell size={14} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{n.title}</p>
                                {n.unread && <div className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">{n.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700">
                        <button className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                          View all notifications →
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1" />

              {/* Profile */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success-500 border-2 border-white dark:border-dark-card rounded-full" />
                  </div>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-800 dark:text-slate-200 leading-none">
                      {user.name?.split(' ')[0] || 'User'}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 capitalize mt-0.5 leading-none">{user.role || 'staff'}</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-60 card shadow-xl z-50 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-4 py-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-950/40 dark:to-accent-950/20 border-b border-gray-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-full flex items-center justify-center text-white font-bold shadow-primary">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">{user.name || 'User'}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
                              <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user.role || 'staff'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-1.5">
                        {[
                          { icon: User, label: 'My Profile', path: '/profile' },
                          ...(user.role === 'admin' || user.role === 'staff')
                            ? [{ icon: Building2, label: 'Company Profile', path: '/company-profile' }]
                            : [],
                          { icon: Settings, label: 'Settings', path: '/settings' },
                          { icon: HelpCircle, label: 'Help Center', path: '/help' },
                        ].map(item => (
                          <button
                            key={item.label}
                            onClick={() => { navigate(item.path); setProfileMenuOpen(false) }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors"
                          >
                            <item.icon size={15} />
                            {item.label}
                          </button>
                        ))}
                      </div>

                      <div className="h-px bg-gray-100 dark:bg-slate-700 mx-3" />

                      <div className="p-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                        >
                          <LogOut size={15} />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-dark-bg">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="p-5 md:p-6 lg:p-8 max-w-screen-xl mx-auto w-full min-h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

/* ── Reusable Card ── */
export function ModernCard({ children, className = '', hover = true, padding = 'lg' }) {
  const paddings = { sm: 'p-4', md: 'p-5', lg: 'p-6', xl: 'p-8', none: '' }
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
      className={`card ${paddings[padding]} ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default ModernDashboardLayout
