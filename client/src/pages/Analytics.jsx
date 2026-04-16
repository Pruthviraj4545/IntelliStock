import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Users, Package, IndianRupee, Download, Brain,
  TrendingUp, AlertTriangle, ShoppingBag, Percent
} from 'lucide-react'
import api from '../api/axios'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell, LabelList
} from 'recharts'

const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }

// Chart colors aligned with mandatory palette
const CHART_COLORS   = ['#4f46e5', '#22c55e', '#eab308', '#3b82f6', '#ef4444', '#8b5cf6']
const PAYMENT_COLORS = { CARD: '#4f46e5', CASH: '#22c55e', UPI: '#3b82f6', WALLET: '#eab308' }
const PAYMENT_ORDER  = ['CARD', 'CASH', 'UPI', 'WALLET']

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(0,0,0,0.30)',
  padding: '10px 14px',
  fontSize: 12,
  color: '#f1f5f9',
}

const isDark = () => document.documentElement.classList.contains('dark')
const getStyle = () => isDark() ? tooltipStyle : {
  ...tooltipStyle,
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  color: '#111827',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
}

function Analytics() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [analyticsData, setAnalyticsData] = useState({
    generatedAt: null,
    revenue: { current: 0 },
    sales:   { total: 0 },
    inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, turnover: 0 },
    customers: { total: 0, new: 0, avgOrderValue: 0 },
    insights: [],
    productDemandForecast: [],
    categoryDemand: [],
    paymentMethodMix: []
  })

  const normalizePaymentMethod = (v) => {
    const m = String(v || '').trim().toLowerCase()
    if (m.includes('upi'))    return 'UPI'
    if (m.includes('cash'))   return 'CASH'
    if (m.includes('card'))   return 'CARD'
    if (m.includes('wallet')) return 'WALLET'
    return null
  }

  const getRangeStart = (range) => {
    const now = new Date()
    if (range === '7d')  { const d = new Date(now); d.setDate(now.getDate() - 6); return d }
    if (range === '30d') { const d = new Date(now); d.setDate(now.getDate() - 29); return d }
    if (range === '90d') { const d = new Date(now); d.setDate(now.getDate() - 89); return d }
    return null
  }

  const fetchAllSales = async () => {
    const limit = 100
    const first = await api.get('/sales', { params: { page: 1, limit } })
    const total = Number(first.data?.total || first.data?.sales?.length || 0)
    const pages = Math.max(1, Math.ceil(total / limit))
    if (pages === 1) return first.data?.sales || []
    const rest = await Promise.allSettled(
      Array.from({ length: pages - 1 }, (_, i) => api.get('/sales', { params: { page: i + 2, limit } }))
    )
    return [
      ...(first.data?.sales || []),
      ...rest.flatMap(r => r.status === 'fulfilled' ? (r.value.data?.sales || []) : [])
    ]
  }

  useEffect(() => { fetchAnalyticsData() }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        api.get('/analytics'),
        api.get('/analytics/top-products'),
        api.get('/analytics/profit-report'),
        api.get('/dashboard/inventory-value'),
        api.get('/admin/product-reorder-suggestions'),
        api.get('/products', { params: { page: 1, limit: 500 } }),
        fetchAllSales()
      ])

      const get = (i, fb = {}) => results[i].status === 'fulfilled' ? results[i].value?.data || fb : fb

      const dashboard     = get(0)
      const topProducts   = get(1).top_products || []
      const profit        = get(2)
      const inventoryVal  = get(3).inventory_valuation || {}
      const suggestions   = get(4).suggestions || []
      const products      = get(5).products || []
      const allSales      = results[6].status === 'fulfilled' ? results[6].value : []

      const rangeStart    = getRangeStart(timeRange)
      const filteredSales = rangeStart
        ? allSales.filter(s => { const d = new Date(s.sale_date); return !isNaN(d) && d >= rangeStart })
        : allSales

      const outOfStock    = products.filter(p => Number(p.stock_quantity) === 0).length
      const avgOrderValue = Number(dashboard.total_sales || 0) > 0
        ? Number(dashboard.total_revenue || 0) / Number(dashboard.total_sales || 1) : 0

      const reorderMap    = suggestions.reduce((a, s) => {
        const k = Number(s.product_id || s.id); if (!isNaN(k)) a[k] = Number(s.forecast_total_next_7_days || 0); return a
      }, {})

      const productDemandForecast = topProducts.map(p => ({
        product: p.name,
        recentDemand: Number(p.total_sold || 0),
        predictedDemand: reorderMap[Number(p.id)] > 0
          ? reorderMap[Number(p.id)]
          : Math.max(1, Math.round(Number(p.total_sold || 0) * 0.35))
      })).sort((a, b) => b.predictedDemand - a.predictedDemand).slice(0, 8)

      const catById   = products.reduce((a, p) => { a[Number(p.id)] = p.category || 'Uncategorized'; return a }, {})
      const catByName = products.reduce((a, p) => { if (p.name) a[p.name.trim().toLowerCase()] = p.category || 'Uncategorized'; return a }, {})

      const catAcc = filteredSales.reduce((acc, s) => {
        const cat = s.category || catById[Number(s.product_id)] || catByName[(s.product_name || '').toLowerCase()] || 'Uncategorized'
        if (!acc[cat]) acc[cat] = { category: cat, demandUnits: 0, revenue: 0 }
        acc[cat].demandUnits += Number(s.quantity || 1)
        acc[cat].revenue += Number(s.total_amount || 0)
        return acc
      }, {})

      const categoryDemand = Object.values(catAcc).sort((a, b) => b.demandUnits - a.demandUnits).slice(0, 6)

      const txSeen = { CARD: new Set(), CASH: new Set(), UPI: new Set(), WALLET: new Set() }
      const payAcc = filteredSales.reduce((acc, s) => {
        const m = normalizePaymentMethod(s.payment_method); if (!m) return acc
        if (!acc[m]) acc[m] = { method: m, amount: 0, txCount: 0 }
        acc[m].amount += Number(s.total_amount || 0)
        const key = String(s.transaction_id || `S-${s.id}`)
        if (!txSeen[m].has(key)) { txSeen[m].add(key); acc[m].txCount += 1 }
        return acc
      }, {})

      const paymentMethodMix = PAYMENT_ORDER.map(m => ({
        ...(payAcc[m] || { method: m, amount: 0, txCount: 0 }),
        color: PAYMENT_COLORS[m]
      }))

      const lowStock = Number(dashboard.low_stock_products || 0)
      const totalProd = Number(dashboard.total_products || 0)
      const margin = Number(dashboard.total_revenue || 0) > 0
        ? (Number(profit.summary?.total_profit || 0) / Number(dashboard.total_revenue)) * 100 : 0
      const insufficientProducts = suggestions.filter(s => s.forecast_source === 'insufficient_data').length

      setAnalyticsData({
        generatedAt: new Date().toISOString(),
        revenue:  { current: Number(dashboard.total_revenue || 0) },
        sales:    { total: Number(dashboard.total_sales || 0) },
        inventory:{ totalProducts: totalProd, lowStock, outOfStock, turnover: Number(inventoryVal.avg_stock_per_product || 0) },
        customers:{ total: filteredSales.length, new: filteredSales.filter(s => {
          const d = new Date(s.sale_date), n = new Date()
          return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
        }).length, avgOrderValue },
        insights: [
          { icon: AlertTriangle, color: 'warning', title: 'Inventory Risk',    text: `${lowStock} product(s) at or below reorder level (${totalProd > 0 ? ((lowStock/totalProd)*100).toFixed(1) : 0}% of catalog).` },
          { icon: TrendingUp,    color: 'success', title: 'Profitability',     text: `Gross margin is ${margin.toFixed(1)}% from recorded sales.` },
          { icon: Package,       color: 'primary', title: 'Forecast Coverage', text: insufficientProducts > 0 ? `${insufficientProducts} product(s) have insufficient history for forecasting.` : 'All products met minimum forecast requirements.' },
        ],
        productDemandForecast, categoryDemand, paymentMethodMix
      })
    } catch (err) {
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `analytics-${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const kpiCards = [
    { title: 'Total Revenue',    value: `₹${analyticsData.revenue.current.toLocaleString()}`,   icon: IndianRupee, color: 'from-primary-600 to-primary-500', text: 'text-primary-600', soft: 'bg-primary-600' },
    { title: 'Total Sales',      value: analyticsData.sales.total.toLocaleString(),               icon: ShoppingBag, color: 'from-accent-600 to-accent-500',   text: 'text-accent-600',  soft: 'bg-accent-600'  },
    { title: 'Tracked Orders',   value: analyticsData.customers.total.toLocaleString(),           icon: Users,       color: 'from-success-600 to-success-500', text: 'text-success-600',soft: 'bg-success-600' },
    { title: 'Avg Stock/Product',value: analyticsData.inventory.turnover.toFixed(1),              icon: Package,     color: 'from-warning-500 to-warning-400',  text: 'text-warning-600',soft: 'bg-warning-500' },
  ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center shadow-primary">
              <Brain size={18} className="text-white" />
            </div>
            AI Analytics
          </h1>
          <p className="page-subtitle">Live insights from your inventory, sales, and forecast data</p>
        </div>
        <button onClick={exportReport} className="btn-secondary">
          <Download size={15} /> Export Report
        </button>
      </motion.div>

      {/* ── Time Range Filter ── */}
      <motion.div variants={fadeUp} className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Range:</span>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
          {[{ key: '7d', label: '7 Days' }, { key: '30d', label: '30 Days' }, { key: '90d', label: '90 Days' }].map(opt => (
            <button
              key={opt.key}
              onClick={() => setTimeRange(opt.key)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                timeRange === opt.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── AI Insights Banner ── */}
      <motion.div variants={fadeUp}>
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 rounded-2xl p-6 text-white shadow-primary-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-24 -mt-24 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-12 -mb-12 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-5">
              <Brain size={20} className="text-primary-200" />
              <h2 className="text-lg font-bold">AI-Powered Insights</h2>
              <span className="ml-auto badge bg-white/20 text-white ring-0 text-xs">Live</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analyticsData.insights.map((insight, i) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <p className="text-primary-200 text-xs font-semibold uppercase tracking-wider mb-2">{insight.title}</p>
                  <p className="text-white text-sm leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -3 }}
            className="card p-5 group relative overflow-hidden"
          >
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${card.color} opacity-[0.07]`} />
            <div className={`w-10 h-10 ${card.soft} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
              <card.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{card.value}</p>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">{card.title}</p>
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Charts Row ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Product Demand Forecast */}
        <div className="card p-6">
          <h3 className="chart-title mb-1">High Demand Product Forecast</h3>
          <p className="chart-sub mb-5">Predicted next-cycle demand by product ({timeRange})</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analyticsData.productDemandForecast} layout="vertical" margin={{ left: 12, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="product" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} width={110} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={getStyle()} formatter={(v, name) => [Number(v).toLocaleString(), name === 'predictedDemand' ? 'Predicted' : 'Recent']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="recentDemand"    fill="#bfdbfe" radius={[0, 5, 5, 0]} name="Recent Demand"    maxBarSize={20} />
              <Bar dataKey="predictedDemand" fill="#4f46e5" radius={[0, 5, 5, 0]} name="Predicted Demand" maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Demand Pie */}
        <div className="card p-6">
          <h3 className="chart-title mb-1">Category Demand Mix</h3>
          <p className="chart-sub mb-5">Units sold breakdown by category ({timeRange})</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={analyticsData.categoryDemand}
                dataKey="demandUnits"
                nameKey="category"
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={110}
                paddingAngle={3}
              >
                {analyticsData.categoryDemand.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={getStyle()} formatter={(v) => [Number(v).toLocaleString(), 'Units']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Payment Method Analysis ── */}
      <motion.div variants={fadeUp} className="card p-6">
        <h3 className="chart-title mb-1">Payment Method Analysis</h3>
        <p className="chart-sub mb-5">Revenue and transaction count by payment method ({timeRange})</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={analyticsData.paymentMethodMix} margin={{ right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="method" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${Number(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={getStyle()}
              formatter={(v, name) => [
                name.toLowerCase().includes('amount') ? `₹${Number(v).toLocaleString()}` : Number(v).toLocaleString(),
                name.toLowerCase().includes('amount') ? 'Amount' : 'Transactions'
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="amount" name="Amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {analyticsData.paymentMethodMix.map(item => (
                <Cell key={item.method} fill={item.color} />
              ))}
              <LabelList
                dataKey="txCount"
                position="top"
                formatter={v => `${v} Tx`}
                style={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

    </motion.div>
  )
}

export default Analytics
