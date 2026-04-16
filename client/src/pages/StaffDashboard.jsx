import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, ShoppingCart, TrendingUp } from 'lucide-react'
import api from '../api/axios'
import { getLowStockProducts } from '../api/productService'
import { StatsCard } from '../components/Cards'
import { Table } from '../components/Table'
import { SalesChart } from '../components/Charts'

function StaffDashboard() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [salesTrendData, setSalesTrendData] = useState([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    todaySales: 0,
    pendingOrders: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, salesRes, lowStockRes, todaySalesRes] = await Promise.all([
        api.get('/products').catch(() => ({ data: {} })),
        api.get('/sales', { params: { limit: 100 } }).catch(() => ({ data: {} })),
        getLowStockProducts().catch(() => ({ low_stock_products: [] })),
        api.get('/dashboard/sales-summary', {
          params: { period: 'today' }
        }).catch(() => ({ data: {} }))
      ])

      const productsList = productsRes.data?.products || []
      const salesList = salesRes.data?.sales || []
      const lowStockProducts = lowStockRes.low_stock_products || []
      const todaySummary = todaySalesRes.data?.summary || {}

      setProducts(productsList.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        stock: p.stock_quantity,
        price: `$${p.selling_price}`,
        status: Number(p.stock_quantity) === 0
          ? 'Out of Stock'
          : Number(p.stock_quantity) <= Number(p.reorder_level || 10)
            ? 'Low'
            : 'In Stock'
      })))

      setStats({
        totalProducts: productsList.length,
        lowStock: lowStockProducts.length,
        todaySales: Number(todaySummary.total_orders || 0),
        pendingOrders: 8
      })

      // Last 7 days revenue trend for interactive staff sales analytics.
      const today = new Date()
      const dayKeys = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date(today)
        date.setDate(today.getDate() - (6 - index))
        return date.toDateString()
      })

      const salesByDay = salesList.reduce((acc, sale) => {
        const saleDate = new Date(sale.sale_date)
        const key = saleDate.toDateString()
        acc[key] = (acc[key] || 0) + Number(sale.total_amount || 0)
        return acc
      }, {})

      setSalesTrendData(
        dayKeys.map((key) => ({
          day: new Date(key).toLocaleDateString(undefined, { weekday: 'short' }),
          sales: Number(salesByDay[key] || 0)
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { title: 'Total Products', value: stats.totalProducts, icon: Package },
    { title: 'Low Stock Items', value: stats.lowStock, icon: AlertTriangle, color: 'red' },
    { title: "Today's Sales", value: stats.todaySales, icon: ShoppingCart, color: 'green' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: TrendingUp, color: 'blue' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage inventory and sales operations</p>
      </div>

      <div className="grid grid-auto-fit-lg">
        {statCards.map((stat, idx) => (
          <StatsCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>
            <button className="btn btn-primary text-sm py-2 px-4">+ Add Product</button>
          </div>
          {products.length > 0 ? (
            <Table
              columns={[
                { key: 'name', label: 'Product Name' },
                { key: 'category', label: 'Category' },
                { key: 'stock', label: 'Stock' },
                { key: 'price', label: 'Price' },
                {
                  key: 'status',
                  label: 'Status',
                  render: (status) => (
                    <span className={`badge ${
                      status === 'Out of Stock'
                        ? 'badge-danger'
                        : status === 'Low'
                        ? 'badge-warning'
                        : 'badge-success'
                    }`}>
                      {status}
                    </span>
                  )
                }
              ]}
              data={products}
              actions={[
                { label: 'Edit', handler: (row) => console.log('Edit', row) },
                { label: 'Delete', handler: (row) => console.log('Delete', row), className: 'text-red-600' }
              ]}
            />
          ) : (
            <p className="text-center text-gray-500 py-8">No products available</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={() => navigate('/billing')} className="w-full btn btn-primary">Record Sale</button>
              <button onClick={() => navigate('/inventory')} className="w-full btn btn-secondary">Check Inventory</button>
              <button onClick={() => navigate('/reports')} className="w-full btn btn-secondary">View Reports</button>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-amber-50 to-orange-50">
            <h3 className="text-lg font-semibold text-amber-900 mb-2">Low Stock Alert</h3>
            <p className="text-sm text-amber-800">{stats.lowStock} products need reordering</p>
            <button className="mt-4 w-full btn bg-amber-600 text-white hover:bg-amber-700">
              Manage Now
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
        <SalesChart data={salesTrendData} />
      </div>
    </motion.div>
  )
}

export default StaffDashboard
