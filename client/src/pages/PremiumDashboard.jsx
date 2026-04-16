import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart,
  AlertCircle, RefreshCw, Eye, MoreVertical, ArrowUpRight, ArrowDownLeft
} from 'lucide-react'
import api from '../api/axios'
import { getLowStockProducts } from '../api/productService'
import {
  PremiumCard, KPICard, CardSkeleton, DashboardSkeleton, AnimatedCounter,
  PremiumButton, containerVariants, itemVariants
} from '../components/Premium'
import RevenueChart from '../components/RevenueChart'
import ForecastChart from '../components/ForecastChart'

function PremiumDashboard() {
  const [dashboardData, setDashboardData] = useState({
    daily_trend: [],
    total_revenue: 0,
    total_sales: 0,
    total_products: 0,
    low_stock_count: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [dailyRes, statsRes, productsRes, lowStockRes] = await Promise.all([
        api.get('/dashboard/daily-trend').catch(() => ({})),
        api.get('/dashboard').catch(() => ({})),
        api.get('/products', { params: { page: 1, limit: 1 } }).catch(() => ({})),
        getLowStockProducts().catch(() => ({ low_stock_products: [] }))
      ])

      const daily = dailyRes.data?.daily_trend || []
      const stats = statsRes.data || {}
      const productStats = productsRes.data || {}
      const lowStockProducts = lowStockRes.low_stock_products || []

      setDashboardData({
        daily_trend: daily,
        total_revenue: stats.total_revenue || 0,
        total_sales: stats.total_sales || 0,
        total_products: productStats.total || 0,
        low_stock_count: lowStockProducts.length
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  const avgRevenue = dashboardData.daily_trend.length > 0
    ? (dashboardData.daily_trend.reduce((sum, d) => sum + (d.revenue || 0), 0) / dashboardData.daily_trend.length).toFixed(2)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <DashboardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950">
      <motion.div
        className="max-w-7xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="px-6 py-8 lg:px-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-slate-400">Welcome back! Here are your key metrics</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          variants={containerVariants}
          className="px-6 lg:px-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue */}
            <motion.div variants={itemVariants}>
              <KPICard
                label="Total Revenue"
                value={dashboardData.total_revenue}
                icon={DollarSign}
                trend={{ value: 12, direction: 'up' }}
                color="indigo"
                format="currency"
              />
            </motion.div>

            {/* Total Sales */}
            <motion.div variants={itemVariants}>
              <KPICard
                label="Total Sales"
                value={dashboardData.total_sales}
                icon={ShoppingCart}
                trend={{ value: 8, direction: 'up' }}
                color="purple"
                format="number"
              />
            </motion.div>

            {/* Total Products */}
            <motion.div variants={itemVariants}>
              <KPICard
                label="Total Products"
                value={dashboardData.total_products}
                icon={Package}
                trend={{ value: 3, direction: 'down' }}
                color="blue"
                format="number"
              />
            </motion.div>

            {/* Low Stock Alert */}
            <motion.div variants={itemVariants}>
              <KPICard
                label="Low Stock Items"
                value={dashboardData.low_stock_count}
                icon={AlertCircle}
                trend={{ value: 2, direction: 'up' }}
                color="amber"
                format="number"
                highlight={dashboardData.low_stock_count > 0}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <motion.div
          variants={containerVariants}
          className="px-6 lg:px-8 mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <PremiumCard variant="glass" glow="indigo" className="h-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">Revenue Trend</h3>
                      <p className="text-sm text-slate-400">Last 7 days performance</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                  </div>
                  <RevenueChart data={dashboardData.daily_trend} />
                </div>
              </PremiumCard>
            </motion.div>

            {/* Stats Sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Average Revenue */}
              <PremiumCard variant="gradient" className="h-full">
                <div className="p-6">
                  <p className="text-sm text-slate-400 mb-2">Daily Average</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-indigo-200">
                      ${Number(avgRevenue).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+5% from last week</span>
                  </div>
                </div>
              </PremiumCard>

              {/* Quick Actions */}
              <PremiumCard variant="subtle">
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-slate-100 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <motion.button
                      whileHover={{ x: 4 }}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-indigo-500/20 text-slate-100 text-sm font-medium transition-colors"
                    >
                      <span>View Products</span>
                      <Eye className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ x: 4 }}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-purple-500/20 text-slate-100 text-sm font-medium transition-colors"
                    >
                      <span>Low Stock Report</span>
                      <AlertCircle className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ x: 4 }}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-pink-500/20 text-slate-100 text-sm font-medium transition-colors"
                    >
                      <span>Analytics</span>
                      <TrendingUp className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          </div>
        </motion.div>

        {/* Forecast Section */}
        <motion.div variants={itemVariants} className="px-6 lg:px-8 mb-8">
          <PremiumCard variant="glass" glow="purple">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Sales Forecast</h3>
                  <p className="text-sm text-slate-400">AI-powered predictions</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-medium">
                  AI Powered
                </div>
              </div>
              <ForecastChart
                data={dashboardData.daily_trend.slice(-7).map((item) => ({
                  date: item.date,
                  forecast: Number(item.revenue || 0)
                }))}
              />
            </div>
          </PremiumCard>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default PremiumDashboard
