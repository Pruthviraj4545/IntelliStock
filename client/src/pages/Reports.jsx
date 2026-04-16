import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar
} from 'recharts'
import {
  Download,
  RefreshCw,
  AlertCircle,
  FileText,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  Filter
} from 'lucide-react'
import { useToast } from '../components/Toast'
import { getMonthlySalesReport, getSalesSummary, getTopProducts } from '../api/reportService'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const rangeOptions = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '12m', label: 'Last 12 months' }
]

const toCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(value || 0))

const toWholeCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const toNumber = (value) => Number(value || 0)

const toChartLabel = (monthKey) => {
  if (!monthKey) return 'Unknown'

  const date = monthKey.length === 7
    ? new Date(`${monthKey}-01T00:00:00`)
    : new Date(`${monthKey}T00:00:00`)

  if (Number.isNaN(date.getTime())) return monthKey

  if (monthKey.length === 7) {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getErrorMeta = (error) => {
  const status = error?.response?.status
  const backendMessage = error?.response?.data?.message

  if (!error?.response || error?.code === 'ERR_NETWORK') {
    return {
      title: 'Server not reachable',
      message: 'Unable to connect to backend. Please check if the server is running and reachable.'
    }
  }

  if (status === 401) {
    return {
      title: 'Authentication required',
      message: 'Your session is missing or expired. Please log in again to view reports.'
    }
  }

  if (status === 403) {
    return {
      title: 'Access denied',
      message: 'Your account does not have permission to view reports.'
    }
  }

  if (status >= 500) {
    return {
      title: 'Server error',
      message: backendMessage || 'The reports service failed while processing your request.'
    }
  }

  return {
    title: 'Unable to load report data',
    message: backendMessage || 'Something went wrong while loading reports.'
  }
}

function Reports() {
  const toast = useToast()

  const [filters, setFilters] = useState({
    range: '30d',
    startDate: '',
    endDate: ''
  })

  const [reportData, setReportData] = useState({
    monthlySales: [],
    summary: {
      total_revenue: 0,
      total_sales: 0,
      average_order_value: 0,
      total_items_sold: 0
    },
    topProducts: []
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const activeFilterParams = useMemo(() => {
    const hasCustomDates = Boolean(filters.startDate && filters.endDate)

    if (hasCustomDates) {
      return {
        range: filters.range,
        startDate: filters.startDate,
        endDate: filters.endDate
      }
    }

    return { range: filters.range }
  }, [filters])

  const trendData = useMemo(
    () => (reportData.monthlySales || []).map((item) => ({
      ...item,
      label: toChartLabel(item.month),
      revenue: toNumber(item.revenue),
      total_sales: toNumber(item.total_sales)
    })),
    [reportData.monthlySales]
  )

  const hasSalesData = useMemo(() => {
    return trendData.length > 0 || toNumber(reportData.summary?.total_sales) > 0
  }, [trendData, reportData.summary])

  const monthlyRevenueCards = useMemo(() => {
    return trendData.slice(-4).reverse()
  }, [trendData])

  const loadReports = async (isManualRefresh = false) => {
    try {
      setError(null)
      if (isManualRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const [monthlyResponse, summaryResponse, topProductsResponse] = await Promise.all([
        getMonthlySalesReport(activeFilterParams),
        getSalesSummary(activeFilterParams),
        getTopProducts(activeFilterParams)
      ])

      setReportData({
        monthlySales: monthlyResponse.monthly_sales || [],
        summary: summaryResponse.summary || {},
        topProducts: topProductsResponse.top_products || []
      })
    } catch (err) {
      const errorMeta = getErrorMeta(err)
      setError(errorMeta)
      setReportData({
        monthlySales: [],
        summary: {
          total_revenue: 0,
          total_sales: 0,
          average_order_value: 0,
          total_items_sold: 0
        },
        topProducts: []
      })
      toast.error(errorMeta.title)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadReports(false)
  }, [activeFilterParams])

  const applyQuickRange = (range) => {
    setFilters((prev) => ({
      ...prev,
      range,
      startDate: '',
      endDate: ''
    }))
  }

  const applyCustomDateRange = () => {
    if (!filters.startDate || !filters.endDate) {
      toast.warning('Please select both start and end dates')
      return
    }

    const start = new Date(filters.startDate)
    const end = new Date(filters.endDate)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      toast.warning('Please choose a valid date range')
      return
    }

    loadReports(false)
  }

  const handleRefresh = () => {
    loadReports(true)
  }

  const exportCsv = () => {
    try {
      const lines = []
      lines.push('Section,Metric,Value')
      lines.push(`Summary,Total Revenue,${toNumber(reportData.summary.total_revenue).toFixed(2)}`)
      lines.push(`Summary,Total Sales,${toNumber(reportData.summary.total_sales)}`)
      lines.push(`Summary,Average Order Value,${toNumber(reportData.summary.average_order_value).toFixed(2)}`)
      lines.push(`Summary,Total Items Sold,${toNumber(reportData.summary.total_items_sold)}`)
      lines.push('')
      lines.push('Monthly Revenue')
      lines.push('Month,Revenue,Sales Count,Quantity')

      trendData.forEach((row) => {
        lines.push(`${row.label},${toNumber(row.revenue).toFixed(2)},${toNumber(row.total_sales)},${toNumber(row.total_quantity)}`)
      })

      lines.push('')
      lines.push('Top Products')
      lines.push('Product,Units Sold,Revenue')

      ;(reportData.topProducts || []).forEach((product) => {
        lines.push(`${product.name},${toNumber(product.total_sold)},${toNumber(product.revenue_generated).toFixed(2)}`)
      })

      const csv = `data:text/csv;charset=utf-8,${encodeURIComponent(lines.join('\n'))}`
      const link = document.createElement('a')
      link.setAttribute('href', csv)
      link.setAttribute('download', `intellistock-reports-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Report exported as CSV')
    } catch (err) {
      toast.error('Failed to export CSV')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 skeleton rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 space-y-3">
              <div className="h-4 w-32 skeleton rounded" />
              <div className="h-7 w-36 skeleton rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="card p-6 xl:col-span-2 h-96 skeleton rounded-xl" />
          <div className="card p-6 h-96 skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={fadeUp} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center shadow-primary">
              <FileText size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Analytics Dashboard</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100">Sales Reports</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Real-time revenue analytics, top products, and trend insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} disabled={refreshing} className="btn-secondary">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={exportCsv} disabled={!hasSalesData} className="btn-primary">
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={15} className="text-primary-600 dark:text-primary-400" />
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Filters</p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => applyQuickRange(option.key)}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  filters.range === option.key && !filters.startDate && !filters.endDate
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-primary-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <label className="text-xs font-medium text-gray-600 dark:text-slate-300 md:col-span-1">
              Start Date
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </label>
            <label className="text-xs font-medium text-gray-600 dark:text-slate-300 md:col-span-1">
              End Date
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button onClick={applyCustomDateRange} className="btn-secondary w-full md:w-auto">
                <Calendar size={14} />
                Apply Date Range
              </button>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, startDate: '', endDate: '' }))}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Clear Dates
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeUp} className="alert alert-warning flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{error.title}</p>
            <p className="text-xs opacity-90 mt-1">{error.message}</p>
            <button onClick={handleRefresh} className="btn-secondary mt-3">
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </motion.div>
      )}

      {!error && hasSalesData && (
        <>
          <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Total Revenue</p>
                <DollarSign size={16} className="text-success-600 dark:text-success-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{toWholeCurrency(reportData.summary.total_revenue)}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Total Sales</p>
                <ShoppingCart size={16} className="text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{toNumber(reportData.summary.total_sales).toLocaleString()}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Avg Order Value</p>
                <DollarSign size={16} className="text-warning-600 dark:text-warning-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{toCurrency(reportData.summary.average_order_value)}</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Items Sold</p>
                <Package size={16} className="text-accent-600 dark:text-accent-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{toNumber(reportData.summary.total_items_sold).toLocaleString()}</p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card p-6 xl:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">Revenue Trend</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">Line chart based on real sales records</p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-subtext)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-subtext)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `INR ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => toCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">Top Products</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">Best-selling products by units sold</p>
              {(reportData.topProducts || []).length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-auto pr-1">
                  {reportData.topProducts.slice(0, 8).map((item, index) => (
                    <div key={item.id || `${item.name}-${index}`} className="rounded-xl border border-gray-100 dark:border-slate-800 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{item.name}</p>
                        <span className="badge badge-primary text-[11px]">{toNumber(item.total_sold)} sold</span>
                      </div>
                      <p className="text-xs text-success-700 dark:text-success-400 mt-1">{toCurrency(item.revenue_generated)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state h-64">
                  <p className="text-sm text-gray-500 dark:text-slate-400">No top products in selected range</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">Top Products Revenue</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">Revenue contribution by product</p>
              {(reportData.topProducts || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.topProducts.slice(0, 6)} layout="vertical" margin={{ left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-subtext)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `INR ${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: 'var(--color-subtext)' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => toCurrency(value)} />
                    <Bar dataKey="revenue_generated" fill="#22c55e" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state h-64">
                  <p className="text-sm text-gray-500 dark:text-slate-400">No product revenue data available</p>
                </div>
              )}
            </div>

            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-4">Monthly Revenue Cards</h3>
              <div className="space-y-3">
                {monthlyRevenueCards.length > 0 ? (
                  monthlyRevenueCards.map((row) => (
                    <div key={row.month} className="rounded-xl border border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{row.label}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{toNumber(row.total_sales)} orders</p>
                      </div>
                      <p className="text-sm font-bold text-success-700 dark:text-success-400">{toCurrency(row.revenue)}</p>
                    </div>
                  ))
                ) : (
                  <div className="empty-state h-64">
                    <p className="text-sm text-gray-500 dark:text-slate-400">No monthly revenue cards to display</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {!error && !hasSalesData && (
        <motion.div variants={fadeUp} className="card p-14 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <FileText size={34} className="text-gray-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">No sales data available yet</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-lg mx-auto mb-5">
            Reports are connected to live database records. Add sales transactions and this dashboard will automatically populate.
          </p>
          <button onClick={handleRefresh} className="btn-secondary mx-auto">
            <RefreshCw size={14} />
            Retry
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Reports
