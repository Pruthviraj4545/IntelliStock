import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart3,
  FileText,
  Users,
  User
} from 'lucide-react'

function Sidebar() {
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const getMenuItems = () => {
    const baseItems = [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['admin'] },
      { name: 'Staff Panel', path: '/staff', icon: Users, roles: ['admin', 'staff'] },
      { name: 'Client Portal', path: '/client', icon: Package, roles: ['admin', 'staff', 'client'] },
      { name: 'Products', path: '/products', icon: Package, roles: ['admin', 'staff'] },
      { name: 'Sales', path: '/billing', icon: ShoppingCart, roles: ['admin', 'staff'] },
      { name: 'Billing', path: '/billing', icon: CreditCard, roles: ['admin', 'staff'] },
      { name: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['admin'] },
      { name: 'Reports', path: '/reports', icon: FileText, roles: ['admin'] },
      { name: 'Profile', path: '/profile', icon: User, roles: ['admin', 'staff', 'customer'] },
    ]

    return baseItems.filter(item => item.roles.includes(user.role))
  }

  const menuItems = getMenuItems()

  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/') return true
    return location.pathname.startsWith(path)
  }

  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 bg-white shadow-soft border-r border-gray-100"
    >
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">IS</span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">IntelliStock</h2>
            <p className="text-xs text-gray-500 capitalize">{user.role} Panel</p>
          </div>
        </div>
      </div>

      <nav className="px-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={item.path}
                className={`sidebar-item ${active ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-8 bg-primary-600 rounded-r-full"
                  />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Quick Stats */}
      <div className="mt-8 px-4">
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Quick Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Products</span>
              <span className="font-medium text-primary-600">1,250</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Low Stock</span>
              <span className="font-medium text-warning">42</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue</span>
              <span className="font-medium text-success">$45.3K</span>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

export default Sidebar
