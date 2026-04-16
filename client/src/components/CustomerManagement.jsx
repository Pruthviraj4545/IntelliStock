import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Search, TrendingUp, Heart, Gift, Phone, Mail, Loader } from 'lucide-react'
import { getCustomers, getFrequentCustomers, getCustomerDetails, updateCustomer } from '../api/shopService'
import { useToast } from './Toast'

export function CustomerManagement() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [frequentCustomers, setFrequentCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('all') // 'all' or 'frequent'
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const [allCustomers, frequentCustomers] = await Promise.all([
        getCustomers(),
        getFrequentCustomers()
      ])
      setCustomers(allCustomers)
      setFrequentCustomers(frequentCustomers)
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile_number?.includes(searchTerm)
  )

  const displayCustomers = selectedTab === 'frequent' ? frequentCustomers : filteredCustomers

  console.log("Render - displayCustomers:", displayCustomers);
  console.log("Render - selectedTab:", selectedTab);

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Customer Management</h2>
            <p className="text-sm text-slate-600">Manage customers and track loyalty</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Customers</p>
                <p className="text-3xl font-bold text-slate-900">{customers.length}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Frequent Customers</p>
                <p className="text-3xl font-bold text-slate-900">{frequentCustomers.length}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-amber-500 opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Loyalty Eligible</p>
                <p className="text-3xl font-bold text-slate-900">{frequentCustomers.filter(c => c.loyalty_points > 0).length}</p>
              </div>
              <Gift className="w-12 h-12 text-rose-500 opacity-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedTab('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedTab === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          All Customers ({filteredCustomers.length})
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedTab('frequent')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedTab === 'frequent'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          Frequent Customers ({frequentCustomers.length})
        </motion.button>
      </div>

      {/* Search & Filter */}
      {selectedTab === 'all' && (
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayCustomers.map((customer) => (
          <motion.div
            key={customer.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedCustomer(customer)}
            className="card p-4 cursor-pointer hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-slate-900">{customer.name}</h3>
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {customer.mobile_number}
                </p>
              </div>
              {customer.is_frequent_customer && (
                <div className="bg-amber-100 rounded-full p-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-50 rounded p-2">
                <p className="text-xs text-slate-600">Purchases</p>
                <p className="font-bold text-slate-900">{customer.purchase_count || 0}</p>
              </div>
              <div className="bg-slate-50 rounded p-2">
                <p className="text-xs text-slate-600">Loyalty Points</p>
                <p className="font-bold text-amber-600">{customer.loyalty_points || 0}</p>
              </div>
            </div>

            {/* Last Purchase */}
            {customer.last_purchase_date && (
              <p className="text-xs text-slate-600">
                Last purchase: {new Date(customer.last_purchase_date).toLocaleDateString()}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {displayCustomers.length === 0 && (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No customers found</p>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedCustomer(null)}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-md p-6 space-y-4"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-sm text-slate-600">{selectedCustomer.mobile_number}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Customer Info */}
            <div className="space-y-3 border-t border-b border-slate-200 py-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Email</span>
                <span className="font-semibold">{selectedCustomer.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Address</span>
                <span className="font-semibold text-right">{selectedCustomer.address || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Purchases</span>
                <span className="font-semibold">{selectedCustomer.purchase_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Loyalty Points</span>
                <span className="font-bold text-amber-600 text-lg">{selectedCustomer.loyalty_points || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  selectedCustomer.is_frequent_customer
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {selectedCustomer.is_frequent_customer ? 'Frequent' : 'Regular'}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedCustomer(null)}
              className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default CustomerManagement
