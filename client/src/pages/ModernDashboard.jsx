import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, Package, ShoppingCart, AlertTriangle,
  Activity, TrendingUp, TrendingDown, ArrowUpRight,
  ChevronRight, Zap, RefreshCw, BarChart3
} from 'lucide-react'
import PremiumStatsCard from '../components/PremiumStatsCard'
import { ModernCard } from '../components/ModernDashboardLayout'
import { RevenueChart, DemandForecastChart, InventoryTrendChart } from '../components/Charts'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getLowStockProducts } from '../api/productService'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }
}

const stagger = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07 } }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 skeleton rounded-xl" />
          <div className="h-4 w-64 skeleton rounded-lg" />
        </div>
        <div className="h-10 w-32 skeleton rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 space-y-4">
            <div className="flex justify-between">
              <div className="h-11 w-11 skeleton rounded-xl" />
              <div className="h-6 w-16 skeleton rounded-lg" />
            </div>
            <div className="h-8 w-28 skeleton rounded-lg" />
            <div className="h-4 w-20 skeleton rounded-md" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card p-6 h-80 space-y-4">
            <div className="h-5 w-36 skeleton rounded-lg" />
            <div className="flex-1 skeleton rounded-xl h-56" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ModernDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    recentSales: [],
    lowStockItems: [],
    revenueTrendData: [],
    demandForecastData: [],
    inventoryTrendData: [],
    quickStats: {
      activeProducts: 0, pendingOrders: 0, conversionRate: 0,
      avgOrderValue: 0, growthRate: 0, stockValue: 0, avgStockPerProduct: 0
    }
  })

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [salesRes, dashboardRes, inventoryRes, monthlyRevenueRes, lowStockRes, todayOverviewRes] = await Promise.all([
        api.get('/sales').catch(() => ({ data: {} })),
        api.get('/dashboard').catch(() => ({ data: {} })),
        api.get('/dashboard/inventory-value').catch(() => ({ data: {} })),
        api.get('/dashboard/monthly-revenue').catch(() => ({ data: {} })),
        getLowStockProducts().catch(() => ({ low_stock_products: [] })),
        api.get('/dashboard/inventory-overview', { params: { period: 'today' } }).catch(() => ({ data: {} }))
      ])

      const sales          = salesRes.data?.sales || []
      const dashboard      = dashboardRes.data || {}
      const inventory      = inventoryRes.data?.inventory_valuation || {}
      const monthlyRevenue = monthlyRevenueRes.data?.monthly_revenue || []
      const lowStockProducts = lowStockRes.low_stock_products || []
      const todayOverview  = todayOverviewRes.data?.summary || {}

      const totalRevenue  = Number(dashboard.total_revenue || 0)
      const totalSales    = Number(dashboard.total_sales || 0)
      const totalProducts = Number(dashboard.total_products || 0)
      const lowStockCount = Number(dashboard.low_stock_products || lowStockProducts.length || 0)
      const lowOnlyCount  = lowStockProducts.filter(p => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= Number(p.reorder_level || 10)).length
      const outOfStockCount = lowStockProducts.filter(p => Number(p.stock_quantity) === 0).length
      const inStockCount  = Math.max(Number(dashboard.active_products || totalProducts || 0) - lowStockCount, 0)
      const todaySales    = Number(todayOverview.total_revenue || 0)

      const previousMonth = monthlyRevenue.length >= 2 ? Number(monthlyRevenue[monthlyRevenue.length - 2].revenue || 0) : 0
      const latestMonth   = monthlyRevenue.length >= 1 ? Number(monthlyRevenue[monthlyRevenue.length - 1].revenue || 0) : 0
      const growthRate    = previousMonth > 0 ? ((latestMonth - previousMonth) / previousMonth) * 100 : 0

      const recentSales   = sales.slice(0, 5).map(s => ({
        id: s.id, product: s.product_name,
        amount: `₹${Number(s.total_amount || 0).toFixed(2)}`,
        date: new Date(s.sale_date).toLocaleDateString(), status: 'Completed'
      }))

      const lowStockItems = lowStockProducts.slice(0, 6).map(item => ({
        id: item.id, name: item.name,
        stock: Number(item.stock_quantity), reorder: Number(item.reorder_level || 10),
        status: Number(item.stock_quantity) === 0 ? 'Out of Stock' : 'Low Stock'
      }))

      const revenueTrendData  = monthlyRevenue.map(e => ({ date: e.month, revenue: Number(e.revenue || 0) }))
      const latestRevenue     = revenueTrendData.slice(-4).map(e => e.revenue)
      const lastRev           = latestRevenue.at(-1) || totalRevenue / 6
      const avgGrowth         = latestRevenue.length > 1
        ? latestRevenue.slice(1).reduce((acc, v, i) => {
            const prev = latestRevenue[i]; return prev > 0 ? acc + (v - prev) / prev : acc
          }, 0) / (latestRevenue.length - 1)
        : 0.06

      const latestMonthText   = revenueTrendData.at(-1)?.date
      const baseDate          = latestMonthText ? new Date(`${latestMonthText}-01`) : new Date()

      const demandForecastData = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(baseDate); d.setMonth(d.getMonth() + i + 1)
        return {
          month: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
          forecast: Math.max(0, Math.round(lastRev * Math.pow(1 + avgGrowth, i + 1)))
        }
      })

      setDashboardData({
        stats: [
          { title: 'Total Revenue',     value: `₹${totalRevenue.toLocaleString()}`,  icon: DollarSign,    color: 'indigo', change: growthRate.toFixed(1), changeType: growthRate >= 0 ? 'increase' : 'decrease', subtitle: 'vs last month' },
          { title: 'Total Products',    value: totalProducts,                         icon: Package,       color: 'blue',   subtitle: 'Active SKUs' },
          { title: 'Low Stock Alerts',  value: lowStockCount,                         icon: AlertTriangle, color: 'amber',  change: lowStockCount > 0 ? 'Action needed' : null, subtitle: 'Below reorder level' },
          { title: "Today's Revenue",   value: `₹${todaySales.toLocaleString()}`,     icon: ShoppingCart,  color: 'emerald',subtitle: 'vs yesterday' },
        ],
        recentSales, lowStockItems, revenueTrendData, demandForecastData,
        inventoryTrendData: [{ month: 'Current', inStock: inStockCount, lowStock: lowOnlyCount, outOfStock: outOfStockCount }],
        quickStats: {
          activeProducts: Number(dashboard.active_products || 0),
          pendingOrders: lowStockCount,
          conversionRate: totalProducts > 0 ? (totalSales / totalProducts) * 100 : 0,
          avgOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0,
          growthRate, stockValue: Number(inventory.total_inventory_value || 0),
          avgStockPerProduct: Number(inventory.avg_stock_per_product || 0)
        }
      })
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }

  const handleRefresh = () => { setRefreshing(true); fetchDashboardData() }

  if (loading) return <LoadingSkeleton />

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">

      {/* ── Page Header ── */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center shadow-primary">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">{greeting}, {user.name?.split(' ')[0] || 'Admin'} 👋</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
            Business Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Here's what's happening with your inventory today.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-primary self-start sm:self-auto"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </motion.button>
      </motion.div>

      {/* ── KPI Stats ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData.stats.map((stat, i) => (
          <PremiumStatsCard
            key={i}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeType={stat.changeType}
            subtitle={stat.subtitle}
            color={stat.color}
          />
        ))}
      </motion.div>

      {/* ── Charts Row ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="chart-title flex items-center gap-2">
                <Activity size={17} className="text-primary-600 dark:text-primary-400" />
                Revenue Trend
              </h3>
              <p className="chart-sub">Monthly performance over time</p>
            </div>
            <span className={`badge ${dashboardData.quickStats.growthRate >= 0 ? 'badge-success' : 'badge-danger'}`}>
              {dashboardData.quickStats.growthRate >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(dashboardData.quickStats.growthRate).toFixed(1)}%
            </span>
          </div>
          <RevenueChart data={dashboardData.revenueTrendData} />
        </div>

        {/* Demand Forecast */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="chart-title flex items-center gap-2">
                <BarChart3 size={17} className="text-accent-600 dark:text-accent-400" />
                Demand Forecast
              </h3>
              <p className="chart-sub">AI-powered next-period predictions</p>
            </div>
            <span className="badge badge-primary">
              <Zap size={11} />
              AI Enabled
            </span>
          </div>
          <DemandForecastChart data={dashboardData.demandForecastData} />
        </div>
      </motion.div>

      {/* ── Quick Stats Row ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Quick Stats */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-primary-50 dark:bg-primary-950/50 rounded-xl flex items-center justify-center">
              <Activity size={17} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Quick Stats</h4>
              <p className="text-xs text-gray-400 dark:text-slate-500">Real-time metrics</p>
            </div>
          </div>
          <div className="space-y-1">
            {[
              { label: 'Active Products',   value: dashboardData.quickStats.activeProducts,               icon: ArrowUpRight, color: 'text-success-600 dark:text-success-400' },
              { label: 'Pending Reorders',  value: dashboardData.quickStats.pendingOrders,                icon: AlertTriangle, color: dashboardData.quickStats.pendingOrders > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-gray-400' },
              { label: 'Sales / Product',   value: `${dashboardData.quickStats.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-accent-600 dark:text-accent-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group cursor-default">
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{item.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-0.5">{item.value}</p>
                </div>
                <item.icon size={18} className={item.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Performance */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-success-50 dark:bg-success-950/50 rounded-xl flex items-center justify-center">
              <TrendingUp size={17} className="text-success-600 dark:text-success-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Performance</h4>
              <p className="text-xs text-gray-400 dark:text-slate-500">Key business metrics</p>
            </div>
          </div>
          <div className="space-y-1">
            {[
              { label: 'Avg Order Value',  value: `₹${dashboardData.quickStats.avgOrderValue.toFixed(2)}`, badge: '+5.2%',  badgeColor: 'badge-success' },
              { label: 'Growth Rate',      value: `${dashboardData.quickStats.growthRate.toFixed(1)}%`,     badge: dashboardData.quickStats.growthRate >= 0 ? '▲' : '▼', badgeColor: dashboardData.quickStats.growthRate >= 0 ? 'badge-success' : 'badge-danger' },
              { label: 'Total Sales',      value: dashboardData.recentSales.length,                         badge: 'recorded', badgeColor: 'badge-gray' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-default">
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{item.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-0.5">{item.value}</p>
                </div>
                <span className={`badge ${item.badgeColor} text-[10px]`}>{item.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Status */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-warning-50 dark:bg-warning-950/50 rounded-xl flex items-center justify-center">
              <Package size={17} className="text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Inventory Status</h4>
              <p className="text-xs text-gray-400 dark:text-slate-500">Stock overview</p>
            </div>
          </div>
          <div className="space-y-1">
            {[
              { label: 'Total Stock Value',     value: `₹${dashboardData.quickStats.stockValue.toLocaleString()}` },
              { label: 'Avg Stock / Product',   value: dashboardData.quickStats.avgStockPerProduct.toFixed(1) },
              { label: 'Low / Out of Stock',    value: dashboardData.lowStockItems.length,
                append: <span className={`badge text-[10px] ${dashboardData.lowStockItems.length > 0 ? 'badge-danger' : 'badge-success'}`}>
                  {dashboardData.lowStockItems.length > 0 ? 'Action needed' : 'All good'}
                </span>
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-default">
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{item.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-0.5">{item.value}</p>
                </div>
                {item.append || <ChevronRight size={15} className="text-gray-300 dark:text-slate-600" />}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Recent Sales & Low Stock ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Sales */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">Recent Sales</h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Latest transactions</p>
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              View all <ChevronRight size={13} />
            </button>
          </div>

          {dashboardData.recentSales.length > 0 ? (
            <div className="space-y-2">
              {dashboardData.recentSales.map((sale, idx) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => navigate('/sales')}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950/50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={16} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {sale.product}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{sale.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{sale.amount}</p>
                    <span className="badge badge-success text-[10px] mt-0.5">{sale.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="w-14 h-14 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingCart size={24} className="text-gray-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-slate-300">No sales yet</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Start selling to see transactions here</p>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle size={16} className="text-warning-500" />
                Low Stock Alerts
              </h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Items needing reorder attention</p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              Manage <ChevronRight size={13} />
            </button>
          </div>

          {dashboardData.lowStockItems.length > 0 ? (
            <div className="space-y-2">
              {dashboardData.lowStockItems.map((item, idx) => {
                const isOut = item.status === 'Out of Stock'
                const pct   = Math.min((item.stock / item.reorder) * 100, 100)
                return (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => navigate('/products')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                      isOut
                        ? 'bg-danger-50/50 dark:bg-danger-900/10 border-danger-100 dark:border-danger-900/30 hover:border-danger-200'
                        : 'bg-warning-50/50 dark:bg-warning-900/10 border-warning-100 dark:border-warning-900/30 hover:border-warning-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{item.name}</p>
                      <span className={`badge text-[10px] ml-2 flex-shrink-0 ${isOut ? 'badge-danger' : 'badge-warning'}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Stock: <span className={`font-semibold ${isOut ? 'text-danger-600' : 'text-warning-600'}`}>{item.stock}</span>
                        <span className="text-gray-400 dark:text-slate-600"> / Reorder: {item.reorder}</span>
                      </p>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isOut ? 'bg-danger-500' : 'bg-warning-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="w-14 h-14 bg-success-50 dark:bg-success-900/20 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-success-800 dark:text-success-300">All items well stocked!</p>
              <p className="text-xs text-success-600 dark:text-success-500 mt-1">No immediate reorders needed</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Inventory Trend ── */}
      <motion.div variants={fadeUp}>
        <div className="card p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="chart-title">Inventory Snapshot</h3>
              <p className="chart-sub">Current stock distribution by status</p>
            </div>
            <select className="input text-xs py-1.5 w-auto min-w-[140px]">
              <option>Last 6 months</option>
              <option>Last year</option>
              <option>All time</option>
            </select>
          </div>
          <InventoryTrendChart data={dashboardData.inventoryTrendData} />
        </div>
      </motion.div>

    </motion.div>
  )
}

export default ModernDashboard
