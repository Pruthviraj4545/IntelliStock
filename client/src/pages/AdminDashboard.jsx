import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Package, ShoppingCart, AlertTriangle, Activity, TrendingUp } from 'lucide-react'
import api from '../api/axios'
import { StatsCard, GradientCard, DataCard } from '../components/Cards'
import { Table } from '../components/Table'
import { RevenueChart, DemandForecastChart, InventoryTrendChart } from '../components/Charts'
import { getLowStockProducts } from '../api/productService'
import { useNavigate } from 'react-router-dom'

function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    recentSales: [],
    lowStockItems: [],
    revenueTrendData: [],
    demandForecastData: [],
    inventoryTrendData: [],
    quickStats: {
      activeProducts: 0,
      pendingOrders: 0,
      conversionRate: 0,
      avgOrderValue: 0,
      growthRate: 0,
      stockValue: 0,
      avgStockPerProduct: 0
    }
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [salesRes, productsRes, dashboardRes, inventoryRes, monthlyRevenueRes, lowStockRes, todayOverviewRes] = await Promise.all([
        api.get('/sales'),
        api.get('/products'),
        api.get('/dashboard'),
        api.get('/dashboard/inventory-value'),
        api.get('/dashboard/monthly-revenue'),
        getLowStockProducts().catch(() => ({ low_stock_products: [] })),
        api.get('/dashboard/inventory-overview', { params: { period: 'today' } }).catch(() => ({ data: {} }))
      ])

      const sales = salesRes.data?.sales || []
      const products = productsRes.data?.products || []
      const dashboard = dashboardRes.data || {}
      const inventory = inventoryRes.data?.inventory_valuation || {}
      const monthlyRevenue = monthlyRevenueRes.data?.monthly_revenue || []
      const lowStockProducts = lowStockRes.low_stock_products || []
      const todayOverview = todayOverviewRes.data?.summary || {}

      const totalRevenue = Number(dashboard.total_revenue || 0)
      const totalSales = Number(dashboard.total_sales || 0)
      const totalProducts = Number(dashboard.total_products || products.length || 0)
      const lowStockCount = Number(dashboard.low_stock_products || lowStockProducts.length || 0)

      const todaySales = Number(todayOverview.total_revenue || 0)

      const previousMonth = monthlyRevenue.length >= 2 ? Number(monthlyRevenue[monthlyRevenue.length - 2].revenue || 0) : 0
      const latestMonth = monthlyRevenue.length >= 1 ? Number(monthlyRevenue[monthlyRevenue.length - 1].revenue || 0) : 0
      const growthRate = previousMonth > 0 ? ((latestMonth - previousMonth) / previousMonth) * 100 : 0

      const recentSales = sales.slice(0, 5).map((sale) => ({
        id: sale.id,
        product: sale.product_name,
        amount: `$${Number(sale.total_amount || 0).toFixed(2)}`,
        date: new Date(sale.sale_date).toLocaleDateString(),
        status: 'Completed'
      }))

      const lowStockItems = lowStockProducts
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          name: item.name,
          stock: item.stock_quantity,
          reorder: item.reorder_level || 10,
          status: Number(item.stock_quantity) === 0 ? 'Out of Stock' : 'Low Stock'
        }))

      const revenueTrendData = monthlyRevenue.map((entry) => ({
        date: entry.month,
        revenue: Number(entry.revenue || 0)
      }))

      const recentRevenue = revenueTrendData.slice(-4).map((entry) => Number(entry.revenue || 0))
      const latestRevenue = recentRevenue.length > 0 ? recentRevenue[recentRevenue.length - 1] : Number(totalRevenue || 0) / 6
      const growthSamples = recentRevenue.slice(1).map((value, index) => {
        const prev = recentRevenue[index] || 0
        if (prev <= 0) return 0
        return (value - prev) / prev
      })
      const avgGrowth = growthSamples.length > 0
        ? growthSamples.reduce((sum, value) => sum + value, 0) / growthSamples.length
        : 0.05

      const latestMonthText = revenueTrendData[revenueTrendData.length - 1]?.date
      const parsedLatestMonth = latestMonthText ? new Date(`${latestMonthText}-01`) : new Date()
      const baseDate = Number.isNaN(parsedLatestMonth.getTime()) ? new Date() : parsedLatestMonth

      const demandForecastData = Array.from({ length: 6 }).map((_, index) => {
        const projected = Number(latestRevenue || 0) * Math.pow(1 + avgGrowth, index + 1)
        const pointDate = new Date(baseDate)
        pointDate.setMonth(baseDate.getMonth() + index + 1)
        return {
          month: pointDate.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
          forecast: Math.max(0, Math.round(projected))
        }
      })

      const inStockCount = Math.max(Number(dashboard.active_products || totalProducts || 0) - lowStockCount, 0)
      const lowStockOnlyCount = lowStockProducts.filter((product) => Number(product.stock_quantity) > 0 && Number(product.stock_quantity) <= Number(product.reorder_level || 10)).length
      const outOfStockCount = lowStockProducts.filter((product) => Number(product.stock_quantity) === 0).length

      const inventoryTrendData = [{
        month: 'Current',
        inStock: inStockCount,
        lowStock: lowStockOnlyCount,
        outOfStock: outOfStockCount
      }]

      setDashboardData({
        stats: [
          {
            title: 'Total Revenue',
            value: `$${totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'indigo'
          },
          {
            title: 'Total Products',
            value: totalProducts.toString(),
            icon: Package,
            color: 'blue'
          },
          {
            title: 'Low Stock Alerts',
            value: lowStockCount.toString(),
            icon: AlertTriangle,
            color: 'red'
          },
          {
            title: "Today's Sales",
            value: `$${todaySales.toLocaleString()}`,
            icon: ShoppingCart,
            color: 'green'
          }
        ],
        recentSales,
        lowStockItems,
        revenueTrendData,
        demandForecastData,
        inventoryTrendData,
        quickStats: {
          activeProducts: Number(dashboard.active_products || 0),
          pendingOrders: lowStockCount,
          conversionRate: totalProducts > 0 ? (totalSales / totalProducts) * 100 : 0,
          avgOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0,
          growthRate,
          stockValue: Number(inventory.total_inventory_value || 0),
          avgStockPerProduct: Number(inventory.avg_stock_per_product || 0)
        }
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your business overview</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-auto-fit-lg">
        {dashboardData.stats.map((stat, idx) => (
          <StatsCard key={idx} {...stat} />
        ))}
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <RevenueChart data={dashboardData.revenueTrendData} />
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Forecast (AI)</h3>
          <DemandForecastChart data={dashboardData.demandForecastData} />
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GradientCard title="Quick Stats" icon={Activity} color="from-indigo-500 to-purple-500">
          <div className="space-y-3">
            <DataCard label="Active Products" value={dashboardData.quickStats.activeProducts} />
            <DataCard label="Pending Reorders" value={dashboardData.quickStats.pendingOrders} />
            <DataCard label="Conversion Rate" value={dashboardData.quickStats.conversionRate.toFixed(1)} suffix="%" />
          </div>
        </GradientCard>

        <GradientCard title="Performance" icon={TrendingUp} color="from-green-500 to-emerald-500">
          <div className="space-y-3">
            <DataCard label="Avg Order Value" value={`$${dashboardData.quickStats.avgOrderValue.toFixed(2)}`} />
            <DataCard label="Growth Rate" value={dashboardData.quickStats.growthRate.toFixed(1)} suffix="%" />
            <DataCard label="Sales Records" value={dashboardData.recentSales.length} />
          </div>
        </GradientCard>

        <GradientCard title="Inventory Status" icon={Package} color="from-amber-500 to-orange-500">
          <div className="space-y-3">
            <DataCard label="Total Stock Value" value={`$${dashboardData.quickStats.stockValue.toFixed(2)}`} />
            <DataCard label="Avg Stock / Product" value={dashboardData.quickStats.avgStockPerProduct.toFixed(1)} />
            <DataCard label="Low Stock Items" value={dashboardData.lowStockItems.length} />
          </div>
        </GradientCard>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
            <button
              onClick={() => navigate('/sales')}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              View all sales
            </button>
          </div>
          {dashboardData.recentSales.length > 0 ? (
            <Table
              columns={[
                { key: 'product', label: 'Product' },
                { key: 'amount', label: 'Amount' },
                { key: 'date', label: 'Date' }
              ]}
              data={dashboardData.recentSales}
            />
          ) : (
            <p className="text-gray-500 text-center py-8">No sales data available</p>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Low Stock Alerts
            </h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-700">Manage</button>
          </div>
          {dashboardData.lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.lowStockItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">Stock: {item.stock} / Reorder: {item.reorder}</p>
                  </div>
                  <span className={`badge ${item.status === 'Out of Stock' ? 'badge-danger' : 'badge-warning'}`}>
                    {item.status}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">All items well stocked</p>
          )}
        </div>
      </motion.div>

      <motion.div variants={item} className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Trend</h3>
        <InventoryTrendChart data={dashboardData.inventoryTrendData} />
      </motion.div>
    </motion.div>
  )
}

export default AdminDashboard
