import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Brush } from 'recharts'
import { TrendingUp, Receipt } from 'lucide-react'
import api from '../api/axios'

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    daily_trend: [],
    total_revenue: 0,
    total_sales: 0
  })
  const [loading, setLoading] = useState(true)
  const averageDailyRevenue = dashboardData.daily_trend.length > 0
    ? dashboardData.daily_trend.reduce((sum, item) => sum + Number(item.revenue || 0), 0) / dashboardData.daily_trend.length
    : 0

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(Number(value || 0))
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [dailyRes, statsRes] = await Promise.all([
        api.get('/dashboard/daily-trend'),
        api.get('/dashboard')
      ]).catch(() => [{}, {}])

      const daily = dailyRes.data?.daily_trend || []
      const stats = statsRes.data || {}

      setDashboardData({
        daily_trend: daily,
        total_revenue: stats.total_revenue || 0,
        total_sales: stats.total_sales || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardData({
        daily_trend: [],
        total_revenue: 0,
        total_sales: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-slate-600 mt-4 font-medium">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Revenue pulse and sales performance at a glance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500 font-semibold">Total Revenue</p>
            <TrendingUp className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">{formatCurrency(dashboardData.total_revenue)}</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500 font-semibold">Total Sales</p>
            <Receipt className="w-5 h-5 text-accent-600" />
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">{dashboardData.total_sales}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-display font-semibold text-slate-900 mb-4">Daily Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.daily_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
              <Legend />
              <ReferenceLine y={averageDailyRevenue} stroke="#94a3b8" strokeDasharray="6 6" label={{ value: 'Avg', fill: '#64748b', fontSize: 11 }} />
              <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} />
              {dashboardData.daily_trend.length > 8 && <Brush dataKey="date" height={18} stroke="#0ea5e9" travellerWidth={8} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
