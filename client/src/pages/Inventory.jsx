import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, ShoppingCart, DollarSign, Filter } from 'lucide-react'
import api from '../api/axios'
import { Table } from '../components/Table'

const FILTER_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' }
]

function MetricCard({ title, value, icon: Icon, colorClass }) {
  return (
    <div className='stat-card'>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-sm text-gray-600 font-medium'>{title}</p>
          <h3 className='text-2xl font-bold text-gray-900 mt-2'>{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className='w-6 h-6' />
        </div>
      </div>
    </div>
  )
}

function Inventory() {
  const [period, setPeriod] = useState('all')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    total_bills: 0,
    total_units_sold: 0,
    total_revenue: 0,
    products_sold: 0
  })
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchOverview(period)
  }, [period])

  const fetchOverview = async (selectedPeriod) => {
    try {
      setLoading(true)
      const response = await api.get('/dashboard/inventory-overview', {
        params: { period: selectedPeriod }
      })

      setSummary({
        total_bills: Number(response.data?.summary?.total_bills || 0),
        total_units_sold: Number(response.data?.summary?.total_units_sold || 0),
        total_revenue: Number(response.data?.summary?.total_revenue || 0),
        products_sold: Number(response.data?.summary?.products_sold || 0)
      })
      setProducts(response.data?.products || [])
    } catch (error) {
      console.error('Failed to load inventory overview:', error)
      setSummary({ total_bills: 0, total_units_sold: 0, total_revenue: 0, products_sold: 0 })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const columns = useMemo(() => ([
    { key: 'name', label: 'Product' },
    { key: 'category', label: 'Category', render: (value) => value || 'N/A' },
    { key: 'brand', label: 'Brand', render: (value) => value || 'N/A' },
    { key: 'units_sold', label: 'Units Sold', render: (value) => Number(value || 0) },
    { key: 'revenue', label: 'Revenue', render: (value) => `$${Number(value || 0).toFixed(2)}` },
    {
      key: 'sale_lines',
      label: 'Bill Lines',
      render: (value) => Number(value || 0)
    }
  ]), [])

  return (
    <div className='space-y-6 p-6'>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'
      >
        <div>
          <h1 className='text-3xl font-bold text-slate-900'>Inventory</h1>
          <p className='text-sm text-slate-500 mt-1'>Sold products details with flexible date filters.</p>
        </div>

        <div className='flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2'>
          <Filter className='w-4 h-4 text-slate-500 ml-1' />
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => setPeriod(option.key)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                period === option.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6'
      >
        <MetricCard
          title='Total Bills'
          value={summary.total_bills}
          icon={ShoppingCart}
          colorClass='bg-indigo-50 text-indigo-600'
        />
        <MetricCard
          title='Total Units Sold'
          value={summary.total_units_sold}
          icon={Package}
          colorClass='bg-amber-50 text-amber-600'
        />
        <MetricCard
          title='Total Revenue'
          value={`$${summary.total_revenue.toFixed(2)}`}
          icon={DollarSign}
          colorClass='bg-emerald-50 text-emerald-600'
        />
        <MetricCard
          title='Products Sold'
          value={summary.products_sold}
          icon={Package}
          colorClass='bg-violet-50 text-violet-600'
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='card p-6'
      >
        <h2 className='text-xl font-semibold text-slate-900 mb-1'>Sold Products</h2>
        <p className='text-sm text-slate-500 mb-6'>How much each product has sold in the selected period.</p>

        {loading ? (
          <div className='text-center py-10'>
            <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto'></div>
            <p className='text-slate-500 mt-3'>Loading inventory details...</p>
          </div>
        ) : (
          <Table columns={columns} data={products} />
        )}
      </motion.div>
    </div>
  )
}

export default Inventory
