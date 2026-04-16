import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Clock, RefreshCw, TrendingDown } from 'lucide-react'
import api from '../api/axios'
import { acknowledgeAlert } from '../api/shopService'

export function LowStockAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAlerts()
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/invoices/alerts/low-stock', {
        params: { status: filter }
      })
      setAlerts(response.data?.alerts || [])
    } catch (error) {
      console.error('Error fetching low stock alerts:', error)
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAlerts()
    setRefreshing(false)
  }

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId)
      await fetchAlerts()
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const getAlertColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-red-50 border-red-200'
      case 'acknowledged':
        return 'bg-yellow-50 border-yellow-200'
      case 'resolved':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-slate-50 border-slate-200'
    }
  }

  const getAlertIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'acknowledged':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <TrendingDown className="w-5 h-5 text-slate-500" />
    }
  }

  const getStockPercentage = (current, reorder) => {
    return Math.min(100, (current / Math.max(reorder, 1)) * 100)
  }

  return (
    <div className="space-y-4">
      {/* Header with Filter and Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Low Stock Alerts</h2>
          <p className="text-sm text-slate-600">Products below reorder threshold</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['pending', 'acknowledged', 'resolved'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status)
              setLoading(true)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({alerts.filter(a => a.alert_status === status).length})
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-500 mt-3">Loading alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-slate-900 font-medium">No {filter} alerts</p>
          <p className="text-sm text-slate-600">All products have sufficient stock</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-lg p-4 ${getAlertColor(alert.alert_status)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {getAlertIcon(alert.alert_status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{alert.name}</h3>
                    <p className="text-xs text-slate-600 mt-1">SKU: {alert.sku}</p>
                    
                    {/* Stock Information */}
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Current Stock</span>
                        <span className="font-semibold text-slate-900">{alert.current_stock} units</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Reorder Level</span>
                        <span className="font-semibold text-amber-600">{alert.reorder_level} units</span>
                      </div>
                      
                      {/* Stock Progress Bar */}
                      <div className="mt-2">
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getStockPercentage(alert.current_stock, alert.reorder_level)}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full ${
                              alert.alert_status === 'pending'
                                ? 'bg-red-500'
                                : alert.alert_status === 'acknowledged'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {getStockPercentage(alert.current_stock, alert.reorder_level).toFixed(0)}% of reorder level
                        </p>
                      </div>
                    </div>

                    {/* Alert Date */}
                    {alert.acknowledged_at && (
                      <p className="text-xs text-slate-500 mt-2">
                        Acknowledged: {new Date(alert.acknowledged_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                {alert.alert_status === 'pending' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors flex-shrink-0"
                  >
                    Acknowledge
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">
              {alerts.filter(a => a.alert_status === 'pending').length}
            </p>
            <p className="text-xs text-slate-600">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">
              {alerts.filter(a => a.alert_status === 'acknowledged').length}
            </p>
            <p className="text-xs text-slate-600">Acknowledged</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">
              {alerts.filter(a => a.alert_status === 'resolved').length}
            </p>
            <p className="text-xs text-slate-600">Resolved</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default LowStockAlerts
