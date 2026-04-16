import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Brush, Area, AreaChart } from 'recharts'
import { motion } from 'framer-motion'

function RevenueChart({ data, title = "Revenue Trend" }) {
  const [windowSize, setWindowSize] = useState('all')

  const normalizedData = Array.isArray(data)
    ? data
        .map((item) => {
          const label = item?.month || item?.date || item?.label || 'Unknown'
          const revenueValue = Number(item?.revenue ?? item?.value ?? 0)
          return {
            label,
            revenue: Number.isFinite(revenueValue) ? revenueValue : 0
          }
        })
        .filter((item) => item.label)
    : []

  const filteredData = useMemo(() => {
    if (windowSize === 'all') return normalizedData
    const size = Number(windowSize)
    return normalizedData.slice(-size)
  }, [normalizedData, windowSize])

  const chartData = filteredData.length > 0 ? filteredData : [{ label: 'No Data', revenue: 0 }]
  const avgRevenue = chartData.length > 0 ? chartData.reduce((sum, item) => sum + Number(item.revenue || 0), 0) / chartData.length : 0
  const peakRevenue = chartData.length > 0 ? Math.max(...chartData.map((item) => Number(item.revenue || 0))) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">Monthly revenue performance</p>
      </div>

      <div className="h-80 relative">
        <div className="absolute right-0 top-0 z-10 flex items-center gap-1 rounded-lg bg-white/90 px-1 py-1 shadow-sm border border-slate-200">
          {[
            { key: '6', label: '6' },
            { key: '12', label: '12' },
            { key: 'all', label: 'All' }
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setWindowSize(option.key)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${windowSize === option.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 28, right: 12, left: 4, bottom: 8 }}>
            <defs>
              <linearGradient id="analyticsRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `₹${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => [
                `₹${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                'Revenue'
              ]}
            />
            <ReferenceLine y={avgRevenue} stroke="#94a3b8" strokeDasharray="6 6" label={{ value: 'Avg', fill: '#64748b', fontSize: 11 }} />
            <Area type="monotone" dataKey="revenue" stroke="none" fill="url(#analyticsRevenueGradient)" />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: '#6366f1', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#6366f1', strokeWidth: 2, fill: 'white' }}
            />
            {chartData.length > 8 && <Brush dataKey="label" height={18} stroke="#6366f1" travellerWidth={8} />}
          </AreaChart>
        </ResponsiveContainer>

        <div className="absolute left-0 bottom-0 text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
          Peak: ₹{peakRevenue.toLocaleString()}
        </div>
      </div>
    </motion.div>
  )
}

export default RevenueChart