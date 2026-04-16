/**
 * Billing & Management Dashboard
 * Integrates invoicing, shop configuration, and customer management
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Settings, Users } from 'lucide-react'
import ProfessionalBilling from '../components/ProfessionalBilling'
import ShopConfiguration from '../components/ShopConfiguration'
import CustomerManagement from '../components/CustomerManagement'

function BillingDashboard() {
  const [activeTab, setActiveTab] = useState('billing') // 'billing', 'shop', 'customers'
  const [cartItems, setCartItems] = useState([
    // Demo cart items - can be replaced with real data
    {
      id: 1,
      name: 'Product 1',
      selling_price: 999.99,
      quantity: 2
    }
  ])

  const tabs = [
    {
      id: 'billing',
      label: 'Professional Billing',
      icon: ShoppingCart,
      description: 'Generate and manage professional invoices'
    },
    {
      id: 'shop',
      label: 'Shop Configuration',
      icon: Settings,
      description: 'Configure your shop details and settings'
    },
    {
      id: 'customers',
      label: 'Customer Management',
      icon: Users,
      description: 'Manage customers and track loyalty'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Billing & Management</h1>
          <p className="text-slate-600">Manage invoices, shop settings, and customer relationships</p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/50'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'billing' && (
            <ProfessionalBilling cartItems={cartItems} />
          )}
          {activeTab === 'shop' && (
            <ShopConfiguration />
          )}
          {activeTab === 'customers' && (
            <CustomerManagement />
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default BillingDashboard
