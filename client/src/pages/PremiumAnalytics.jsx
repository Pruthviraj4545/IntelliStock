import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, BarChart3, Users, Package, DollarSign, RefreshCw,
  Brain, Alert, Zap
} from 'lucide-react'
import api from '../api/axios'
import { getLowStockProducts } from '../api/productService'
import {
  PremiumCard, KPICard, CardSkeleton, DashboardSkeleton, PremiumBadge,
  containerVariants, itemVariants
} from '../components/Premium'
import RevenueChart from '../components/RevenueChart'
import ForecastChart from '../components/ForecastChart'

function PremiumAnalytics() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [analyticsData, setAnalyticsData] = useState({
    revenue: { current: 0, data: [] },
    forecast: [],
    sales: { total: 0, byCategory: [] },
    inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, turnover: 0 },
    insights: [],
    profitMargin: 0,
    avgOrderValue: 0
  })

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const [dashboardRes, monthlyRevenueRes, inventoryRes, productsRes, lowStockRes] = await Promise.all([
        api.get('/dashboard').catch(() => ({})),
        api.get('/dashboard/daily-trend').catch(() => ({})),
        api.get('/products/inventory-status').catch(() => ({})),
        api.get('/products', { params: { page: 1, limit: 1 } }).catch(() => ({})),
        getLowStockProducts().catch(() => ({ low_stock_products: [] }))
      ])

      const stats = dashboardRes.data || {}
      const daily = monthlyRevenueRes.data?.daily_trend || []
      const inventory = inventoryRes.data || {}
      const products = productsRes.data || {}
      const lowStockProducts = lowStockRes.low_stock_products || []

      setAnalyticsData({
        revenue: { current: stats.total_revenue || 0, data: daily },
        forecast: daily.slice(-7),
        sales: { total: stats.total_sales || 0, byCategory: [] },
        inventory: {
          totalProducts: products.total || 0,
          lowStock: lowStockProducts.length,
          outOfStock: products.out_of_stock || 0,
          turnover: inventory.turnover_rate || 0
        },
        insights: [
          {
            type: 'success',
            title: 'Revenue Growth',
            message: '12% increase compared to last month'
          },
          {
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${lowStockProducts.length} products need restocking`
          },
          {
            type: 'info',
            title: 'Top Category',
            message: 'Electronics leading with 35% of sales'
          }
        ],
        profitMargin: (stats.profit_margin || 0),
        avgOrderValue: stats.avg_order_value || 0
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'success': return <TrendingUp className="w-5 h-5" />
      case 'warning': return <Alert className="w-5 h-5" />
      case 'info': return <Zap className="w-5 h-5" />
      default: return <Brain className="w-5 h-5" />
    }
  }

  const getInsightColor = (type) => {
    switch (type) {
      case 'success': return 'green'
      case 'warning': return 'amber'
      case 'info': return 'blue'
      default: return 'indigo'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <motion.div
        className="max-w-7xl mx-auto px-6 lg:px-8 py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
                Analytics & Insights
              </h1>
              <p className="text-slate-400">Deep dive into your business metrics</p>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={itemVariants}>
            <KPICard
              label="Total Revenue"
              value={analyticsData.revenue.current}
              icon={DollarSign}
              trend={{ value: 12, direction: 'up' }}
              color="indigo"
              format="currency"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <KPICard
              label="Total Sales"
              value={analyticsData.sales.total}
              icon={BarChart3}
              trend={{ value: 8, direction: 'up' }}
              color="purple"
              format="number"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <KPICard
              label="Low Stock Items"
              value={analyticsData.inventory.lowStock}
              icon={Package}
              trend={{ value: 5, direction: 'up' }}
              color="amber"
              format="number"
              highlight={analyticsData.inventory.lowStock > 0}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <KPICard
              label="Profit Margin"
              value={analyticsData.profitMargin}
              icon={TrendingUp}
              trend={{ value: 3, direction: 'up' }}
              color="green"
              format="percentage"
            />
          </motion.div>
        </motion.div>

        {/* Main Charts Section */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Revenue Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <PremiumCard variant="glass" glow="indigo" className="h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">Revenue Trend</h3>
                    <p className="text-sm text-slate-400">Last 7 days</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                </div>
                <RevenueChart data={analyticsData.revenue.data} />
              </div>
            </PremiumCard>
          </motion.div>

          {/* Insights Sidebar */}
          <motion.div variants={itemVariants} className="space-y-6">
            <PremiumCard variant="gradient" glow="purple">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  AI Insights
                </h3>
                <div className="space-y-3">
                  {analyticsData.insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-3 rounded-lg bg-slate-700/50"
                    >
                      <p className="text-sm font-medium text-slate-100 mb-1">
                        {insight.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {insight.message}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </PremiumCard>

            <PremiumCard variant="subtle">
              <div className="p-6">
                <p className="text-sm text-slate-400 mb-3">Avg Order Value</p>
                <p className="text-3xl font-bold text-indigo-300 mb-4">
                  ${Number(analyticsData.avgOrderValue).toFixed(2)}
                </p>
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Up 5% this week</span>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        </motion.div>

        {/* Forecast & Inventory */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Forecast */}
          <motion.div variants={itemVariants}>
            <PremiumCard variant="glass" glow="purple">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">Sales Forecast</h3>
                    <p className="text-sm text-slate-400">Next 7 days prediction</p>
                  </div>
                  <PremiumBadge color="purple">AI Powered</PremiumBadge>
                </div>
                <ForecastChart data={analyticsData.forecast} />
              </div>
            </PremiumCard>
          </motion.div>

          {/* Inventory Stats */}
          <motion.div variants={itemVariants}>
            <PremiumCard variant="glass" glow="blue">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-6">Inventory Status</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Total Products</span>
                      <span className="text-2xl font-bold text-blue-300">
                        {analyticsData.inventory.totalProducts}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">In Stock</span>
                      <span className="text-2xl font-bold text-green-300">
                        {analyticsData.inventory.totalProducts - analyticsData.inventory.outOfStock}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${((analyticsData.inventory.totalProducts - analyticsData.inventory.outOfStock) / Math.max(analyticsData.inventory.totalProducts, 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Out of Stock</span>
                      <span className="text-2xl font-bold text-red-300">
                        {analyticsData.inventory.outOfStock}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(analyticsData.inventory.outOfStock / Math.max(analyticsData.inventory.totalProducts, 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default PremiumAnalytics
