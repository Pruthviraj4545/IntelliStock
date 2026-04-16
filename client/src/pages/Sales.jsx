import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Check, DollarSign, ShoppingCart, Clock3,
  TrendingUp, Search, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react'
import { Table } from '../components/Table'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { getSales, createSale } from '../api/salesService'
import { getProducts } from '../api/productService'
import api from '../api/axios'
import { ModernDashboardLayout } from '../components/ModernDashboardLayout'

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }

function Sales() {
  const toast = useToast()
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [saleFormData, setSaleFormData] = useState({ product_id: '', quantity: '' })
  const [creating, setCreating] = useState(false)

  const [stats, setStats] = useState({
    totalSales: 0, totalRevenue: 0, todaySales: 0, todayRevenue: 0
  })

  useEffect(() => { fetchData() }, [page])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [salesData, productsData, salesSummaryRes, todayOverviewRes] = await Promise.all([
        getSales(page, 15, { grouped: true }),
        getProducts(1, 100),
        api.get('/dashboard/sales-summary').catch(() => ({ data: {} })),
        api.get('/dashboard/inventory-overview', { params: { period: 'today' } }).catch(() => ({ data: {} }))
      ])

      setSales(salesData.sales || [])
      setTotalCount(salesData.total || 0)
      setTotalPages(Math.max(1, Math.ceil((salesData.total || 0) / 15)))
      setProducts(productsData.products || [])

      const summary      = salesSummaryRes.data?.summary || {}
      const todaySummary = todayOverviewRes.data?.summary || {}

      setStats({
        totalSales:   salesData.total || 0,
        totalRevenue: Number(summary.total_revenue || 0),
        todaySales:   Number(todaySummary.total_bills || 0),
        todayRevenue: Number(todaySummary.total_revenue || 0),
      })
    } catch (err) {
      console.error('Error fetching sales data:', err)
      toast.error('Failed to load sales data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSale = async () => {
    if (!saleFormData.product_id || !saleFormData.quantity) {
      toast.error('Please select a product and quantity')
      return
    }
    try {
      setCreating(true)
      await createSale(saleFormData.product_id, saleFormData.quantity)
      toast.success('Sale created successfully!')
      setShowSaleModal(false)
      setSaleFormData({ product_id: '', quantity: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create sale')
    } finally {
      setCreating(false)
    }
  }

  const salesColumns = [
    {
      key: 'transaction_id', label: 'Bill ID', width: '140px',
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2 py-1 rounded-lg">
          {v || 'N/A'}
        </span>
      )
    },
    {
      key: 'line_items', label: 'Items',
      render: (v) => (
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{v || 1} line(s)</span>
      )
    },
    { key: 'product_name', label: 'Product(s)',
      render: (v) => <span className="font-medium text-gray-900 dark:text-slate-100 line-clamp-1">{v || '—'}</span>
    },
    {
      key: 'quantity', label: 'Qty',
      render: (v) => <span className="font-semibold">{v}</span>
    },
    {
      key: 'total_amount', label: 'Amount',
      render: (v) => (
        <span className="font-bold text-gray-900 dark:text-slate-100">
          ₹{parseFloat(v || 0).toFixed(2)}
        </span>
      )
    },
    {
      key: 'sale_date', label: 'Date',
      render: (v) => (
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
      )
    },
    {
      key: 'status', label: 'Status',
      render: () => <span className="badge badge-success">Completed</span>
    }
  ]

  const filteredSales = search.trim()
    ? sales.filter(s =>
        (s.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.transaction_id || '').toLowerCase().includes(search.toLowerCase())
      )
    : sales

  return (
    <ModernDashboardLayout>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="page-header">
          <div>
            <h1 className="page-title">Sales Management</h1>
            <p className="page-subtitle">Track transactions, revenue, and daily performance</p>
          </div>
          <button onClick={() => setShowSaleModal(true)} className="btn-primary">
            <Plus size={16} /> New Sale
          </button>
        </motion.div>

        {/* ── KPI Cards ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Total Sales */}
          <div className="card p-6 group relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 opacity-[0.06]" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
                <ShoppingCart size={18} className="text-white" />
              </div>
              <span className="badge badge-primary text-[10px]">All time</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.totalSales}</p>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">Total Sales</p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Total Revenue */}
          <div className="card p-6 group relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-success-600 to-success-500 opacity-[0.06]" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-success-600 rounded-xl flex items-center justify-center shadow-sm">
                <DollarSign size={18} className="text-white" />
              </div>
              <span className="badge badge-success text-[10px]">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              ₹{stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1">Total Revenue</p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-success-600 to-success-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Today */}
          <div className="card p-6 group relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-warning-500 to-warning-400 opacity-[0.06]" />
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-warning-500 rounded-xl flex items-center justify-center shadow-sm">
                <Clock3 size={18} className="text-white" />
              </div>
              <span className="badge badge-warning text-[10px]">Today</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.todaySales}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Transactions</p>
              </div>
              <div className="border-l border-gray-100 dark:border-slate-700 pl-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  ₹{stats.todayRevenue.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Revenue</p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-warning-500 to-warning-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>

        {/* ── Sales Table ── */}
        <motion.div variants={fadeUp} className="card p-0 overflow-hidden">
          {/* Table Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-gray-100 dark:border-slate-700">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Recent Sales</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                {totalCount.toLocaleString()} total records
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product or bill ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-8 text-xs py-2"
              />
            </div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="spinner w-8 h-8" />
                <p className="text-sm text-gray-400 dark:text-slate-500">Loading sales...</p>
              </div>
            </div>
          ) : (
            <Table
              columns={salesColumns}
              data={filteredSales}
              emptyMessage="No sales recorded yet"
              emptyIcon={<ShoppingCart size={22} className="text-gray-400" />}
            />
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Page <span className="font-semibold text-gray-700 dark:text-slate-300">{page}</span> of {totalPages}
                <span className="ml-2 text-gray-400">({totalCount} records)</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="btn-secondary py-1.5 px-3 disabled:opacity-40"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="btn-secondary py-1.5 px-3 disabled:opacity-40"
                >
                  Next <ChevronRightIcon size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>

      </motion.div>

      {/* ── Create Sale Modal ── */}
      <Modal isOpen={showSaleModal} onClose={() => setShowSaleModal(false)} title="Record New Sale" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Product <span className="text-danger-500">*</span></label>
            <select
              className="input"
              value={saleFormData.product_id}
              onChange={(e) => setSaleFormData(p => ({ ...p, product_id: e.target.value }))}
            >
              <option value="">— Select a product —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stock_quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Quantity <span className="text-danger-500">*</span></label>
            <input
              type="number"
              className="input"
              placeholder="Enter quantity"
              value={saleFormData.quantity}
              onChange={(e) => setSaleFormData(p => ({ ...p, quantity: e.target.value }))}
              min="1"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button
              onClick={() => setShowSaleModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSale}
              disabled={creating}
              className="btn-primary flex-1"
            >
              {creating ? (
                <><div className="spinner w-4 h-4" /> Creating...</>
              ) : (
                <><Check size={16} /> Create Sale</>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </ModernDashboardLayout>
  )
}

export default Sales
